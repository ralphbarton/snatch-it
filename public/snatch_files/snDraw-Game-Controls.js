snDraw.Game.Controls = {

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
	this.button_height = snDraw.Game.tileSize * 0.7;
	this.gap_width = snDraw.Game.tileSize*0.2;
	this.button_font_size = Math.min(snDraw.canv_W, snDraw.canv_H * 1.8) * 0.030;//base font size on width, but with a har limit for extreme aspect ratios...
	this.line_thickness = snDraw.Game.tileSize * 0.06;
	this.corners_rounding = snDraw.Game.tileSize * 0.25;
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
	this.updateTurnLetter_number();
    },


    createGenericButton: function(text,n_ind,key_label){

	var N_but = this.button_widths.length;
	var button_w_px = [];
	var button_l_px = [this.gap_width/2];
	var eff_width = snDraw.canv_W - this.line_thickness;
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
	    stroke: snDraw.Game.fg_col,
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
		top: (this.button_height - this.button_font_size) * 0.5,
		fill: 'black',
		fontWeight: 'bold',
		fontSize: this.button_font_size
	    });
	    centerising_offset = (button_width - buttonText.getWidth())/2; 
	    buttonText.set({left: centerising_offset});
	    buttonObsArray.push(buttonText);
	}

	//label on the key
	
	var draw_boxed_label = function(ll, size, myleft){

	    var kl_top = snDraw.Game.Controls.button_height * 0.15;
	    var key_letter = new fabric.Text(ll, {
		top: kl_top,
		left: (myleft + snDraw.Game.Controls.line_thickness),
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
		width: (key_letter.getWidth() + 2*snDraw.Game.Controls.line_thickness),
		height: size
	    });
	    
	    //Add the objects to the group
	    buttonObsArray.push(key_box);
	    buttonObsArray.push(key_letter);
	    

	}

	if(centerising_offset != undefined){

	    var key_font_size = Math.min (this.button_font_size * 0.9, 20);
	    var kl_left = centerising_offset *0.5 - this.button_font_size*0.3;

	    console.log(key_label, key_font_size, kl_left);
	    draw_boxed_label(key_label, key_font_size, kl_left);

	    if(n_ind == 0){//it's the CANCEL button
		var extra_width = buttonObsArray[2].getWidth();
		draw_boxed_label("5", key_font_size, kl_left + extra_width);
		var CancelTextwith15boxRightPx = kl_left + extra_width*2;
		if(buttonObsArray[1].getLeft() < CancelTextwith15boxRightPx){
		    buttonObsArray[1].setLeft(CancelTextwith15boxRightPx);
		} 
	    }
	}

	//sequence of layer ordering: push the box before the letter...
	

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


    updateTurnLetter_number: function(){
	var n_tiles_remaining = tilestats.n_tiles-tileset.length;
	console.log(n_tiles_remaining);

	var TurnButton = this.Button_Objs[1];
	if(n_tiles_remaining>0){
	    TurnButton.item(1).setText("Turn Letter (" + n_tiles_remaining + ")");
	}else{
	    TurnButton.item(1).setText("Finish Game");
	}
    },

    turnDisabled: false,
    cancelTurnDisabled: false,
    setTurnDisabled: function(disable){
	this.turnDisabled = disable;
	var TurnTextObj = this.Button_Objs[1].item(1);
	var TurnRectObj = this.Button_Objs[1].item(0);
    	TurnRectObj.setFill('#AAA');
	//change the button text colour
	if(disable){
	    TurnTextObj.setFill('#75746E');
	}else{
	    TurnTextObj.setFill('black');
	    TurnRectObj.setStroke(snDraw.Game.fg_col);
	}
    },

    startTurnDisableTimeout: function(){

	if(this.turnDisabled){//the function irrelivant if the turn is not already disabled...

	    //count words in play...
	    var n_words = 0;
	    for (var i=0; i<players.length; i++){
		n_words += players[i].words.length;
	    }

	    var fast_flip = (players.length < 2) || (n_words == 0);

	    //How long (in seconds) should it take for the button to become available again?
	    var dur = (dev || fast_flip) ? 1 : 10;//minimise wait in development mode...

	    //make the outline of the button coloured.
	    var RoundedRec = this.Button_Objs[1].item(0);
	    RoundedRec.setStroke(snDraw.Game.client_col);

	    //todo: this values ought only be calculated once as they are constant w.r.t. a game instance

	    var corners_r = snDraw.Game.tileSize * 0.12;

	    //this is the exact number of pixels of the perimeter of the rounded cornered rectangle (test by making the 1.0 slightly smaller!)
	    var l_tot = ((RoundedRec.getWidth() + RoundedRec.getHeight()) * 2 + 2*corners_r*(Math.PI-4.0))* 1.0;
	    var fps = (1000/snDraw.frameperiod_measured);//TODO: fps is not fixed for different platforms. It needs to be measured upon page load.
	    var f_tot = Math.round(dur*fps,0);//whole number of frames...
	    
	    RoundedRec.setStrokeDashArray([0, l_tot]);

	    this.cancelTurnDisabled=false;
	    snDraw.FrameTargetsArray.push({
		//these persistant data are set for the lifespan of the function below.
		count:0,
		start_time: undefined, // this is just code instrumentation...
		frame: function(){
		    if(this.count==0){this.start_time = new Date();}
		    this.count++;
		    var solid_len = (this.count/f_tot)*l_tot;
		    RoundedRec.setStrokeDashArray([solid_len, l_tot-solid_len]);
		    if((this.count > f_tot)||(snDraw.Game.Controls.cancelTurnDisabled)){//animation completed...
			//restore the visual state of the button to normal
			RoundedRec.setStrokeDashArray(null);
			snDraw.Game.Controls.setTurnDisabled(false);
			//instrumentation....
			var end_time = new Date();
			//TODO: make the animation duration more accurate...
			//console.log("The animation was meant to take " + dur + " seconds; measured as " + (end_time.getTime() - this.start_time.getTime())/1000);
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
    		ButtonRect.setFill(snDraw.Game.fg_col);
		if(KeyLabel){KeyLabel.setFill('#999');}
	    }
	    else{
    		ButtonRect.setStroke(snDraw.Game.fg_col);
    		ButtonRect.setFill('#AAA');
		if(KeyLabel){KeyLabel.setFill('#CCC');}
	    }
	    canvas.renderAll();
	}
    },


    turnLetterClickHandler: function(){
	if(this.turnDisabled){
	    console.log("TOAST: you must wait before you are allowed to take another turn. Number of seconds = [todo]");
	}else{
	    this.setTurnDisabled(true);
	    var n_tiles_remaining = tilestats.n_tiles-tileset.length;
	    if(n_tiles_remaining>0){
		TILE_TURN_REQUEST(); //request another tile...
	    }else{
		var really = confirm("Do you really want to finish the game?");
		if(really){RESET_REQUEST();}
	    }
	}
    },


    createPlayersListWindow: function(){
	
	this.playersListWindowVisible = true;

	var DIM = snDraw.Game.tileSize * 1.35;
	var stroke_px = DIM * 0.1;
	var myZoneSmaller = Math.min(snDraw.canv_W,snDraw.canv_H); 
	var font_size =  myZoneSmaller * 0.030;

	var windowWidth = myZoneSmaller*0.8;

	var windowBox = new fabric.Rect({
	    width: windowWidth,
	    height: snDraw.canv_H - DIM * 0.7,
	    fill: '#AAA',
	    stroke: snDraw.Game.fg_col,
	    strokeWidth: stroke_px,
	    rx: DIM * 0.18,
	    ry: DIM * 0.18
	});

	var titleText = new fabric.Text("Players listing and scores",{
	    left: windowWidth * 0.105,
	    top: DIM * 0.3,
	    fill: 'black',
	    fontWeight: 'bold',
	    fontSize: font_size * 1.85
	});

	var playerObjList = [];
	var player_scores_list = [];
	//extact scores from players stat structure:
	for(var i = 0; i < players.length; i++){
	    var player_i_score = 0;
	    for(var j = 0; j < players[i].words.length; j++){
		player_i_score += Math.max(1,players[i].words[j].length-2);
	    }
	    player_scores_list.push({
		p_index: i,
		score: player_i_score
	    });
	}

	function comparePlayers(a, b) {
	    return a.score - b.score;
	}
	player_scores_list.sort(comparePlayers);
	player_scores_list.reverse();

	//use the scores list to generate the visuals
	for(var i=0; i<player_scores_list.length; i++){
	    //run through all players...
	    var Plr = players[player_scores_list[i].p_index];

	    var playerText = new fabric.Text((i+1)+ ". " + Plr.name,{
		fill: 'black',
		fontSize: font_size * 1.5
	    });

	    var playerScoreText = new fabric.Text(player_scores_list[i].score.toString(), {
		left: myZoneSmaller * 0.40,
		stroke: 'black',
		fontWeight: (i<3?800:100),
		strokeWidth: font_size * 0.05,
		fill: (i<3? Plr.color : 'black'),//only the high scoring players get their colour, top 3.
		fontSize: font_size * 1.8
	    });


	    var playerRowGrp = new fabric.Group([playerText, playerScoreText], {
		left: font_size * 2,
		top: font_size * (i+2.5) * 1.5
	    });


	    playerObjList[i] = playerRowGrp;

	}

	var visuals = [windowBox, titleText].concat(playerObjList);

	ScoresWindow = new fabric.Group( visuals, {
	    hasControls: false,
	    hasBorders: false,
	    selectable: false,
	    top: DIM * 0.3,
	    left: (snDraw.canv_W - windowWidth)/2
	});

	canvas.add(ScoresWindow);
	canvas.renderAll();
    },

    removePlayersListWindow: function(){
	if(this.playersListWindowVisible){
	    console.log("removing the scores window...");
	    canvas.remove(ScoresWindow);
	    snDraw.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
	    this.playersListWindowVisible = false;
	}
    }
};
