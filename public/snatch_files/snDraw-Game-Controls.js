snDraw.Game.Controls = {

    //member variables
    playersListWindowVisible: false,
    ScoresWindow: undefined,

    createControls: function(){
	
	this.createGenericButton("Cancel Word",0,4);
	this.createGenericButton("SNATCH IT",1,4);
	this.createGenericButton("Players List",2,4);
	this.createGenericButton("Reset Game",3,4);

    },

    createGenericButton: function(text,n_ind,N_but){

	var tile_DIM = snDraw.Game.tileSize;
	var gap_width = tile_DIM*0.3;
	var font_size = myZoneWidth * 0.030;
	var line_thickness = tile_DIM * 0.06;
	var corners_rounding = tile_DIM * 0.12;

	var button_width = (myZoneWidth - (N_but+1) * gap_width)/N_but;

	var button_left = n_ind * (button_width + gap_width) +0.5*gap_width+6;

	var buttonText = new fabric.Text(text,{
	    originX: 'center',
	    top: (tile_DIM - font_size)*0.5,
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
	    height: tile_DIM,
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

    //deals with the resetting of the game (lots of confirmation steps)
    resetGameButtonHandler: function(){
	var really = confirm("Do you really want to reset this game?");
	if(really){RESET_REQUEST();}
    },

    //submit word to server
    snatchItButtonHandler: function(myWordStr){
	//confirm("Submit the word"+myWordStr+"?");
	snDraw.Game.Spell.SubmitWord();
    },


    cancelWordButtonHandler: function(){
	//alert("cancel word...");
	snDraw.Game.Spell.CancelWord();
    },


    //Here is the function that will draw the "scores" box onto the screen
    playersListButtonHandler: function(){
	this.createPlayersListWindow();
	this.playersListWindowVisible = true;

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
	for(i=0; i<players.length; i++){
	    //run through all players...
	    var myName = players[i].name;

	    var playerText = new fabric.Text((i+1)+ ". " + myName,{
		fill: 'black',
		fontSize: font_size * 1.5
	    });

	    function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	    }

	    var playerScoreText = new fabric.Text(getRandomInt(1,18).toString(), {
		left: myZoneSmaller * 0.40,
		stroke: 'black',
		fontWeight: 'bold',
		strokeWidth: font_size * 0.05,
		fill: players[i].color,
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
