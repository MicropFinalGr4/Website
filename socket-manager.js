var socket_manager = {};

module.exports = function(io){
    socket_manager.io = io;
    /// Event Liking ///
    io.on('connection', newConnection);

    return socket_manager;
};

/// RESPONSE FUNCTIONS ///

function newConnection(socket){
    console.log("connected");
    socket.on('new_angle', new_angle);

    socket.on('disconnect', function(){
        console.log("disconnected");
    });
}

/// SOCKET RESPONSE FUNCTIONS ///

function new_angle(data){
    socket_manager.io.sockets.emit('angle_update', data);
}

