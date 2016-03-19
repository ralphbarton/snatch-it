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
	TurnButton.item(1).setText("Turn Letter (" + n_tiles_remaining + ")");
    },

    createGenericButton: function(text,n_ind){

	var tile_DIM = snDraw.Game.tileSize;
	var gap_width = tile_DIM*0.2;
	var font_size = myZoneWidth * 0.030;
	var line_thickness = tile_DIM * 0.06;
	var corners_rounding = tile_DIM * 0.12;

	var N_but = this.button_widths.length;

	var button_w_px = [];
	var button_l_px = [gap_width/2];
	for (var i=0; i<N_but; i++){
	    button_w_px[i] = (myZoneWidth - N_but * gap_width) * (this.button_widths[i] / this.button_widths_cumulated[N_but-1]);
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
	if (style=="hover"){
    	    myButtonGrp.item(0).setStroke('#FF0');
    	    myButtonGrp.item(0).setFill('#AAA');
	}
	else if (style=="press"){
            myButtonGrp.item(0).setStroke('#FF0');
    	    myButtonGrp.item(0).setFill(snDraw.Game.fg_col);
	}
	else{
    	    myButtonGrp.item(0).setStroke(snDraw.Game.fg_col);
    	    myButtonGrp.item(0).setFill('#AAA');
	}
	canvas.renderAll();
    },


    createPlayersListWindow: function(){
	var DIM = snDraw.Game.tileSize * 1.35;
	var stroke_px = DIM * 0.1;
	var myZoneSmaller = Math.min(myZoneWidth,myZoneHeight); 
	var font_size =  myZoneSmaller * 0.030;

	var windowWidth = myZoneSmaller*0.8;

	var windowBox = new fabric.Rect({
	    width: windowWidth,
	    height: myZoneHeight - DIM * 0.7,
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
	    left: (myZoneWidth - windowWidth)/2
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
