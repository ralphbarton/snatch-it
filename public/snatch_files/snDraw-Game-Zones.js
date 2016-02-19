snDraw.Game.Zones = {

    //member data
    PlayerZone: [],//rarranged subset of array players
    playersZoneTopPx: undefined,

    //member functions
    drawEntirePlayerZone: function(){

	this.PlayerZone = [];//clear the array TODO: this should not be necessary, this function should only ever be called once.
	// Populate 'this.PlayerZone' with a subset of players...
	this.PlayerZone[0] = {
	    player: players[client_player_index],
	    is_client: true
	};
	for (var i=0; i<players.length; i++){
	    if((i!=client_player_index)&&(players[i].words.length>0)){//not the Client Player AND Player has at least 1 word...
		this.PlayerZone.push({
		    player: players[i],
		    is_client: false
		});
	    }
	}

	this.calculatePlayerZoneSizes();//this sets attributes within the player objects

	for (var i=0; i<this.PlayerZone.length; i++){
	    this.drawPlayerZoneBox(this.PlayerZone[i]);// Draws the BOX
	    this.drawAllPlayerWords(this.PlayerZone[i]);//Draws all the WORDS
	}
    },


    calculatePlayerZoneSizes: function(){
	var nZones = this.PlayerZone.length;
	n_letters_in_zone = [];
	n_letters_played = 0;
	
	//count the number of letters each player has, and total letters used within words
	for(var i=0; i<nZones; i++){
	    n_letters_in_zone[i] = 0;
	    for(j=0; j<this.PlayerZone[i].player.words.length; j++){
		n_letters_in_zone[i] += this.PlayerZone[i].player.words[j].length;
	    }
	    n_letters_played += n_letters_in_zone[i];
	}

	//determine total amount of height contained within players' zone boxes
	section_height = myZoneHeight - this.playersZoneTopPx;
	zones_sum_height = section_height - nZones * snDraw.Game.stroke_px - (nZones-1)*snDraw.Game.textMarginUnit - snDraw.Game.marginUnit;
	basic_height = snDraw.Game.tileSize + 4*snDraw.Game.marginUnit;
	shareable_height = zones_sum_height - nZones * basic_height;

	var plr_top_cumulator = this.playersZoneTopPx;// the starting value for this variable is the lower edge of the tile zone...
	for(var i=0; i<nZones; i++){
	    //now, we don't want to go dividing by zero if it's a new game with nothing played!!
	    var hRatio = 0;
	    if(n_letters_played){
		hRatio = n_letters_in_zone[i] / n_letters_played;
	    }else{
		hRatio = 1 / nZones;
	    }

	    //this line of code adds the attribute calculated to the relevant player object within the array...
	    this.PlayerZone[i].zone_height = basic_height + Math.round( hRatio * shareable_height );
	    this.PlayerZone[i].zone_top = plr_top_cumulator;
	    plr_top_cumulator += this.PlayerZone[i].zone_height + snDraw.Game.textMarginUnit + snDraw.Game.stroke_px;
	}
    },

    drawPlayerZoneBox: function(pZone){

	var boxLeft   = snDraw.Game.marginUnit;
	var boxTop    = pZone.zone_top;
	var boxWidth  = myZoneWidth - 2 * snDraw.Game.marginUnit - snDraw.Game.stroke_px;
	var boxHeight = pZone.zone_height;

	var zoneBox = new fabric.Rect({
	    left: boxLeft,
	    top: boxTop,
	    width: boxWidth,
	    height: boxHeight,
	    fill: snDraw.Game.bg_col,
	    stroke: pZone.player.color,
	    strokeWidth: snDraw.Game.stroke_px,
	});

	var plrName = new fabric.Text(pZone.player.name,{
	    left: 4 * snDraw.Game.marginUnit,
	    top: boxTop - snDraw.Game.textMarginUnit,
	    fontSize: 2 * snDraw.Game.textMarginUnit,
	    textBackgroundColor: snDraw.Game.bg_col,
	    fill: pZone.player.color,
	});

	var ObjectArray = [zoneBox,plrName];

	//label if YOU
	if(pZone.is_client){
	    
	    var cell = snDraw.Game.tileSize * 1.4;
	    var font_size = cell * 0.5;
	    var labelLeft = boxLeft + boxWidth;
	    var labelTop  = boxTop + boxHeight;

	    var youBlock = new fabric.Rect({
		left: labelLeft - cell,
		top: labelTop - cell * 0.5,
		width: cell + snDraw.Game.stroke_px*0.5,
		height: cell * 0.5 + snDraw.Game.stroke_px*0.5,
		fill: pZone.player.color
	    });

	    var youText = new fabric.Text("You",{
	    	left: labelLeft - cell* 0.87,
		top: labelTop - cell * 0.5,
		fill: snDraw.Game.bg_col,
		fontSize: font_size,
		fontWeight: 'bold',
	    });

	    ObjectArray.push(youBlock,youText);
	}

	pZone.FabObjects = [];
	for(var i=ObjectArray.length-1; i>=0; i--){
	    var OB = ObjectArray[i];
	    OB.set({
		hasControls: false,
		hasBorders: false,
		lockMovementX: true,
		lockMovementY: true
	    });
	    canvas.sendToBack(OB);
	    pZone.FabObjects[i] = OB;

	}

/*
	var plrZone = new fabric.Group(ObjectArray,{
	    hasControls: false,
	    hasBorders: false,
	    lockMovementX: true,
	    lockMovementY: true
	});
*/
/*
	var origX = plrZone.getLeft();
	var origY = plrZone.getTop();

	//move away (non animated)
	snDraw.moveSwitchable(plrZone, false, null,{
	    left: origX - myZoneWidth,
	    top: origY
	});

	snDraw.moveSwitchable(plrZone, true, snDraw.ani.sty_Join,{
	    left: origX,
	    top: origY
	});
*/
    },

    updatePlayerZones: function(new_zone_bottom){

	//update the data structures via its own references. Note that this may include the additional zone.
	this.calculatePlayerZoneSizes();
	
	var nZones = this.PlayerZone.length;
	if (new_zone_bottom){nZones--;}//don't make adjustment animations to the final zone which is new...

	for(var i=0; i<nZones; i++){

	    var myZone = this.PlayerZone[i]; 
	    var bxFab = myZone.FabObjects;
	    
	    var boxTop    = myZone.zone_top;
	    var boxHeight = myZone.zone_height;

	    var zoneBox   = bxFab[0];
	    var plrName   = bxFab[1];

	    snDraw.moveSwitchable(zoneBox, true, snDraw.ani.sty_Resize,{
		top: boxTop,
		height: boxHeight
	    });

	    snDraw.moveSwitchable(plrName, true, snDraw.ani.sty_Resize,{
		top: boxTop - snDraw.Game.textMarginUnit
	    });

	    if(i==0){
		var youBlock  = bxFab[2];
		var youText   = bxFab[3];
		var labelTop  = boxTop + boxHeight;
		var cell = snDraw.Game.tileSize * 1.4;

		snDraw.moveSwitchable(youBlock, true, snDraw.ani.sty_Resize,{
		    top: labelTop - cell * 0.5
		});

		snDraw.moveSwitchable(youText, true, snDraw.ani.sty_Resize,{
		    top: labelTop - cell * 0.5
		});

	    }
	}
    },


    // for example player.words : [[23,14,11],[44,12,13,19,4]]
    drawAllPlayerWords: function(pZone){
	//since this function is only invoked when first drawing the game for each player, this is the time to set the base coordinates:
	pZone.player.x_next_word = snDraw.Game.x_plotter_R;
	pZone.player.y_next_word = pZone.zone_top + 1.8 * snDraw.Game.marginUnit;
	//LOOP thru all the player's words...
	// draw them onscreen
	for (var i=0; i<pZone.player.words.length; i++){
	    snDraw.Game.drawSingleCapturedWord(pZone.player, i);	
	}

	//this prep's the SPELL class to place letters in the right location
	// it is needed within this function call because the player won't necessarily have any words at the start...
	snDraw.Game.Spell.restoreBasePosition();
    }

};
