var file = '/var/log/secure';
var cookieParser = require('../node_modules/cookie');
var socketService = require('../service/socketService');
module.exports = function(app){
    var io = require('socket.io')(app);

    io.on('connection', function (socket) {
        var cookie = cookieParser.parse(socket.handshake.headers.cookie);
        var key = cookie.io;
        socketService.set(key, socket);

        var Watcher = require('./watcher');
        var watcher = new Watcher(file, socket);

        //watcher.readFile(file);
        watcher.watch(file);

        socket.on('disconnect', function(){
            socketService.clear(key);
        })

    });

};