snCore.Controls = {

    //member variables
    playersListWindowVisible: false,
    ScoresWindow: undefined,
    button_widths: [],
    button_widths_cumulated: [],
    Button_Objs: [],

    //constants...
    button_height: undefined,
    gap_width: undefined,
    button_font_size: undefined,
    line_thickness: undefined,
    corners_rounding: undefined,
    underneath_buttons_px:  undefined,

    createControls: function(){

	//set the constants
	this.button_height = snCore.Tile.stdDimention * 0.7;
	this.gap_width = snCore.Tile.stdDimention*0.2;
	this.button_font_size = Math.min(snCore.Basic.canv_W, snCore.Basic.canv_H * 1.8) * 0.030;//base font size on width, but with a har limit for extreme aspect ratios...
	this.line_thickness = snCore.Tile.stdDimention * 0.06;
	this.corners_rounding = snCore.Tile.stdDimention * 0.25;
	this.underneath_buttons_px = this.button_height + this.gap_width * 1.5;// 1.5 is a reasonable gap...

	//set the relative widths of the buttons (these numbers are only relative)
	this.button_widths =  [10,20,15,10,4];

	//some preprocessing from the widths list...
	this.button_widths_cumulated[0] = this.button_widths[0];

	for (var i=1; i<this.button_widths.length; i++){
	    this.button_widths_cumulated[i] = this.button_widths_cumulated[i-1] + this.button_widths[i];
	}

	this.Button_Objs[0] = this.createGenericButton("Cancel",0,"1");
	this.Button_Objs[1] = this.createGenericButton("Turn Letter (xx)",1,"2");
	this.Button_Objs[2] = this.createGenericButton("SNATCH IT",2,"3");
	this.Button_Objs[3] = this.createGenericButton("Scores",3,"4");
	this.Button_Objs[4] = this.createGenericButton(":",4,null);

	//starting state of buttons with visual state
	var n_tiles_remaining = tilestats.n_tiles - tileset.length;
	this.updateTurnLetter_number(n_tiles_remaining);
	this.setButtonDisabled(2, true);
    },


    createGenericButton: function(text, n_ind, key_label){

	var N_but = this.button_widths.length;
	var button_w_px = [];
	var button_l_px = [this.gap_width/2];
	var eff_width = snCore.Basic.canv_W - this.line_thickness;
	for (var i=0; i<N_but; i++){
	    button_w_px[i] = (eff_width - N_but * this.gap_width) * (this.button_widths[i] / this.button_widths_cumulated[N_but-1]);
	    button_l_px[i+1] = button_l_px[i] + this.gap_width + button_w_px[i] ;
	}

	var button_width = button_w_px[n_ind];
	var button_left = button_l_px[n_ind];

	var buttonObsArray = [];

	//defined the rounded, containing rectangle
	var buttonRect = new fabric.Rect({
	    top: 0,
	    fill: '#AAA',
	    stroke: 'white',
	    strokeWidth: this.line_thickness,
	    width: button_width,
	    height: this.button_height,
	    rx: this.corners_rounding,
	    ry: this.corners_rounding
	});
	buttonObsArray.push(buttonRect);

	var centerising_offset = undefined;
	if(text == ":"){//the special case of the 3 lines for the options button...

	    var bar_length = button_width * 0.4;
	    var left_offset = button_width * (1.0 - 0.4) / 2 + this.line_thickness/2;
	    var bar_height = this.line_thickness;
	    var bar_spacing = this.button_height *0.25;

	    for (var i=1; i<4; i++){
		var thin_bar = new fabric.Rect({
		    top: bar_spacing * i,
		    left: left_offset,
		    fill: 'black',
		    width: bar_length,
		    height: bar_height,
		    rx: bar_height/2,
		    ry: bar_height/2
		});
		buttonObsArray.push(thin_bar);
	    }


	}else{//use text for all other buttons...
	    var buttonText = new fabric.Text(text,{
		top: (this.button_height - this.button_font_size*1.15) * 0.5,//the 1.1 is a fudgefactor to generally shift text up
		fill: 'black',
		fontWeight: 'bold',
		fontSize: this.button_font_size
	    });
	    centerising_offset = (button_width - buttonText.getWidth())/2; 
	    buttonText.set({left: centerising_offset});
	    buttonObsArray.push(buttonText);
	}

	//Function to add the little box which labels the button with its keyboard shortcut key.	
	var draw_boxed_label = function(ll, size, myleft){

	    var kl_top = snCore.Controls.button_height * 0.15;
	    var key_letter = new fabric.Text(ll, {
		top: kl_top,
		left: (myleft + snCore.Controls.line_thickness),
		fill: 'black',
		fontWeight: 'bold',
		fontSize: size 
	    });
	    
	    var key_box = new fabric.Rect({
		top: kl_top,
		left: myleft,
		fill: '#CCC',
		stroke: 'black',
		strokeWidth: 1,
		width: (key_letter.getWidth() + 2*snCore.Controls.line_thickness),
		height: size
	    });
	    
	    //Add the objects to the group
	    //sequence of layer ordering: push the box before the letter...
	    buttonObsArray.push(key_box, key_letter);
	};

	if(centerising_offset != undefined){//this applies for all buttons except the rightmost -/-/- options button

	    var key_font_size = Math.min (this.button_font_size * 0.9, 20);
	    var kl_left = centerising_offset * 0.5 - this.button_font_size*0.3;

	    draw_boxed_label(key_label, key_font_size, kl_left);

	    //this is a bit of a scrappy, iterative approach to nicely centering (ish) 2 objects evenly accross a space...
	    //Having used the main text to position the 'key label boxes', I now use the 'key label boxes to reposition the main text
	    var littleBoxRightEdge = buttonObsArray[2].getLeft() + buttonObsArray[2].getWidth();
	    var buttonText = buttonObsArray[1];
	    var twoThirds_centerise_offset = littleBoxRightEdge + (button_width - littleBoxRightEdge - buttonText.getWidth())/2; 
	    buttonText.setLeft(twoThirds_centerise_offset);
	}

	var buttonGrp = new fabric.Group( buttonObsArray, {
	    hasControls: false,
	    hasBorders: false,
	    selectable: false,
	    top: this.gap_width/2,
	    left: button_left
	});
	
	buttonGrp.gameButtonID = n_ind;
	canvas.add(buttonGrp);
	return buttonGrp;
    },

    SNATCHbuttonBar_Objs: [],
    modifySNATCHbuttonBar: function(DotSet, i_optimal){

	//certainly, remove any pre-existing bars...
	for (var i=0; i<this.SNATCHbuttonBar_Objs.length; i++){
	    canvas.remove(this.SNATCHbuttonBar_Objs[i]);
	}

	//re-add the correct number of bars
	var n_pieces = DotSet.length;
	if(n_pieces > 0){
	    var BGrp = this.Button_Objs[2];//this assumes SNATCH button has index 2

	    var h_pad = BGrp.height * 0.5;
	    var stroke_w = BGrp.item(0).strokeWidth;
	    var h_gap = BGrp.height * 0.25;

	    var w_bar = (BGrp.width - h_pad*2 - h_gap*(n_pieces-1)) / n_pieces;

	    //these next 2 lines reduce w_bar length and h_pad to match
	    //again, I'm being a bit iterative here to save thought
	    w_bar = Math.min(w_bar, BGrp.height*0.9);
	    h_pad = (BGrp.width - w_bar*n_pieces - h_gap*(n_pieces-1))/2;

	    var top_o = BGrp.top + BGrp.height * 0.76;
	    var left_o = BGrp.left + h_pad;

	    //setting up the variables for the dots specifically
	    var dot_dia = stroke_w * 1.5; 
	    var dot_stroke = dot_dia * 0.17; 

	    for (var i = 0; i < n_pieces; i++){//run through each of those bars

		var barWithDotsObj = [];
		var stroke_w_actual = i == i_optimal ? stroke_w * 1.4 : stroke_w * 0.8;

		var thin_bar = new fabric.Rect({
		    top: (-stroke_w_actual/2),
		    left: 0,
		    fill: 'rgba(0,0,0,0.8)',//this effectively is choosing dark grey
		    strokeWidth: 0,
		    width: w_bar,
		    height: stroke_w_actual,
		    rx: w_bar/2,
		    ry: stroke_w_actual/2
		});

		barWithDotsObj.push(thin_bar);

		//create those 'dot' objects...
		//DotSet[i]
		
		var n_dots = DotSet[i].length;
		var dot_rel_left = (w_bar - n_dots * dot_dia)/2;

		for (var j = 0; j < n_dots; j++){//run through each of those bars
		    
		    var dot_col = players[DotSet[i][j]].color;
		    var myDot = new fabric.Circle({
			radius: dot_dia/2,
			stroke: 'black',
			strokeWidth: dot_stroke,
			fill: dot_col,
			left: (dot_rel_left + dot_dia*j),
			top: ( -(dot_dia+dot_stroke)/2)
		    });

		    barWithDotsObj.push(myDot);
		}

		var top_o_adj = top_o - (n_dots==0 ? stroke_w_actual : (dot_dia+dot_stroke))/2;
		var DottedBarGrp = new fabric.Group(barWithDotsObj, {
		    top: top_o_adj,
		    left: (left_o + i*(w_bar+h_gap)),
		    hasControls: false,
		    hasBorders: false,
		    selectable: false
		});

		this.SNATCHbuttonBar_Objs.push(DottedBarGrp);
		canvas.add(DottedBarGrp);
	    }

	}
	snCore.Basic.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
    },

    turnDisabled_dur: undefined,
    turnDisabled_start: undefined,
    startTurnDisableTimeout: function(){
	
	if(this.turnDisabled){//the function irrelivant if the turn is not already disabled...

	    //count words in play...
	    var n_words = 0;
	    for (var i=0; i<players.length; i++){
		n_words += players[i].words.length;
	    }

	    var fast_flip = (players.length < 2) || (n_words == 0);

	    //How long (in seconds) should it take for the button to become available again?
	    this.turnDisabled_dur = (dev || fast_flip) ? 1 : 10;//minimise wait in development mode...

	    //make the outline of the button coloured.
	    var RoundedRec = this.Button_Objs[1].item(0);
	    RoundedRec.setStroke( players[client_player_index].color );

	    //todo: this values ought only be calculated once as they are constant w.r.t. a game instance

	    var corners_r = snCore.Tile.stdDimention * 0.12;

	    //the exact number of pixels of perimeter of rounded cornered rectangle (test by making the 1.0 slightly smaller!)
	    var l_tot = ((RoundedRec.getWidth() + RoundedRec.getHeight()) * 2 + 2*corners_r*(Math.PI-4.0))* 1.0;
	    
	    this.turnDisabled_start = (new Date()).getTime();

	    RoundedRec.setStrokeDashArray([0, l_tot]);

	    this.cancelTurnDisabled=false;
	    snCore.Basic.FrameTargetsArray.push({
		frame: function(){
		    var time_now = (new Date()).getTime();
		    var time_start = snCore.Controls.turnDisabled_start;
		    var progress_fraction = (time_now - time_start) / (1000 * snCore.Controls.turnDisabled_dur);
		    var solid_len = progress_fraction * l_tot;
		    RoundedRec.setStrokeDashArray([solid_len, l_tot-solid_len]);
		    if((progress_fraction>=1)||(snCore.Controls.cancelTurnDisabled)){//animation completed...

			//restore the visual state of the button to normal
			RoundedRec.setStrokeDashArray(null);
			snCore.Controls.setButtonDisabled(1, false);//un-disable the "Turn Letter" button

			//also, remove any toast that relates to the Turn being disabled...
			if(snCore.Controls.turn_tk != undefined){
			    snCore.Toast.setToastRemTimeout(snCore.Controls.turn_tk, {instant: true});//the true means clear fast...
			    snCore.Controls.turn_tk = undefined;// to not hold a reference to a now deleted toast.
			}

			return true; //this means the function call chain shall terminate
		    }else{
			return false; // function call chain to continue
		    }
		}
	    });
	}
    },


    buttonRecolor: function(myButtonGrp,style){
	if((myButtonGrp.gameButtonID!=1)||(!this.turnDisabled)){//condition prevents interference with the animating Turn button (ID =1 for Turn button)
	    var ButtonRect = myButtonGrp.item(0);
	    var KeyLabel = myButtonGrp.gameButtonID == 4 ? null : myButtonGrp.item(2);
 
	    if (style=="hover"){
    		ButtonRect.setStroke('#FF0');
    		ButtonRect.setFill('#AAA');
		if(KeyLabel){KeyLabel.setFill('#FF9');}
	    }
	    else if (style=="press"){
		ButtonRect.setStroke('#FF0');
    		ButtonRect.setFill('white');
		if(KeyLabel){KeyLabel.setFill('#999');}
	    }
	    else{
    		ButtonRect.setStroke('white');
    		ButtonRect.setFill('#AAA');
		if(KeyLabel){KeyLabel.setFill('#CCC');}
	    }
	    canvas.renderAll();
	}
    },


    //this function gets called upon a 'tile turn' from the server
    updateTurnLetter_number: function(variant_str_tiles_rem){
	var TurnButton = this.Button_Objs[1];
	if(typeof(variant_str_tiles_rem) == "number"){

	    if(variant_str_tiles_rem>0){
		TurnButton.item(1).setText("Turn Letter (" + variant_str_tiles_rem + ")");
	    }else{
		TurnButton.item(1).setText("Finish Game");
	    }
	}else{
	    // this assumes the non-numeric value passed is a string.
	    TurnButton.item(1).setText(variant_str_tiles_rem);
	}
	snCore.Basic.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
    },

    block_Snatch_button_visual_changes: false,
    updateSnatchButtonStatus: function(status_str){
	var SnatchTextObj = this.Button_Objs[2].item(1);
	if(status_str=="checking"){
	    SnatchTextObj.setText("Checking...");
	    this.setButtonDisabled(2, true);
	    this.block_Snatch_button_visual_changes = true;
	}else{
	    SnatchTextObj.setText("SNATCH IT");
	    this.setButtonDisabled(2, false);
	    this.block_Snatch_button_visual_changes = false;
	}
	snCore.Basic.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()

    },


    turnDisabled: false,
    cancelTurnDisabled: false,
    setButtonDisabled: function(buttonID, disable){
	if(buttonID == 1){//this code is specific to the Turn Letter button
	    this.turnDisabled = disable;
	}
	if((buttonID == 2)&&(this.block_Snatch_button_visual_changes)){return;}
	var myTextObj = this.Button_Objs[buttonID].item(1);
	var myRectObj = this.Button_Objs[buttonID].item(0);
    	myRectObj.setFill('#AAA');
	//change the button text colour
	if(disable){
	    myTextObj.setFill('#75746E');//text colour to a dull grey-brown
	}else{
	    myTextObj.setFill('black');//text colour to black
	    myRectObj.setStroke('white');//box border colour to black, in case it was changed...
	}
    },


    client_indicated_finished: false,
    //all_tiles_safely_turned: false,//set true
    turn_tk: undefined,//toast key for the Toast relating to turning letter...
    bolden_counter: 0,
    //what happens when we click "Turn Letter".
    // this is largely concerned with a Toast to warn how recently letter has been turned..
    turnLetterClickHandler: function(){
	// Case 1: hits space when the countdown is blocking...
	if(this.turnDisabled){

	    if(this.turn_tk != undefined){
		//the "turn" toast is already on-screen. Extent its timeout
		snCore.Toast.setToastRemTimeout(this.turn_tk);

		//here is also the opportunity for boldening the message!!
		if(this.bolden_counter == 1){
		    $("#q12").css("font-weight", "bold");
		}else if(this.bolden_counter == 2){
		    $("#q12").css("color", "red");
		}

	    }else{//create the new Toast
		var toast_str = "<span id=\"q12\">[x.x]</span> seconds until you can turn another letter";
		this.turn_tk = snCore.Toast.showToast(toast_str);
		this.bolden_counter = 0;
	    }
	    this.bolden_counter++;

	    //in all cases, Toast contents need to update...
	    function toast_time_updater (){
		var date_start = snCore.Controls.turnDisabled_start;
		var time_dur = snCore.Controls.turnDisabled_dur;
		var date_now = new Date();
		
		var time_remaining = Math.max(time_dur - (date_now - date_start)/1000, 0);
		var ndo = 5; // this is the number of divisions of a second (e.g. 5 means 0.2 seconds)
		//create the string for time remaining
		time_remaining = (Math.round(time_remaining * ndo) / ndo).toFixed(1);

		$("#q12").html(time_remaining);

		// Determine if the Turn-blocking toast is Active and STORE
		var t_active = snCore.Toast.VisibleToast_keys_list.indexOf(snCore.Controls.turn_tk) != -1;
		
		if (time_remaining == 0){
		    //the point is that in this case we DON'T make any recursive call...
		}else if(t_active){
		    //recursive call...
		    setTimeout(toast_time_updater, 1000/ndo);
		}else{
		    // to not hold a reference to a now deleted toast.
		    snCore.Controls.turn_tk = undefined;
		}
	    };

	    toast_time_updater();

	// Case 2: no blocking due to countdown (upon a "Turn click")
	}else if(this.client_indicated_finished == false){
	    var n_tiles_remaining = tilestats.n_tiles - tileset.length;
	    if(n_tiles_remaining>0){
		this.setButtonDisabled(1, true);//Disable the "turn letter" button...
		TILE_TURN_REQUEST(); //request another tile...
	
	    }else{// this is the case where all tiles are turned.
		TILE_TURN_REQUEST(); //this call will indicate the intention to finish game (i.e. used to serve dual purpose)
		this.client_indicated_finished = true;
		this.updateTurnLetter_number("Waiting...");
	    }

	// Case 3: this is after the client has clicked "finish", but not all other players are done
	}else if(!snCore.Event.game_ended){
	    snCore.Toast.partial_completion_toast(null);//null is because no particular player just finished...

	}else{// Case 4: this is when ALL players are done.
	    // SCORES - here they serve like a 'confirm action' dialogue before quitting...
	    snCore.Popup.openModal("scores");
	}
    }
};
