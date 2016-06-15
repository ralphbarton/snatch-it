var MessageLog = {};
function log_message_transmit(key){
    MessageLog[key] = {timestamp: new Date,
		       ack: false};

    //in 2.5 seconds time, check if a response was recieved...
    setTimeout(message_arrival_check, 1000 * 2.5);
}


function log_message_ack(key){
    MessageLog[key].ack = true;

    // Clear the "connection lost" message if it is present
    if(snDraw.Game.Popup.popup_in_foreground == "connection"){
	snDraw.Game.Popup.hideModal();
	snDraw.Game.Toast.showToast("Internet connection is functional but slow...");
    }
}

function get_max_latency(){
    var time_now = new Date;

    //for any message that is currently unanswered, how long have we been waiting? Get the max...
    var max_latency = 0;
    for (var key in MessageLog) {
	if (MessageLog.hasOwnProperty(key)) {
	    var key_latency = MessageLog[key].ack ? 0 : time_now - MessageLog[key].timestamp;
	    max_latency = Math.max(max_latency, key_latency);
	}
    }
    
    return max_latency;
}

function message_arrival_check(){
    
    //if any message has been waiting for more than 2 seconds, complain
    if(get_max_latency() > 2000){
	snDraw.Game.Popup.openModal("connection");
    }

}
