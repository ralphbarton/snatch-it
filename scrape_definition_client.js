module.exports = function (){

    var events = require('events');
    var eventEmitter = new events.EventEmitter();

    var my_ws = open_ws_add_listeners(eventEmitter);
    
    return {
	rEvent: eventEmitter,

	lookup_definition: function(word){
            if (client.readyState === client.OPEN) {
		console.log('Beautiful Soup: now passing word "' + word + '" to Python via WS');
		client.send(word);
            }
	}
    };

}


var W3CWebSocket = require('websocket').w3cwebsocket;
var client = undefined;//reference to the websocket

function open_ws_add_listeners(my_emitter){

    client = new W3CWebSocket('ws://127.0.0.1:9000/');

    client.onerror = function() {
	console.log('Beautiful Soup: Connection Error');
    }; 
    
    client.onopen = function() {
	console.log('Beautiful Soup: WebSocket Client Connected');
    };
    
    client.onclose = function() {
	console.log('Beautiful Soup: Client Closed');
	setTimeout(function(){
	    console.log("5 seconds elapsed since unwanted socket closure - attempting to reopen...");
	    client = open_ws_add_listeners(my_emitter);
	}, 5 * 1000);//attempt to repoen in 5 seconds


    };
    
    client.onmessage = function(e) {
	if (typeof e.data === 'string') {
	    my_emitter.emit('searchComplete', e.data);
	}
    };

    return client;

}
