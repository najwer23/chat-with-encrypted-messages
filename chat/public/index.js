//class client 
// _a - private key selected
// _y - public key from server
// _P and _G - public key from Server
// _x - public key server generated in client which is sent to server 
// _keyClient - genarted private key
// _encryption - selected encryption
// _getKey - request for a key
// _msg from user
class Client {
    constructor() {
        this._a = randomNumber();
        this._y = 0;
        this._P = 0;
        this._G = 0;
        this._x = 0;
        this._keyClient = 0;
        this._encryption = "none";
        this._getKey = JSON.stringify({ 'request': 'keys', });
        this._msg = JSON.stringify({ 'user': "anonim", 'msgUser': "" });
    }

    get keyClient() {
        return Math.pow(this._y, this._a) % this._P;
    }

    set y(y) {
        this._y = y;
    }

    set G(G) {
        this._G = G;
    }

    set P(P) {
        this._P = P;
    }

    get P() {
        return this._P;
    }

    get x() {
        return Math.pow(this._G, this._a) % this._P;
    }

    get a() {
        return this._a;
    }

    set encryption(encryption) {
        this._encryption = encryption;
    }

    get encryption() {
        return this._encryption;
    }

    get getKey() {
        return this._getKey;
    }

    set msg(msg) {
        this._msg = msg;
    }

    get msg() {
        return this._msg;
    }
}







let Cli;

$(document).ready(function () {   
    Cli = new Client();
});






$(function () {
    var socket = io.connect('localhost:3000');

    //test connect, check if you can connect to the server
    socket.emit('test');
    socket.on('test', function (responseConnect) {
        $('#messages').append($('<li>').text(responseConnect));
        socket.emit('connectionWithKeys', Cli.getKey);
    });

    // after click "send"
    $('form').submit(function () {
        Cli.encryption = $("#selectEncryption option:selected").text();
        $("#user").prop('disabled', true);
       
        Cli.msg = JSON.stringify({ 'user': $('#user').val(), 'msgUser': $('#inputMsg').val()});
        socket.emit('connectionWithKeys', Cli.getKey);

        $('#inputMsg').val('');
        return false;
    });

    socket.on('connectionWithKeys', function (response) {
        var keysFromServer = JSON.parse(response);
        Cli.y = keysFromServer.y;
        Cli.P = keysFromServer.P;
        Cli.G = keysFromServer.G;

        // send x to server
        var xClient = JSON.stringify({ 'x': Cli.x });
        socket.emit('sendX', xClient);

        // chooose encryption
        var encryptionClient = JSON.stringify({ 'encryption': Cli.encryption });
        socket.emit('sendEncryption', encryptionClient);

        // encode msg
        var base64 = b64EncodeUnicode(Cli.msg);
        var hash = encodeMsg(base64);
        socket.emit('chat message', hash);
    });


    socket.on('chat message', function (msg) {
        
        // decode
        var hash = decodeMsg(msg);
        var base64 = b64DecodeUnicode(hash);
        var msgFromServer = JSON.parse(base64);
        
        //do smth with data
        var userName = msgFromServer.user;
        var userMsg = msgFromServer.msgUser;

        //when we havent username
        if (userName != "anonim")
            $('#messages').append($('<li>').text(userName + " // " + userMsg));
    });

});

// in - text 
// out - encrypted message
function encodeMsg(base64){
    
    if (Cli.encryption == "xor")
        return xorCrypt(base64, Cli.keyClient % 256);

    if (Cli.encryption == "caesar")
        return caesarShift(base64, Cli.keyClient);

    if (Cli.encryption == "none")
        return base64;
}

// in - encrypted message
// out - text 
function decodeMsg(msg){
    
    if (Cli.encryption == "xor")
        return xorCrypt(msg, Cli.keyClient % 256);

    if (Cli.encryption == "none")
        return msg;

    if (Cli.encryption == "caesar")
        return caesarShift(msg, Cli.keyClient * (-1));
}

// from mozilla documentation, base64 encode
// in - string
// out - base64
function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
        return String.fromCharCode(parseInt(p1, 16))
    }))
}

//from mozilla documentation  base64 decode
// in - base 64,
// out - string
function b64DecodeUnicode(str) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
}

// return pseudo-random number
// in - void
// out - random number between min and max
function randomNumber() {
    var max = 5;
    var min = 2;
    return Math.floor(Math.random() * (max - min + 1)) + min;
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

    // Polish language
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

