from datetime import datetime
import os
import logging

from flask import Flask, render_template, request, redirect, url_for
from flask_socketio import SocketIO
from werkzeug.utils import secure_filename

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins='*')

users = {}

stickers = {}

@app.route('/')
def chat():
	return render_template('chat.html')

def sendUsers():
	logging.info("Emitting updated users.")
	logging.info(f"Users: {', '.join([user['username'] for user in users.values()])}")
	socketio.emit('users', users)

@socketio.on('connect')
def connect(auth):
	username = auth['username']

	logging.info(f"{username} connected.")
	logging.info(f"SID: {request.sid}")

	users[request.sid] = {
		'username': username,
		'status': 'idle'
	}

	logging.info("Emitting.")
	socketio.emit('message', {
		'username': 'SERVER',
		'time': datetime.now().isoformat(),
		'text': f"{username} has joined!"
	})

	sendUsers()

@socketio.on('disconnect')
def disconnect():
	user = users[request.sid]
	logging.info(f"{user['username']} disconnected.")
	del users[request.sid]

	logging.info("Emitting.")
	socketio.emit('message', {
		'username': 'SERVER',
		'time': datetime.now().isoformat(),
		'text': f"{user['username']} has left!"
	})

	sendUsers()

def message(data):
	logging.info("Received message.")
	logging.info(data)
	logging.info(f"{data['username']}: {data['text']}")
	if (data['text'].strip() == ""):
		return
	tokens = data['text'].split(' ')
	if tokens[0] == '/sticker':
		stickers[tokens[1]] = tokens[2]
	else:
		logging.info("Emitting.")
		for stickerName, stickerFile in stickers.items():
			data['text'] = data['text'].replace(f':{stickerName}:', f'<img src="/static/uploads/{stickerFile}"></img>')
		socketio.emit('message', data)

@app.route('/message', methods=['POST'])
def httpMessage():
	message(request.json)
	return ''

@socketio.on('message')
def wsMessage(data):
	message(data)

@socketio.on('status')
def status(data):
	user = users[request.sid]
	logging.info(f"Received status update for {user['username']}.")
	user['status'] = data['status']
	sendUsers()

def allowed_file(filename):
	return '.' in filename and \
		filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp3', 'wav'}
UPLOAD_FOLDER = 'static/uploads'

@app.route('/upload', methods=['POST'])
def upload():
	logging.info("Got upload.")
	if 'file' not in request.files:
		return "Upload not provided", 400
	file = request.files['file']
	if file.filename == '':
		return "Upload not provided", 400
	if file and allowed_file(file.filename):
		filename = secure_filename(file.filename)
		filepath = os.path.join(UPLOAD_FOLDER, filename)
		logging.info(f"Saving image to {filepath}")
		file.save(filepath)
		return filename


if __name__ == '__main__':
	socketio.run(app, host='0.0.0.0', port=7070, debug=True)
