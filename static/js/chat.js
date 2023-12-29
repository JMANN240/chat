const usersHeading = document.querySelector('#users-heading');
const chat = document.querySelector('#chat');
const anchor = document.querySelector('#anchor');
const textInput = document.querySelector('#text-input');
const usernameModal = document.querySelector('#username-modal');
const usernameForm = document.querySelector('#username-form');
const usernameInput = document.querySelector('#username-input');
const imageInput = document.querySelector('#image-input');

const quack = new Audio('/static/audio/quack.mp3');

const updateUsers = (users) => {
	usersHeading.innerHTML = users.usernames.join(", ");
}

const socketSetup = () => {
	const socket = io({
		auth: {
			username: username
		}
	});
	
	socket.on('users', (data) => {
		updateUsers(data)
	});
	
	socket.on('message', (data) => {
		quack.cloneNode(true).play();
		addMessageBubble(data);
	});
	
	textInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			const text = textInput.value;
			socket.emit('message', {
				username: username,
				message: text,
				type: 'text'
			});
			textInput.value = "";
		}
	});

	const addImage = async (image) => {
		console.log(image);
		const formData = new FormData();
		formData.append('image', image);
		const res = await fetch('/image', {
			method: 'POST',
			body: formData
		});
		const serverFilename = await res.text();
		socket.emit('message', {
			username: username,
			src: `/static/images/${serverFilename}`,
			type: 'image'
		});
	}

	imageInput.addEventListener('input', async (e) => {
		await addImage(imageInput.files[0]);
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

const createMessageBubble = (message) => {
	const side = message.username === username ? 'self' : 'other';
	const div = document.createElement('div');
	div.classList.add('message', side, 'fade-up');
	if (message.type === 'text') {
		div.appendChild(createTextBubble(message));
	} else if (message.type === 'image') {
		div.appendChild(createImageBubble(message));
	}
	return div;
}

const createTextBubble = (message) => {
	const div = document.createElement('div');
	div.innerHTML = `${message.username}: ${message.message}`;
	return div;
}

const createImageBubble = (message) => {
	const div = document.createElement('div');
	div.innerHTML = `${message.username}:`;
	const br = document.createElement('br');
	div.appendChild(br);
	const image = document.createElement('img');
	image.src = message.src;
	div.appendChild(image);
	return div;
}

const addMessageBubble = (message) => {
	const messageBubble = createMessageBubble(message);
	chat.insertBefore(messageBubble, anchor);
	anchor.scrollIntoView();
}

let username;

usernameModal.showModal();

usernameForm.addEventListener('submit', (e) => {
	e.preventDefault();
	if (usernameInput.value.match(/^.*\w.*$/)) {
		username = usernameInput.value;
		socketSetup();
		usernameModal.close();
	}
});