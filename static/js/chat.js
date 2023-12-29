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

const updateUsers = (users) => {
	usersHeading.innerHTML = users.usernames.join(", ");
}

let currentImages = []

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
	
	document.addEventListener('keydown', async (e) => {
		if (e.key === 'Enter' && (textInput.value.length > 0 || currentImages.length > 0)) {
			const serverImageNames = await Promise.all(currentImages.map(postImage));
			const text = textInput.value;
			socket.emit('message', {
				username: username,
				text: text,
				images: serverImageNames
			});
			textInput.value = "";
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

const createMessageBubble = (message) => {
	const side = message.username === username ? 'self' : 'other';
	const div = document.createElement('div');
	div.classList.add('message', side, 'fade-up');

	div.appendChild(createUsername(message.username));

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

const createUsername = (username) => {
	const div = document.createElement('div');
	div.innerHTML = `${username}:`;
	const br = document.createElement('br');
	div.appendChild(br);
	return div;
}

const createText = (text) => {
	const div = document.createElement('div');
	div.innerHTML = text;
	return div;
}

const createImage = (src) => {
	const div = document.createElement('div');
	const image = document.createElement('img');
	image.src = `/static/images/${src}`;
	div.appendChild(image);
	const br = document.createElement('br');
	div.appendChild(br);
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