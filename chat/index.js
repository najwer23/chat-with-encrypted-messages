var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));

//in - minimal number and max number
//out - random number between max and min
function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// return prime, if ranmdom number is 61, next prime is 67!
function primeNumber(){
  return prime(randomNumber(2, 61));
}

// object User of json array
var User = {
  user: []
};

// id - socket id client
// b - private key selected
// P - prim number
// G - a primitive root of P
// y - public key, genrated in server
// x - public key from client
// keyServer - generated private key
// encryption - encryption
function initUser(idUser) {
  var G = primeNumber();
  var P = primeNumber();
  var b = randomNumber(2,5);
  var y = Math.pow(G, b) % P;
  
  User.user.push({
    "id": idUser,
    "b": b,
    "P": P,
    "G": G,
    "y": y,
    "x": 0,
    "keyServer": 0,
    "encryption": "none",
  });
}


io.on('connection', function (socket) {

  console.log('user connected');
  console.log('client id - ' + socket.id);
  initUser(socket.id);

  //send keys to client
  socket.on('connectionWithKeys', function (getKey) {
    var keys = JSON.parse(getKey);
    
    if (keys.request == 'keys') {
      let objUser = User.user.find(objUser => objUser.id == socket.id);

      objUser.b = randomNumber(2,5);
      objUser.P = primeNumber();
      objUser.G = primeNumber();
      objUser.y = Math.pow(objUser.G, objUser.b) % objUser.P;

      var response = JSON.stringify({ 'y': objUser.y, 'P': objUser.P, 'G': objUser.G});

      io.to(socket.id).emit('connectionWithKeys', response);
    }
  });

  // take x and calculate keyServer
  socket.on('sendX', function (xClient) {
    var xFromClient = JSON.parse(xClient);
    let objUser = User.user.find(objUser => objUser.id == socket.id);
    objUser.x = xFromClient.x;
    objUser.keyServer = Math.pow(Number(objUser.x), Number(objUser.b)) % Number(objUser.P);
  });

  // check encryption from client
  socket.on('sendEncryption', function (encryptionClient) {
    var encryptionFromClient = JSON.parse(encryptionClient);
    let objUser = User.user.find(objUser => objUser.id == socket.id);
    objUser.encryption = encryptionFromClient.encryption;
  });

  // (check connection) if user has good ip address..
  socket.on('test', function (responseConnect) {
    io.to(socket.id).emit('test', "Witaj! - połączenie nawiązane");
  });


  // get msg, and send msg to all connected users (clients)
  socket.on('chat message', function (msg) {

    // decode msg
    var hash = decodeMsgFromClient(msg, socket.id);
    var base64 = Buffer.from(hash, 'base64').toString('utf8');
    var msgFromClient = JSON.parse(base64);
   
    //do somthing with decode data if u want
    var userName = msgFromClient.user;
    var userMsg = msgFromClient.msgUser;

    // encode and send to all
    var response = JSON.stringify({ 'user': userName, 'msgUser': userMsg, });
    var base64 = Buffer.from(response).toString('base64');
    sendToAllClients(base64);
  });

  // remove user from chat
  socket.on('disconnect', function () {
    console.log('user disconnected: '+socket.id);
    removeClient(socket.id);
  });
});

http.listen(3000, function () {
  console.log('listening on *:' + port);
});



// remove client from json array (from chat)
function removeClient (userId){
  let obj = User.user.find(obj => obj.id == userId);
  User.user.splice(obj, 1);
}

//decode msg from client
function decodeMsgFromClient(msg, socketId){

  let objUser = User.user.find(objUser => objUser.id == socketId);
  var keyServer = objUser.keyServer;

  if (objUser.encryption == "xor")
    return xorCrypt(msg, keyServer % 256);

  if (objUser.encryption == "none")
    return msg;

  if (objUser.encryption == "caesar")
    return caesarShift(msg, keyServer * (-1));
}

// encode msg with their encryption and send to them
function sendToAllClients(base64)
{
  var hash = "";
  for (var key in User.user) {

    if (User.user[key].encryption == "xor")
      hash = xorCrypt(base64, User.user[key].keyServer % 256);

    if (User.user[key].encryption == "none")
      hash = base64;

    if (User.user[key].encryption == "caesar") 
      hash = caesarShift(base64, User.user[key].keyServer);

    io.to(User.user[key].id).emit('chat message', hash);
  }
}

// xor 
// in - text, key ("shift"?)
// out - encrypted message
// and 
// in - encrypted message, key
// out - text 
function xorCrypt(str, key) {
  var output = '';
  for (var i = 0; i < str.length; ++i) {
    output += String.fromCharCode(key ^ str.charCodeAt(i));
  }
  return output;
}

// caesar shift 
// in - text, key ("shift"?)
// out - encrypted message
// and 
// in - encrypted message, if (key * -1)
// out - text
var caesarShift = function (str, shift) {

  if (shift < 0)
    return caesarShift(str, shift + 32);

  var letters = "aąbcćdeęfghijklłmnńoóprsśtuwyzźż";
  var letters2 = "AĄBCĆDEĘFGHIJKLŁMNŃOÓPRSŚTUWYZŹŻ";
  var output = '';

  for (var i = 0; i < str.length; i++) {

    var c = str[i];
    var code = str[i];

    if (letters.search(code) >= 0)
      c = letters[(letters.search(code) + shift) % 32];

    if (letters2.search(code) >= 0)
      c = letters2[(letters2.search(code) + shift) % 32];

    output += c;
  }
  return output + " ";
}

// in - number
// out - next prime number after number
function prime(a) {
  for (; a++;) {
    for (c = 0, b = 2; b < a; b++) {
      a % b || c++;
    } if (!c) return a;
  }
};