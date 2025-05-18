from socket import *

serverPort = 12000
serverSocket = socket(AF_INET,SOCK_DGRAM)

serverAddresse = ("",serverPort)

serverSocket.bind(serverAddresse)

while True:
    message, clientAddress = serverSocket.recvfrom(2048)
    print(message.decode())
    modifiedMessage = message.decode().upper()
    serverSocket.sendto(modifiedMessage.encode(),clientAddress)
