snCore.Toast = {

    ToastCounter: 0,//create an integer_key for each toast
    ToastRolling: [],//rolling buffer (length up to 3 - tbc) holding the integer_key's for the dictionary above.
    ToastTop_consumed_words: 0,
    ToastTop_snatched_word: 0,
    ToastTop_client_words_final: 0,
    ToastTop_zone_inner_final: 0,

    reset_ToastTop_params: function(){
	this.ToastTop_consumed_words = 0;
	this.ToastTop_snatched_word = 0;
	this.ToastTop_zone_inner_final = 0;
	this.ToastTop_client_words_final = 0;
    },

    boundDimention: function(value, px_total, frac){
	if(frac.max != undefined){
	    value = Math.min(value, frac.max * px_total);
	}
	if(frac.min != undefined){
	    value = Math.max(value, frac.min * px_total);
	}
	return value
    },

    showToast: function(my_string, ToastOptions){

	//how do we reference back to this Toast (important in the placement process...)?
	var t_key = "toast-n" + this.ToastCounter; 
	this.ToastCounter++;
	
	this.ToastRolling.push(t_key); // rolling is a []

	//Actually the div of the new Toast class...
	var $NewToast = $( "<div/>", {id: t_key}).addClass("ToastGrey ToastCentral ToastIn").html(my_string);
	
	$("#canv-inside").append($NewToast);

	var toast_spacing = snCore.Tile.stdDimention * 0.18;
	//Determine the vertical position of the toast (start it at its highest potential position)
	var ClientZone_Title = snCore.Zones.PlayerZone[0].Zone_FabObjs[1];
	var ToastTop_current_client_zone_top = ClientZone_Title.top + ClientZone_Title.height;
	var Client_Words_Grps = snCore.Words.TileGroupsArray[client_player_index];
	var ToastTop_current_client_words = 0;
        for(var i = 0; i < Client_Words_Grps.length; i++){
	    ToastTop_current_client_words = Math.max(ToastTop_current_client_words, Client_Words_Grps[i].getTop());
        }

	var toast_top = Math.max(this.ToastTop_consumed_words + snCore.Tile.stdDimention * 1.4,
				 this.ToastTop_snatched_word + snCore.Tile.stdDimention * 1.4,
				 this.ToastTop_zone_inner_final,
				 this.ToastTop_client_words_final + snCore.Tile.stdDimention * 1.4,
				 ToastTop_current_client_words +  snCore.Tile.stdDimention * 1.4,
				 ToastTop_current_client_zone_top);
	this.reset_ToastTop_params();

	//Now this bit relates to fitting it around toasts which may already be there...
	for(var i = 0; i < this.ToastRolling.length; i++){
	    var t_key_i = this.ToastRolling[i];
	    var $ExistingToast = $("#"+t_key_i);


	    //trap it in the loop by reverting i to zero until it escapes interference with any other Toasts...
	    var Toast_i_top = $ExistingToast.position().top;
	    var Toast_i_height = $ExistingToast.outerHeight();
	    var Toast_i_bot = Toast_i_top + Toast_i_height + toast_spacing;
	    var toast_height = $NewToast.outerHeight();
	    var toast_bot = toast_top + toast_height + toast_spacing;
	    //a smaller vertical coordinate means higher up on screen...
	    //is there interference

	    if((Toast_i_top <= toast_bot)&&(Toast_i_bot >= toast_top)){//Interference detected
		toast_top = Toast_i_bot + 0.5;//shuffle down the candidate position
		i = -1;//reset the loop (it will get imcremented, so must here make it -1.
	    }else{
		// huh?
	    }
	}

	$NewToast.css("top", (toast_top + "px"));

	//toasts scaling (there are some more...)
	//TODO: this styling code which applies to all toasts should be elsewhere
	// why can't I use jQuery to change the properties of the CSS class universally whilst no objects of that class exist?
	var ts = snCore.Tile.stdDimention;
	$NewToast.css("font-size", (ts*0.35)+"px");
	$NewToast.css("-moz-border-radius", (ts*0.1)+"px");
	$NewToast.css("-webkit-border-radius", (ts*0.1)+"px");
	$NewToast.css("border-radius", (ts*0.1)+"px");

	/*
	ToastOptions = {
	    persistent: boolean
	    HTML_frag: <object, jQuery>
	}
	*/

	// Apply options to the generated Toast...
	if (ToastOptions == undefined){
	    //the default behaviour
	    this.setToastRemTimeout(t_key);
	}else{
	    if(ToastOptions.persistent == true){
		// add cross in corner to close it
		var crn_cross = $("<div class=\"ToastClose\"></div>").text("×");
		$NewToast.prepend(crn_cross);
		crn_cross.click(function(){
		    snCore.Toast.setToastRemTimeout(t_key, {instant: true});});
		// it'll close by itself in a minute...
		this.setToastRemTimeout(t_key, {duration: 60000});
		// it will get
		this.persistent_toast_list_byKey.push(t_key);
	    }

	    if(ToastOptions.HTML_frag !== undefined){
		$NewToast.html("").append(ToastOptions.HTML_frag);
	    }
	}

	//any <a href> into new windows... (this will apply to links in str or frags...)
	$NewToast.find( "a" ).attr("target","_blank");


	return t_key;
    },

    /*
    ToastRemovalOptions = {
	duration: int
	instant: boolean
    }
    */

    //these hash tables use t_key as their keys
    // TODO: can't 3 hash tables be combined into one, given they use the same keys? This is housekeeping work.
    timeoutIDs: {},
    Active_byKey: {},

    //this will remove any existing timeouts to remove the toast indexed by t_key
    setToastRemTimeout: function(t_key, ToastRemovalOptions){

	// default options values
	var toast_duration = 4000;
	var fast = false;

	if (ToastRemovalOptions != undefined){
	    fast = ToastRemovalOptions.instant || fast;
	    toast_duration = ToastRemovalOptions.duration || toast_duration;
	}

	var new_timoutID = setTimeout(function(){
	    
	    $("#"+t_key).removeClass("ToastIn");
	    $("#"+t_key).addClass("ToastOut");

	    setTimeout(function(){

		//find the array index of the toast concerned (by its key)
		var roll_index = snCore.Toast.ToastRolling.indexOf(t_key);
		//remove this toast key from the array: it is GONE!
		snCore.Toast.ToastRolling.splice(roll_index, 1);
		$("#"+t_key).remove();
		snCore.Toast.Active_byKey[t_key] = false;

	    }, 400 + 10);//delete 10ms after fade out is complete.

	}, fast?10:toast_duration);

	var old_timeoutID = this.timeoutIDs[t_key];
	this.timeoutIDs[t_key] = new_timoutID;
	clearTimeout(old_timeoutID);
	this.Active_byKey[t_key] = true;
    },

    persistent_toast_list_byKey: [],
    clear_all_persistent: function(){
	$.each(this.persistent_toast_list_byKey, function( index, value ) {
	    snCore.Toast.setToastRemTimeout(value, {instant: true});
	});
    },

    join_message: function(){
	// (I've put a moment of delay here. Probably UNNECESSARY TO USE TIMEOUT
	setTimeout(function(){
	    var pss = players.length;
	    var pss_inac = 0;

	    for(var i = 0; i < players.length; i++){
		if (players[i].is_disconnected){
		    pss_inac++;
		}
	    }

	    var pss_oth = pss-pss_inac-1;
	    var partipicants = [];
	    var singular = false;
	    if(pss_inac>0){
		partipicants.push(pss_inac + " disconnected player"+(pss_inac==1?"":"s"));
		if(pss_inac==1){singular=true;}
	    }
	    if(pss_oth>0){
		partipicants.push(pss_oth + " active player"+(pss_oth==1?"":"s"));
		if(pss_oth>1){singular=false;}
	    }

	    var msg = "You are the only player in this game";
	    var sss = singular?"is ":"are ";
	    if(partipicants.length==1){
		var msg = "There " + sss + partipicants[0] + " and you in this game";
	    }else if(partipicants.length==2){
		var msg = "There " + sss + partipicants[0] + ", " + partipicants[1] + " and you in this game";
	    }

	    snCore.Toast.showToast(msg, {persistent: true});
	}, 20);
    },

    partial_completion_toast: function(PI_just_finished){
	// generate list of non-finished players...
	var n_pl = players.length;
	var str_nl = "";
	//todo: perhaps, in future, generate HTML and use player colors here...
	for(var i = 0; i < n_pl; i++){
	    var Plr = players[i];
	    if((!Plr.is_disconnected) && (!Plr.is_finished)){
		str_nl += (i == client_player_index ? "you" : Plr.name) + (i < (n_pl-1) ? ", ":"");
	    }
	}

	var str_tot = "";
	if(PI_just_finished != null){
	    if(PI_just_finished == client_player_index){
		str_tot += "You have";
	    }else{
		str_tot += players[PI_just_finished].name + " has";
	    }
	    str_tot += " finished.<br>Now waiting";
	}else{
	    str_tot += "Waiting";
	}
	str_tot += " for " + str_nl + " (after which final scores will show)";
	snCore.Toast.showToast(str_tot);
    },

    game_fin: function(){
	snCore.Toast.showToast("The game is now finished");
    }

};
