# Chat with Socket.io (node.js)
Writing a chat application with popular web applications stacks like LAMP (PHP) has traditionally been very hard. It involves polling the server for changes, keeping track of timestamps, and it’s a lot slower than it should be.

Sockets have traditionally been the solution around which most realtime chat systems are architected, providing a bi-directional communication channel between a client and a server.

This means that the server can push messages to clients. Whenever you write a chat message, the idea is that the server will get it and push it to all other connected clients.

## Installation

### Requirements
* Node.JS (https://nodejs.org/en/)
* Node.JS web framework express

## Getting Staarted
* donwload files from branch [bus-lab1]: https://github.com/pwr-zak/218592/tree/bus-lab1
* install express, run commend in chat folder "../bus-lab1/chat/": 'npm install --save express@4.15.2'
* run commend in chat folder: 'node index'
* in the web browser: 'http://localhost:3000/'

## Author
* Mariusz Najwer - 218592@student.pwr.edu.pl

## License
This project is licensed under the MIT License - see the LICENSE.md file for details