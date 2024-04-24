import codecs
from datetime import datetime
import os
import requests

os.system('clear')
username = input("Username: ")

while True:
	os.system('clear')
	message = codecs.decode(input("Message: "), 'unicode-escape')
	requests.post('http://10.21.98.63:7070/message', json={'username': username, 'text': message, 'time': datetime.now().isoformat()})
