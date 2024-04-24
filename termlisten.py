from datetime import datetime
import os
import socketio

messagePrepend = '\033[0m'

userColors = {
	'Devon': '\033[31m',
	'Théodore Mausolée': '\033[32m'
}

sio = socketio.Client()

@sio.event
def message(data):
	dt = datetime.fromisoformat(data['time'])
	userColor = userColors.get(data['username'], '')
	print(f"{messagePrepend}[{dt.strftime('%I:%M:%S %p')}] {userColor}{data['username']}: {data['text']}")

os.system('clear')
sio.connect('http://10.21.98.63:7070', auth={'username': 'listener'})
while True:
	sio.wait()
