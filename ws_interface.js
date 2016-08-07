module.exports = function (){

    var events = require('events');
    var eventEmitter = new events.EventEmitter();


    var WebSocketServer = require('websocket').server;
    var http = require('http');

    var server = http.createServer(function(request, response) {
	// process HTTP request. Since we're writing just WebSockets server
	// we don't have to implement anything.
    });
    server.listen(3014, function() { });

//.listen(3008,'127.0.0.1');


    console.log("xx3 Listening port 3014")


    // create the server
    wsServer = new WebSocketServer({
	httpServer: server
    });

    // WebSocket server
    wsServer.on('request', function(request) {
	var connection = request.accept(null, request.origin);

	console.log("xx3 New connection")

	// This is the most important callback for us, we'll handle
	// all messages from users here.
	connection.on('message', function(message) {
            if (message.type === 'utf8') {
		// process WebSocket message
		console.log(message);
		connection.send("crazy dog");
		eventEmitter.emit('message', message);
            }
	});

	connection.on('close', function(connection) {
	    console.log("xx3 Connection Closed")
            // close user connection
	});
    });

}
