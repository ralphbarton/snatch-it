snDraw.Game.Toast = {

    ToastCounter: 0,//create an integer_key for each toast
    ToastDictionary: {},//for each toast's unique integer_key, hold the reference to its fabric object if this exists.
    ToastRolling: [],//rolling buffer (length up to 3 - tbc) holding the integer_key's for the dictionary above.

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
	
	var CP = players[client_player_index];
	var DIM = snDraw.Game.tileSize;
	var no_words = CP.words.length == 0;


	var toast_width = this.boundDimention(DIM * 8, snDraw.canv_W, {min: 0.6, max: 0.9});
	var toast_left = (snDraw.canv_W - toast_width)/2;
	var toast_height = DIM * 0.8;

	var ToastText_raw = new fabric.Text(my_string, {
	    left: toast_left + DIM * 0.3,
	    top: 0,//can only be calculated once object exists...
	    width: toast_width - DIM * 0.6,
	    fill: 'rgba(255,255,255,0.7)',
	    fontSize: DIM * 0.42
	});
	var ToastText = wrapCanvasText(ToastText_raw, canvas, toast_width - DIM * 0.6, DIM * 2, 'left');

	var ToastBox = new fabric.Rect({
	    left: toast_left,
	    top: 0,//can only be calculated once object exists...
	    width: toast_width,
	    height: ToastText.getHeight() + DIM * 0.2,
	    fill: 'rgba(0,0,192,0.5)',
	    rx: DIM * 0.4,
	    ry: DIM * 0.4,
	    shadow: 'rgba(100,150,0,0.8) 4px 4px 10px'//this pixes need to scale with screen size
	});

	var toast_spacing = DIM * 0.18;

	//code here is to determine the vertical position of the toast
	// start it at its highest potential position
	var Client_Words_Grps = snDraw.Game.Words.TileGroupsArray[client_player_index];
	var ClientZone_Title = snDraw.Game.Zones.PlayerZone[0].Zone_FabObjs[1];
	var bottommost_word_px = ClientZone_Title.top + ClientZone_Title.height;
	for(var i = 0; i < Client_Words_Grps.length; i++){
	    var beneath_word_px = Client_Words_Grps[i].getTop() + snDraw.Game.tileSpacings.ts * 1.4;
	    bottommost_word_px = Math.max(bottommost_word_px, beneath_word_px);
	}

	var toast_top = bottommost_word_px;//CP.y_next_word + (no_words ? 0 : snDraw.Game.v_spacer + DIM * 0.25) + DIM * 0.25;

	for(var i = 0; i < this.ToastRolling.length; i++){
	    var ExistingToastObj = this.ToastDictionary[this.ToastRolling[i]];
	    //trap it in the loop by reverting i to zero until it escapes interference with any other Toasts...
	    var Toast_i_top = ExistingToastObj.top;
	    var Toast_i_bot = ExistingToastObj.top + ExistingToastObj.height + toast_spacing;
	    var toast_bot = toast_top + ToastBox.height + toast_spacing;
	    //a smaller vertical coordinate means higher up on screen...
	    //is there interference
	    if((Toast_i_top <= toast_bot)&&(Toast_i_bot >= toast_top)){//Interference detected
		toast_top = Toast_i_bot + 0.5;//shuffle down the candidate position
		i = -1;//reset the loop (it will get imcremented, so must here make it -1.
	    }else{

	    }
	}

	ToastBox.setTop(toast_top);
	ToastText.setTop(toast_top + DIM * 0.1);
	
	var objects = [ToastBox, ToastText];

	var ToastObj = new fabric.Group( objects, {
	    hasControls: false,
	    hasBorders: false,
	    selectable: false
	});

	//Now that the Toast Object is *created*, take steps to add it (and its references)...

	var t_key = this.ToastCounter.toString(); 
	ToastObj.toast_uid = t_key;
	this.ToastCounter++;
	
	this.ToastDictionary[t_key] = ToastObj;
	this.ToastRolling.push(t_key);
	
	var toast_duration = 1800;
	setTimeout(function(){

	    //update data structures
	    var roll_index = snDraw.Game.Toast.ToastRolling.indexOf(t_key);
	    snDraw.Game.Toast.ToastRolling.splice(roll_index, 1);

	    delete snDraw.Game.Toast.ToastDictionary[t_key];
	    
	    //update canvas
	    canvas.remove(ToastObj);
	    canvas.renderAll();
	}, toast_duration);



	canvas.add(ToastObj);
	canvas.renderAll();
    }
}
