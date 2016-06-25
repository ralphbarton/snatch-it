var MessageLog = {};

var T_latency_for_popup = 1.90; //units of seconds (exactly this latency would just enter "a bit" slow)
var T_latency_thres1 = 2.90; //units of seconds (exactly this latency would just enter SLOW)
var T_latency_thres2 = 5.50; //units of seconds (exactly this latency would just enter "extremely" slow)

function log_message_transmit(key){// function writes to global data
    MessageLog[key] = {timestamp: new Date,
		       ack: false};

    //in 2.5 seconds time, check if a response was recieved...
    setTimeout(message_arrival_check, 1000 * T_latency_for_popup + 1 );//theshold must be surpassed when checked

    //Aside from the heartbeat (hb) message, client message transmission is a user-active event. Clear Persistent Toasts.
    if(key != "hb"){
	snDraw.Game.Toast.clear_all_persistent();
    }

}


function log_message_ack(key){// function writes to global data

    // in cases where a message was recieved which was not expected (examples would be another player turns/snatches)
    // take no action with regards to assessing the severity of latency of clearing the latency error message...
    if(MessageLog[key] != undefined){
	var L = get_max_latency();
	//This resets the flag which indicates that a message has not been recieved. Must grab latency beforehand...
	MessageLog[key].ack = true;

	// Clear the "connection lost" message if it is present
	if(snDraw.Game.Popup.popup_in_foreground == "connection"){
	    snDraw.Game.Popup.hideModal();

	    //comment numerically on the latency...
	    var lat = L.latency;
	    var q_te = "slightly ";
	    if (lat > T_latency_thres2){
		var q_te = "extremely ";
	    }else if(lat > T_latency_thres1){
		var q_te = "";
	    }

	    snDraw.Game.Toast.showToast("Internet connection is functional but "+q_te+"slow... ("+lat.toFixed(1)+" seconds)");
	}
    }
}


function get_max_latency(){// function has no side-effects 
    var time_now = new Date;

    //for any message that is currently unanswered, how long have we been waiting? Get the max...
    var max_latency = 0;
    var max_key = undefined;
    for (var key in MessageLog) {
	if (MessageLog.hasOwnProperty(key)) {
	    var key_latency = MessageLog[key].ack ? 0 : time_now - MessageLog[key].timestamp;
	    max_key = key_latency>max_latency ? key : max_key;
	    max_latency = Math.max(max_latency, key_latency);
	}
    }
    
    return {
	latency: (max_latency / 1000),
	m_key: max_key
    }
}

function message_arrival_check(){
    
    //if any message has been waiting for more than 2 seconds, complain
    if(get_max_latency().latency >= T_latency_for_popup){//UNITS OF SECONDS...
	snDraw.Game.Popup.openModal("connection");
    }

}
