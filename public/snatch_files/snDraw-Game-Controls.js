snDraw.Game.Controls = {

    //member variables
    playersListWindowVisible: false,
    ScoresWindow: undefined,
    button_widths: [],
    button_widths_cumulated: [],
    Button_Objs: [],

    createControls: function(){
	
	this.button_widths =  [10,20,20,10,5];

	//some preprocessing from the widths list...
	this.button_widths_cumulated[0] = this.button_widths[0];

	for (var i=1; i<this.button_widths.length; i++){
	    this.button_widths_cumulated[i] = this.button_widths_cumulated[i-1] + this.button_widths[i];
	}

	this.Button_Objs[0] = this.createGenericButton("Cancel",0);
	this.Button_Objs[1] = this.createGenericButton("Turn Letter",1);
	this.Button_Objs[2] = this.createGenericButton("SNATCH IT",2);
	this.Button_Objs[3] = this.createGenericButton("Scores",3);
	this.Button_Objs[4] = this.createGenericButton("Opt",4);
	this.updateTurnLetter_number();
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
	    clientCol = players[client_player_index].color;
	    RoundedRec.setStroke(clientCol);

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

    createGenericButton: function(text,n_ind){

	var tile_DIM = snDraw.Game.tileSize;
	var gap_width = tile_DIM*0.2;
	var font_size = snDraw.canv_W * 0.030;
	var line_thickness = tile_DIM * 0.06;
	var corners_rounding = tile_DIM * 0.12;

	var N_but = this.button_widths.length;

	var button_w_px = [];
	var button_l_px = [gap_width/2];
	for (var i=0; i<N_but; i++){
	    button_w_px[i] = (snDraw.canv_W - N_but * gap_width) * (this.button_widths[i] / this.button_widths_cumulated[N_but-1]);
	    button_l_px[i+1] = button_l_px[i] + gap_width + button_w_px[i] ;
	}

	var button_width = button_w_px[n_ind];
	var button_left = button_l_px[n_ind];

	var buttonText = new fabric.Text(text,{
	    originX: 'center',
	    top: (tile_DIM - font_size)*0.3,
	    fill: 'black',
	    fontWeight: 'bold',
	    fontSize: font_size
	});

	var buttonRect = new fabric.Rect({
	    originX: 'center',
	    top: 0,
	    fill: '#AAA',
	    stroke: snDraw.Game.fg_col,
	    strokeWidth: line_thickness,
	    width: button_width,
	    height: tile_DIM*0.7,
	    rx: corners_rounding,
	    ry: corners_rounding
	});

	var buttonGrp = new fabric.Group( [buttonRect, buttonText], {
	    hasControls: false,
	    hasBorders: false,
	    selectable: false,
	    top: 6,
	    left: button_left
	});
	
	buttonGrp.gameButtonID = n_ind;
	canvas.add(buttonGrp);
	return buttonGrp;
    },


    buttonRecolor: function(myButtonGrp,style){
	if((myButtonGrp.gameButtonID!=1)||(!this.turnDisabled)){//condition prevents interference with the animating Turn button (ID =1 for Turn button)
	    var ButtonRect = myButtonGrp.item(0);

	    if (style=="hover"){
    		ButtonRect.setStroke('#FF0');
    		ButtonRect.setFill('#AAA');
	    }
	    else if (style=="press"){
		ButtonRect.setStroke('#FF0');
    		ButtonRect.setFill(snDraw.Game.fg_col);
	    }
	    else{
    		ButtonRect.setStroke(snDraw.Game.fg_col);
    		ButtonRect.setFill('#AAA');
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
	console.log("removing the scores window...");
	canvas.remove(ScoresWindow);
	playersListWindowVisible=false;
    }
};
