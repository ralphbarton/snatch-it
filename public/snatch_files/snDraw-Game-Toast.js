snDraw.Game.Toast = {

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

    showToast: function(my_string){

	//how do we reference back to this Toast (important in the placement process...)?
	var t_key = "toast-n" + this.ToastCounter; 
	this.ToastCounter++;
	
	this.ToastRolling.push(t_key); // rolling is a []

	//Actually the div of the new Toast class...
	var $NewToast = $( "<div/>", {id: t_key}).addClass("ToastGrey ToastCentral ToastIn").html(my_string);
	$("#canv-inside").append($NewToast);

	var toast_spacing = snDraw.Game.tileSpacings.ts * 0.18;
	//Determine the vertical position of the toast (start it at its highest potential position)
	var ClientZone_Title = snDraw.Game.Zones.PlayerZone[0].Zone_FabObjs[1];
	var ToastTop_current_client_zone_top = ClientZone_Title.top + ClientZone_Title.height;
	var Client_Words_Grps = snDraw.Game.Words.TileGroupsArray[client_player_index];
	var ToastTop_current_client_words = 0;
        for(var i = 0; i < Client_Words_Grps.length; i++){
	    ToastTop_current_client_words = Math.max(ToastTop_current_client_words, Client_Words_Grps[i].getTop());
        }

	var toast_top = Math.max(this.ToastTop_consumed_words + snDraw.Game.tileSpacings.ts * 1.4,
				 this.ToastTop_snatched_word + snDraw.Game.tileSpacings.ts * 1.4,
				 this.ToastTop_zone_inner_final,
				 this.ToastTop_client_words_final + snDraw.Game.tileSpacings.ts * 1.4,
				 ToastTop_current_client_words +  snDraw.Game.tileSpacings.ts * 1.4,
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
	var ts = snDraw.Game.tileSpacings.ts;
	$NewToast.css("font-size", (ts*0.35)+"px");
	$NewToast.css("-moz-border-radius", (ts*0.1)+"px");
	$NewToast.css("-webkit-border-radius", (ts*0.1)+"px");
	$NewToast.css("border-radius", (ts*0.1)+"px");

	this.setToastRemTimeout(t_key);
	return t_key;
    },


    //these hash tables use t_key as their keys
    timeoutIDs: {},
    Active_byKey: {},

    setToastRemTimeout: function(t_key, fast){//this will remove any existing timeouts to remove the toast indexed by t_key
	var toast_duration = 4000;
	var new_timoutID = setTimeout(function(){
	    
	    $("#"+t_key).removeClass("ToastIn");
	    $("#"+t_key).addClass("ToastOut");

	    setTimeout(function(){

		//find the array index of the toast concerned (by its key)
		var roll_index = snDraw.Game.Toast.ToastRolling.indexOf(t_key);
		//remove this toast key from the array: it is GONE!
		snDraw.Game.Toast.ToastRolling.splice(roll_index, 1);
		$("#"+t_key).remove();
		snDraw.Game.Toast.Active_byKey[t_key] = false;

	    }, 400 + 10);//delete 10ms after fade out is complete.

	}, fast?10:toast_duration);

	var old_timeoutID = this.timeoutIDs[t_key];
	this.timeoutIDs[t_key] = new_timoutID;
	clearTimeout(old_timeoutID);
	this.Active_byKey[t_key] = true;
    }

};
