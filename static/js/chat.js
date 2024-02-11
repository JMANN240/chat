const root = document.querySelector(':root');
const usersHeading = document.querySelector('#users-heading');
const chat = document.querySelector('#chat');
const anchor = document.querySelector('#anchor');
const textInput = document.querySelector('#text-input');
const usernameModal = document.querySelector('#username-modal');
const usernameForm = document.querySelector('#username-form');
const usernameInput = document.querySelector('#username-input');
const imageInput = document.querySelector('#image-input');
const imagesDiv = document.querySelector('#images-div');

const quack = new Audio('/static/audio/quack.mp3');

const calculateScrollPercent = (element) => {
	const scrollHeight = element.scrollHeight;
	const clientHeight = element.clientHeight;
	const scrollRange = scrollHeight - clientHeight;
	if (scrollRange == 0) {
		return 1;
	}
	const scrollTop = element.scrollTop;
	const scrollPercent = scrollTop / scrollRange;
	return scrollPercent;
}

let goingToBottom = false;
let atBottom = true;

chat.addEventListener('scroll', () => {
	atBottom = calculateScrollPercent(chat) >= 0.999;
	if (atBottom) {
		goingToBottom = false;
	}
})

const updateUsers = (users) => {
	let userStates = [];
	for (let sid in users) {
		const user = users[sid];
		const status = user.status;
		let state = user.username;
		if (status === 'typing') {
			state += ' is typing';
		}
		userStates.push(state);
	}
	usersHeading.innerHTML = userStates.join(", ");
}

let currentImages = []

const getCss = (element, key) => {
	const style = getComputedStyle(element)
	return style.getPropertyValue(key);
}

const setCss = (element, key, value) => {
	element.style.setProperty(key, value);
}

const getRootCss = (key) => {
	return getCss(root, key);
}

const setRootCss = (key, value) => {
	return setCss(root, key, value);
}

const parseCommand = (message) => {
	if (message.text[0] === '/') {
		const command = message.text.slice(1);
		const tokens = command.split(' ');
		const type = tokens[0];
		if (type === 'css') {
			key = tokens[1];
			value = tokens[2];
			setRootCss(key, value);
		} else if (type === 'rawcss') {
			const argsString = tokens.slice(1).join(' ');
			const argStrings = argsString.split('~');
			for (let argString of argStrings) {
				const args = argString.split('|');
				document.querySelectorAll(args[0]).forEach((element) => {
					setCss(element, args[1], args[2]);
				});
			}
		} else if (type === 'refresh') {
			location.reload();
		} else if (type === 'kick' && tokens.slice(1).join(' ') === username) {
			// socket.close();
		}
	}
}

let socket;

const socketSetup = () => {
	socket = io({
		auth: {
			username: username
		}
	});
	
	socket.on('users', (data) => {
		console.log("Got users: ", data);
		updateUsers(data)
	});
	
	socket.on('message', (data) => {
		console.log("Got message: ", data);
		quack.cloneNode(true).play();
		if (data.text.includes(username)) {
			for (let i = 1; i < 10; i++) {
				setTimeout(() => {
					quack.cloneNode(true).play();
				}, 100*i);
			}
		}
		addMessageBubble(data);
		parseCommand(data);
		createNotification(data);
	});

	const setUserStatus = (status) => {
		socket.emit('status', {
			status: status
		})
	}

	let previousTextInputLength = 0;

	textInput.addEventListener('input', () => {
		if (previousTextInputLength == 0 && textInput.value.length > 0) {
			setUserStatus('typing');
		} else if (previousTextInputLength > 0 && textInput.value.length == 0) {
			setUserStatus('idle');
		}

		previousTextInputLength = textInput.value.length;
	});
	
	document.addEventListener('keydown', async (e) => {
		if (e.key === 'Enter' && (textInput.value.length > 0 || currentImages.length > 0)) {
			goingToBottom = true;
			const serverImageNames = await Promise.all(currentImages.map(postImage));
			const text = textInput.value;
			console.log("Sending message.");
			socket.emit('message', {
				username: username,
				text: text,
				images: serverImageNames,
				time: new Date()
			});
			textInput.value = "";
			previousTextInputLength = textInput.value.length
			setUserStatus('idle');
			currentImages = [];
			imagesDiv.innerHTML = '';
			imagesDiv.style.display = 'none';
		}
	});

	const addImage = async (image) => {
		const img = document.createElement('img');
		img.src = URL.createObjectURL(image);
		imagesDiv.appendChild(img);
		currentImages.push(image);
		imagesDiv.style.display = 'flex';
	}

	const postImage = async (image) => {
		const formData = new FormData();
		formData.append('image', image);

		const res = await fetch('/image', {
			method: 'POST',
			body: formData
		});

		return await res.text();
	}

	imageInput.addEventListener('change', async (e) => {
		for (let image of imageInput.files) {
			await addImage(image);
		}
	});

	document.addEventListener('paste', async (e) => {
		const items = e.clipboardData.items;
		for (let item of items) {
			if (item.kind == 'file') {
				const ext = item.type.split('/')[1];
				const blob = item.getAsFile();
				await addImage(new File([blob], `img_${new Date().toISOString()}.${ext}`));
			}
		}
	});
}

