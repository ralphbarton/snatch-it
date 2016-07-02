snCore.Latency = {

    MessageLog: {},

    T_latency_for_popup: 1.90, //units of seconds (exactly this latency would just enter "a bit" slow)
    T_latency_thres1: 2.90, //units of seconds (exactly this latency would just enter SLOW)
    T_latency_thres2: 5.50, //units of seconds (exactly this latency would just enter "extremely" slow)


    // function writes to global data
    LogTransmit: function(key){
	this.MessageLog[key] = {timestamp: new Date,
			   ack: false};

	//in 2.5 seconds time, check if a response was recieved...
	setTimeout(function(){
	    //the reason it is important to wrap the exact function we're passing in an inline function is that to do
	    //otherwise would cause the 'this' keyword within the function to operate differently, CAUSING PROBLEMS.
	    snCore.Latency.TestIfAwaitingMSG();// 'this' keyword could not be used in this context.
	}, 1000 * this.T_latency_for_popup + 1 );//theshold must be surpassed when checked

	//Aside from the heartbeat (hb) message, client message transmission is a user-active event. Clear Persistent Toasts.
	if(key != "hb"){
	    snCore.Toast.clear_all_persistent();
	}
    },


    // function writes to global data
    LogAck: function(key){

	// in cases where a message was recieved which was not expected (examples would be another player turns/snatches)
	// take no action with regards to assessing the severity of latency of clearing the latency error message...
	if(this.MessageLog[key] != undefined){
	    var L = this.GetTimeCurrentlyWaited();
	    //This resets the flag which indicates that a message has not been recieved. Must grab latency beforehand...
	    this.MessageLog[key].ack = true;
	    var L2 = this.GetTimeCurrentlyWaited();

	    // only (potentially) clear the message if we're now not waiting for anything:
	    // What this means is that if two messages are awaited, one of them arriving will not cause a clear
	    // however, the "waiting" circle of dots won't change colour, being based upon the most delayed message at time of
	    // raising the Popup.
	    if(L2.latency < 0.25){
		// Clear the "connection lost" message if it is present
		if((snCore.Popup.popup_in_foreground == "connection")||(snCore.Popup.popup_in_foreground == "connection_1min")){
		    snCore.Popup.hideModal();

		    //comment numerically on the latency...
		    var lat = L.latency;
		    var q_te = "slightly ";
		    if (lat > this.T_latency_thres2){
			var q_te = "extremely ";
		    }else if(lat > this.T_latency_thres1){
			var q_te = "";
		    }

		    snCore.Toast.showToast("Internet connection is functional but "+q_te+"slow... ("+lat.toFixed(1)+" seconds)");
		}
	    }
	}
    },


    // function has no side-effects this function was formerly "get_max_latency"
    GetTimeCurrentlyWaited: function(){

	var time_now = new Date;

	//for any message that is currently unanswered, how long have we been waiting? Get the max...
	var max_latency = 0;
	var max_key = undefined;
	for (var key in this.MessageLog) {
	    if (this.MessageLog.hasOwnProperty(key)) {
		var key_latency = this.MessageLog[key].ack ? 0 : time_now - this.MessageLog[key].timestamp;
		max_key = key_latency>max_latency ? key : max_key;
		max_latency = Math.max(max_latency, key_latency);
	    }
	}
	
	return {
	    latency: (max_latency / 1000),
	    m_key: max_key
	}
    },

    TestIfAwaitingMSG: function(){
	//if any message has been waiting for more than 2 seconds, complain
	if(this.GetTimeCurrentlyWaited().latency >= this.T_latency_for_popup){//UNITS OF SECONDS...
	    snCore.Popup.openModal("connection");
	}
    }

};
