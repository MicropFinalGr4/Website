var express = require("express");
var app     = express();
var path    = require("path");
var server = require('http').Server(app);
var io = require('socket.io')(server);
var socket_manager = require('./socket-manager')(io);
var ip = require('ip');

var address = ip.address();
var port = '8000';

app.use('/front', express.static(__dirname + '/front'));

app.get('/',function(req,res){
  res.sendFile(path.join(__dirname+ '/front/index.html'));
});

server.listen(port);

console.log("Running at: " + address + ":" + port);