const createNotification = (message) => {
	new Notification("Programmer Chat", {
		body: `${message.username}: ${message.text}`
	})
}

const createMessageBubble = (message) => {
	console.log("Building message bubble.");
	const side = message.username === username ? 'self' : 'other';
	const div = document.createElement('div');
	div.classList.add('message', side, 'fade-up');

	div.appendChild(createUsername(message.username, message.time));

	if (message.images) {
		for (let image of message.images) {
			div.appendChild(createImage(image))
		}
	}

	if (message.text) {
		div.appendChild(createText(message.text));
	}

	return div;
}

const createUsername = (username, time) => {
	console.log("Building message bubble header line.");
	const div = document.createElement('div');
	const span = document.createElement('span');
	span.classList.add('message-header')
	span.innerHTML = `${username} at ${new Date(time).toLocaleString()}:`;
	div.appendChild(span);
	const br = document.createElement('br');
	div.appendChild(br);
	return div;
}

const createText = (text) => {
	console.log("Building message bubble body.");
	text = text.replace(/\*\*(\S.*?\S|\S)\*\*/g, "<b>$1</b>") // Bolds must be done first
	text = text.replace(/\*(\S.*?\S|\S)\*/g, "<i>$1</i>") // Then italics
	if (!text.startsWith('<iframe')) {
		text = text.replace(/((https?):\/\/www.youtube.com(:\d+)?((?:\/[^\s\/\?]+)*\/?)?(?:\?(\S+=[^\s"]+&?)*)?)/g, '<iframe width="560" height="315" src="$1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>') // Auto-embed YouTube videos
		if (!text.startsWith('<iframe')) {
			text = text.replace(/((https?):\/\/((?:[^\s\.\/]+\.)+\w+)(:\d+)?((?:\/[^\s\/\?]+)*\/?)?(?:\?(\S+=[^\s"]+&?)*)?)/g, "<a href=\"$1\" target=\"_blank\">$1</a>"); // Links
			text = text.replace(/(<iframe.+src=")<a href="(.+?)".+<\/a>(".+?<\/iframe>)/g, "$1$2$3"); // Stupid link fix
		} else {
			text = text.replace(/watch\?.*v=([^&"]+)/g, "embed/$1"); // YouTube embedding
		}
	}
	const div = document.createElement('div');
	div.innerHTML = text;
	return div;
}

const createImage = (src) => {
	console.log(`Building message bubble image '${src}'.`);
	const div = document.createElement('div');
	const image = document.createElement('img');
	image.src = `/static/images/${src}`;
	div.appendChild(image);
	const br = document.createElement('br');
	div.appendChild(br);
	return div;
}

const addMessageBubble = (message) => {
	console.log("Adding message bubble to chat.");
	const wasAtBottom = atBottom;
	const messageBubble = createMessageBubble(message);
	chat.appendChild(messageBubble);
	if (wasAtBottom || goingToBottom) {
		chat.scrollTop = chat.scrollHeight;
	}

}

let username;

usernameModal.showModal();

const requestNotificationPermission = async () => {
	if (Notification.permission === 'default') {
		Notification.requestPermission();
	}
}

usernameForm.addEventListener('submit', (e) => {
	e.preventDefault();
	if (usernameInput.value.match(/^.*\S.*$/)) {
		username = usernameInput.value;
		socketSetup();
		requestNotificationPermission();
		usernameModal.close();
	}
});