import codecs
from datetime import datetime
import os
import requests

escapeUnicode = False

os.system('clear')
username = input("Username: ")

while True:
	os.system('clear')
	message = input("Message: ")
	if escapeUnicode:
		message = codecs.decode(message, 'unicode-escape')
	requests.post('http://10.21.98.63:7070/message', json={'username': username, 'text': message, 'time': datetime.now().isoformat()})
