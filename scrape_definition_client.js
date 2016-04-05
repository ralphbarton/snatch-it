module.exports = function (){

    var W3CWebSocket = require('websocket').w3cwebsocket;
    
    var client = new W3CWebSocket('ws://127.0.0.1:9000/');

    var events = require('events');
    var eventEmitter = new events.EventEmitter();
    
    client.onerror = function() {
	console.log('Beautiful Soup: Connection Error');
    }; 
    
    client.onopen = function() {
	console.log('Beautiful Soup: WebSocket Client Connected');
    };
    
    client.onclose = function() {
	console.log('Beautiful Soup: Client Closed');
    };
    
    client.onmessage = function(e) {
	if (typeof e.data === 'string') {
	    eventEmitter.emit('searchComplete', e.data);
	}
    };

    return {
	rEvent: eventEmitter,

	lookup_definition: function(word){
            if (client.readyState === client.OPEN) {
		console.log('Beautiful Soup: looking up ' + word);
		client.send(word);
            }
	}
    };

}
