snCore.Latency = {

    MessageLog: {},

    T_latency_for_popup: 1.90, //units of seconds (exactly this latency would just enter "a bit" slow)
    T_latency_thres1: 2.90, //units of seconds (exactly this latency would just enter SLOW)
    T_latency_thres2: 5.50, //units of seconds (exactly this latency would just enter "extremely" slow)


    // function writes to global data
    LogTransmit: function(key){
	MessageLog[key] = {timestamp: new Date,
			   ack: false};

	//in 2.5 seconds time, check if a response was recieved...
	setTimeout(this.TestIfAwaitingMSG, 1000 * T_latency_for_popup + 1 );//theshold must be surpassed when checked

	//Aside from the heartbeat (hb) message, client message transmission is a user-active event. Clear Persistent Toasts.
	if(key != "hb"){
	    snCore.Toast.clear_all_persistent();
	}

    },


    // function writes to global data
    LogAck: function(key){

	// in cases where a message was recieved which was not expected (examples would be another player turns/snatches)
	// take no action with regards to assessing the severity of latency of clearing the latency error message...
	if(MessageLog[key] != undefined){
	    var L = this.GetTimeCurrentlyWaited();
	    //This resets the flag which indicates that a message has not been recieved. Must grab latency beforehand...
	    MessageLog[key].ack = true;

	    // Clear the "connection lost" message if it is present
	    if(snCore.Popup.popup_in_foreground == "connection"){
		snCore.Popup.hideModal();

		//comment numerically on the latency...
		var lat = L.latency;
		var q_te = "slightly ";
		if (lat > T_latency_thres2){
		    var q_te = "extremely ";
		}else if(lat > T_latency_thres1){
		    var q_te = "";
		}

		snCore.Toast.showToast("Internet connection is functional but "+q_te+"slow... ("+lat.toFixed(1)+" seconds)");
	    }
	}
    },


    // function has no side-effects this function was formerly "get_max_latency"
    GetTimeCurrentlyWaited: function(key){

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
    },

    TestIfAwaitingMSG: function(key){
	//if any message has been waiting for more than 2 seconds, complain
	if(this.GetTimeCurrentlyWaited().latency >= T_latency_for_popup){//UNITS OF SECONDS...
	    snCore.Popup.openModal("connection");
	}
    }

};
