snDraw.Game.Zones = {

    //member data
    PlayerZone: [],
    playersZoneTopPx: undefined,

    //member functions
    drawEntirePlayerZone: function(){

	this.calculatePlayerZoneSizes();//this sets attributes within the player objects
	var plr_top_cumulator = this.playersZoneTopPx;// the starting value for this variable is the lower edge of the tile zone...

	for (var i=0; i<players.length; i++){
	    players[i].zone_top = plr_top_cumulator;
	    this.drawPlayerZoneBox(players[i]);// Draws the BOX
	    this.drawAllPlayerWords(players[i]);//Draws all the WORDS
	    plr_top_cumulator += players[i].zone_height + snDraw.Game.textMarginUnit + snDraw.Game.stroke_px;
	}
    },

    calculatePlayerZoneSizes: function(){
	var nPlayers = players.length;
	nLettersPlayer = [];
	nLettersTotPlayed = 0;
	
	//count the number of letters each player has, and total letters used within words
	for(i=0; i<nPlayers; i++){
	    nLettersPlayer[i] = 0;
	    for(j=0; j<players[i].words.length; j++){
		nLettersPlayer[i] += players[i].words[j].length;
	    }
	    nLettersTotPlayed += nLettersPlayer[i];
	}

	//determine total amount of height contained within players' zone boxes
	section_height = myZoneHeight - this.playersZoneTopPx;
	zones_sum_height = section_height - nPlayers * snDraw.Game.stroke_px - (nPlayers-1)*snDraw.Game.textMarginUnit - snDraw.Game.marginUnit;
	basic_height = snDraw.Game.tileSize + 4*snDraw.Game.marginUnit;
	shareable_height = zones_sum_height - nPlayers * basic_height;

	for(i=0; i<nPlayers; i++){
	    //now, we don't want to go dividing by zero if it's a new game with nothing played!!
	    var hRatio = 0;
	    if(nLettersTotPlayed){
		hRatio = nLettersPlayer[i]/nLettersTotPlayed;
	    }else{
		hRatio = 1 / nPlayers;
	    }

	    //this line of code adds the attribute calculated to the relevant player object within the array...
	    players[i].zone_height = basic_height + Math.round( hRatio * shareable_height );
	}
    },


    drawPlayerZoneBox: function(myplayer){

	var zoneBox = new fabric.Rect({
	    left: snDraw.Game.marginUnit,
	    top: myplayer.zone_top,
	    fill: snDraw.Game.bg_col,
	    stroke: myplayer.color,
	    strokeWidth: snDraw.Game.stroke_px,
	    width: myZoneWidth - 2 * snDraw.Game.marginUnit - snDraw.Game.stroke_px,
	    height: myplayer.zone_height,
	});

	var plrName = new fabric.Text(myplayer.name,{
	    left: 4 * snDraw.Game.marginUnit,
	    top: myplayer.zone_top - snDraw.Game.textMarginUnit,
	    fontSize: 2 * snDraw.Game.textMarginUnit,
	    textBackgroundColor: snDraw.Game.bg_col,
	    fill: myplayer.color,
	});

	var plrZone = new fabric.Group([zoneBox,plrName],{
	    hasControls: false,
	    hasBorders: false,
	    lockMovementX: true,
	    lockMovementY: true
	});

	canvas.sendToBack(plrZone);
    },


    // for example player.words : [[23,14,11],[44,12,13,19,4]]
    drawAllPlayerWords: function(myplayer){
	//since this function is only invoked when first drawing the game for each player, this is the time to set the base coordinates:
	myplayer.x_next_word = snDraw.Game.x_plotter_R;
	myplayer.y_next_word = myplayer.zone_top + 1.8 * snDraw.Game.marginUnit;
	//LOOP thru all the player's words...
	// draw them onscreen
	for (var i=0; i<myplayer.words.length; i++){
	    snDraw.Game.drawSingleCapturedWord(myplayer, i);	
	}

	//this prep's the SPELL class to place letters in the right location
	// it is needed within this function call because the player won't necessarily have any words at the start...
	snDraw.Game.Spell.restoreBasePosition();
    }

};
