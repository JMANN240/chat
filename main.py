import os
from flask import Flask, render_template, request, redirect, url_for
from flask_socketio import SocketIO
from werkzeug.utils import secure_filename
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins='*')

users = {}

@app.route('/')
def chat():
	return render_template('chat.html')

def sendUsers():
	socketio.emit('users', users)

@socketio.on('connect')
def connect(auth):
	username = auth['username']
	users[request.sid] = {
		'username': username,
		'status': 'idle'
	}

	socketio.emit('message', {
		'username': 'SERVER',
		'time': datetime.now().isoformat(),
		'text': f"{username} has joined!"
	})

	sendUsers()

@socketio.on('disconnect')
def disconnect():
	user = users[request.sid]
	del users[request.sid]

	socketio.emit('message', {
		'username': 'SERVER',
		'time': datetime.now().isoformat(),
		'text': f"{user['username']} has left!"
	})

	sendUsers()

@socketio.on('message')
def message(data):
	print(f"{data['username']}: {data['text']}")
	socketio.emit('message', data)

@socketio.on('status')
def status(data):
	users[request.sid]['status'] = data['status']
	sendUsers()

def allowed_file(filename):
	return '.' in filename and \
		filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
IMAGE_FOLDER = 'static/images'

@app.route('/image', methods=['POST'])
def image():
	if request.method == 'POST':
		if 'image' not in request.files:
			return "Image not provided", 400
		image = request.files['image']
		if image.filename == '':
			return "Image not provided", 400
		if image and allowed_file(image.filename):
			filename = secure_filename(image.filename)
			image.save(os.path.join(IMAGE_FOLDER, filename))
			return filename


if __name__ == '__main__':
	socketio.run(app, host='0.0.0.0', port=7070, debug=True)