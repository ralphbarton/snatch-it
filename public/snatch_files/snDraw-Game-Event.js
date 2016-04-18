snDraw.Game.Event = {

    //this function is called upon entry into the game and anything that requires redraw of all (such as window resize)
    DrawAll: function(){

	// 1. Determine Scale Constants & set background...
	var Spacings = snDraw.Game.calculateRenderingDimentionConstants();
	snDraw.Game.Zones.SetZoneStyleScalingsFromTileSize(Spacings.ts);
	canvas.setBackgroundColor(snDraw.Game.bg_col);

	// 2. Add the controls strip
	snDraw.Game.Controls.createControls();

	// 3. Create all the grid tiles...
	snDraw.Game.Grid.InitialiseGrid(Spacings);
	for (var i = 0; i < tileset.length; i++){
	    if(tileset[i].status == "turned"){
		//generate tile & put in grid
		var TileObject_i = snDraw.Game.generateTileObject(tileset[i], i);
		var gridRC = snDraw.Game.Grid.GetGridSpace();
		snDraw.Game.Grid.PlaceTileInGrid(i, gridRC, false, null);//todo rename this...
	    }
	}

	// 4. Create the zones containers (this is NOT visually creating the zones)
	snDraw.Game.Zones.PlayerZone = [];

	// 4.1 Unconditionally add client's zone
	snDraw.Game.Zones.PlayerZone[0] = {
	    player: players[client_player_index],
	    is_client: true
	};

	// 4.2 Add all players who who (A) have words, (B) aren't client and (C) aren't disconnected.
	// Potentially add Unclaimed Zone
	snDraw.Game.Zones.Unclaimed.playerslist = [];
	snDraw.Game.Zones.Unclaimed.exists = false;
	for (var i=0; i<players.length; i++){
	    if((i!=client_player_index) && (players[i].words.length>0)){
		if(players[i].is_disconnected == false){
		    snDraw.Game.Zones.PlayerZone.push({
			player: players[i],
			is_client: false
		    });
		}else{
		    snDraw.Game.Zones.Unclaimed.exists = true;
		    snDraw.Game.Zones.Unclaimed.playerslist.push(players[i]);
		}
	    }
	}


	// 5. WORD OBJECT GENERATION - for all players, and for the unclaimed zone

	// 5.1 Define a function here to generate a player's words as a list of Fabric objects
	function generatePlayerWordObjs(player){
	    var WordGrpsList = [];
	    for (var j = 0; j < player_i.words.length; j++){

		//extract the tileIDs of the tiles that make up this word, and create a tile object array
		var WordTileArray = [];
		for (var k = 0; k < player_i.words[j].length; k++){
		    var TID = player_i.words[j][k];
		    var TileObject = snDraw.Game.generateTileObject(tileset[TID], TID);
		    WordTileArray.push(TileObject);
		}
		
		//Now make it into a word...
		var WordGroup_j = snDraw.Game.Words.CreateWordAsTileGroupAtOrigin(
		    WordTileArray, Spacings, player_i);

		//Add that word to the list...
		WordGrpsList.push(WordGroup_j);
	    }
	    return WordGrpsList;
	}

	//5.2 retrieve style information...
	var ZoneSty_P = snDraw.Game.Zones.Style1;
	var WordBounds_P = ZoneSty_P.WordBlockBounds;
	var ZoneSty_U = snDraw.Game.Zones.Style2;
	var WordBounds_U = ZoneSty_U.WordBlockBounds;
	var interzonePad = snDraw.Game.Zones.ZoneVerticalPaddings;


	//5.3 Generate the word objects for all of the inactive players, and determine the arrangement for the unclaimed zone
	if(snDraw.Game.Zones.Unclaimed.exists){
	    var UnclaimedWordGroups = [];
	    for (var i = 0; i < snDraw.Game.Zones.Unclaimed.playerslist.length; i++){
		var player_i = snDraw.Game.Zones.Unclaimed.playerslist[i];
		UnclaimedWordGroups = UnclaimedWordGroups.concat(generatePlayerWordObjs(player_i));
	    }
	    var UnclaimedArrangement = snDraw.Game.Words.GenWordArrangement(UnclaimedWordGroups, WordBounds_U, Spacings, "center");
	    snDraw.Game.Zones.Unclaimed.stored_WordArrangement_noH = UnclaimedArrangement;
	    snDraw.Game.Zones.Unclaimed.stored_WordGroup = UnclaimedWordGroups;
	}

	//5.4 Generate all word objects and arrangements for the zones of active players
	var ArrangementsArray = [];
	var ZonesWordsGroups = [];

	for (var i = 0; i < snDraw.Game.Zones.PlayerZone.length; i++){
	    var player_i = snDraw.Game.Zones.PlayerZone[i].player;

	    var WordGrpsList_i = generatePlayerWordObjs(player_i);
	    ZonesWordsGroups.push(WordGrpsList_i);

	    var Arrangement_i = snDraw.Game.Words.GenWordArrangement(WordGrpsList_i, WordBounds_P, Spacings, "left");
	    ArrangementsArray.push(Arrangement_i);
	    snDraw.Game.Zones.PlayerZone[i].stored_WordArrangement_noH = Arrangement_i;
	    // PlayerZone[i].stored_WordGroup  // this is not needed (don't re-add it) because these objects are otherwise ref'd
	}



	// 6. DRAWING THINGS IN PLACE ON CANVAS - create and draw the zones and fill them with words

	// 6.1 Define a function which draws a zone filled with words on screen...
	function generateZoneOnCanvas(Top, Height, ZoneSty, Properties, WordGroup, WordArrangement_noH, WordBounds){
	    //generate the fabric objects that represent the new zone. Note that properties left & top are not set
	    //nor are the objects present onf the canvas.
	    var Zone_FabObjs = snDraw.Game.Zones.CreateZoneBox(Height, ZoneSty, Properties);
	    var Zone_Tops = snDraw.Game.Zones.DetermineZoneBoxObjectsTops(Top, Height, ZoneSty);
	    var Zone_Lefts = snDraw.Game.Zones.DetermineZoneBoxObjectsLefts(0, ZoneSty, Zone_FabObjs[1].width);

	    if(Properties.isClient){
		var spell_Left = Zone_Lefts[6]; 
		var spell_Top = Zone_Tops[6];
		snDraw.Game.Spell.setSpellPosition(spell_Left, spell_Top, false, null);
	    }

	    //for each object making the ZONE, set coordinates and place on canvas...
	    for (var j = 0; j < Zone_FabObjs.length; j++){
		Zone_FabObjs[j].setLeft(Zone_Lefts[j]);
		Zone_FabObjs[j].setTop(Zone_Tops[j]);
		canvas.add(Zone_FabObjs[j]);
	    }

	    // place the words in the zone

	    var WordsTopPx = Top + WordBounds.topPadding;
	    var Arrangement = snDraw.Game.Words.WordArrangementSetHeight(WordArrangement_noH, WordsTopPx);
	    for (var j = 0; j < Arrangement.coords.length; j++){
		snDraw.moveSwitchable(WordGroup[j], false, null, Arrangement.coords[j]);
	    }

	    return Zone_FabObjs;
	}

	var upper_drawing_bound = snDraw.Game.Grid.GetGridBottomPx();

	// 6.2 if an "unclaimed words zone" exists, then make this first.
	if(snDraw.Game.Zones.Unclaimed.exists){

	    upper_drawing_bound += snDraw.Game.Zones.ZoneVerticalPaddings.aboveU;
	    var Top = upper_drawing_bound;

	    var Height_pads_tot = ZoneSty_U.thick*2 + ZoneSty_U.w_vpad*2;
	    var Height = snDraw.Game.Zones.WordsStackHeightPx(UnclaimedArrangement, Spacings) + Height_pads_tot;

	    var Properties = {
		color: 'grey',
		text: 'unclaimed',
		isClient: false
	    };

	    var FAB = generateZoneOnCanvas(Top,
					   Height,
					   ZoneSty_U,
					   Properties,
					   UnclaimedWordGroups,
					   UnclaimedArrangement,
					   WordBounds_U);

	    //store a reference to the fabric ojects that make the zone box on the canvas
	    snDraw.Game.Zones.Unclaimed.Zone_FabObjs = FAB;

	    upper_drawing_bound += Height;
	}
	

	// 6.3 Now make all of the player zones. Calculate their heights and draw them...
	// function returns [{Top: , Height: }, ...}
	var ZoneSizes = snDraw.Game.Zones.CalcZoneSizes(ArrangementsArray, upper_drawing_bound, interzonePad, Spacings);

	//Actually generate all of the active player zones...
	for (var i = 0; i < snDraw.Game.Zones.PlayerZone.length; i++){

	    var Top = ZoneSizes[i].Top;
	    var Height = ZoneSizes[i].Height;

	    var Properties = {
		color: snDraw.Game.Zones.PlayerZone[i].player.color, // text colour and box boundary
		text: snDraw.Game.Zones.PlayerZone[i].player.name, // Text of the title
		isClient: snDraw.Game.Zones.PlayerZone[i].is_client
	    };

	    var FAB = generateZoneOnCanvas(Top,
					   Height,
					   ZoneSty_P,
					   Properties,
					   ZonesWordsGroups[i],
					   ArrangementsArray[i],
					   WordBounds_P);

	    //store a reference to the fabric ojects that make the zone box on the canvas
	    snDraw.Game.Zones.PlayerZone[i].Zone_FabObjs = FAB;

	}

    },

    SnatchEvent: function(){

    },
    
    TileTurn: function(player_index, tile_index, letter, ani_sty){

	// 1. modifiy the client copy of the fundamental game-state data:
	tileset[tile_index] = {
	    letter: letter,
	    status: "turned"
	};
	tilestats.n_turned++;
	// 1.1 update the button
	var n_tiles_remaining = tilestats.n_tiles - tileset.length;
	snDraw.Game.Controls.updateTurnLetter_number(n_tiles_remaining);


	// 2. Determine if zones need to be squeezed because the tile grid has grown vertically...
	var old_grid_bottom_px = snDraw.Game.Grid.GetGridBottomPx();

	snDraw.Game.Turn.newTurnedTile_FlyIn_animate(tile_index, player_index, snDraw.ani.sty_Sing);

	var upper_drawing_bound = snDraw.Game.Grid.GetGridBottomPx();
	var zone_resize_necesary = old_grid_bottom_px != upper_drawing_bound;




	// 3. If necessary, squeeze everything downwards.
	if(zone_resize_necesary){

	    //TODO muchos attentionos needed here

	    // 3.01 - create a function that moves and resizes the zone box)
	    function resizeZoneOnCanvas(Zone, Top, Height, ZoneSty, WordBounds, ani_sty){

		// copy - pasted...
		var Zone_FabObjs = Zone.Zone_FabObjs;
		var Zone_Tops = snDraw.Game.Zones.DetermineZoneBoxObjectsTops(Top, Height, ZoneSty);

		var WordArrangement_noH = Zone.stored_WordArrangement_noH;
		var WordGroup = undefined;
		if(Zone.exists == undefined){// this means it is a player zone not the unclaimed zone
		    var PID = Zone.player.index;
		    WordGroup = snDraw.Game.Words.TileGroupsArray[PID];
		}else{
		    WordGroup = Zone.stored_WordGroup;
		}

		if(Zone.is_client){
		    var spell_Top = Zone_Tops[6];
		    // move the spell-pointer into new position
		    snDraw.Game.Spell.setSpellPosition(null, spell_Top, true, ani_sty);
		}

		// for each object making the ZONE, animate it into the new position
		for (var j = 0; j < Zone_FabObjs.length; j++){
		    snDraw.moveSwitchable(Zone_FabObjs[i], true, ani_sty,{
			top: Zone_Tops[i]
		    });
		}

		// also animate all words into new positions

		var WordsTopPx = Top + WordBounds.topPadding;
		var Arrangement = snDraw.Game.Words.WordArrangementSetHeight(WordArrangement_noH, WordsTopPx);
		for (var j = 0; j < Arrangement.coords.length; j++){
		    snDraw.moveSwitchable(WordGroup[j], true, ani_sty, Arrangement.coords[j]);
		}
	    }


	    // 3.02 - retrieve style information...
	    var ZoneSty_P = snDraw.Game.Zones.Style1;
	    var WordBounds_P = ZoneSty_P.WordBlockBounds;
	    var ZoneSty_U = snDraw.Game.Zones.Style2;
	    var WordBounds_U = ZoneSty_U.WordBlockBounds;
	    var interzonePad = snDraw.Game.Zones.ZoneVerticalPaddings;
	    var Spacings = snDraw.Game.tileSpacings;


	    // 3.1 Move the unclaimed zone & its words
 	    //unfortunately, this is partly copy-pasted code from original creation of the zones....
	    if(snDraw.Game.Zones.Unclaimed.exists){

		upper_drawing_bound += snDraw.Game.Zones.ZoneVerticalPaddings.aboveU;
		var Top = upper_drawing_bound;

		var Height_pads_tot = ZoneSty_U.thick*2 + ZoneSty_U.w_vpad*2;
		var Height = snDraw.Game.Zones.WordsStackHeightPx(UnclaimedArrangement, Spacings) + Height_pads_tot;

		resizeZoneOnCanvas(snDraw.Game.Zones.Unclaimed, Top, Height, ZoneSty_U, WordBounds_U, ani_sty);

		upper_drawing_bound += Height;
	    }


	    // 3.2 Move the player zones and all words

	    // 3.2.1 extract a list of all arrangements, and use it to determine new zone sizes...
	    var ArrangementsArray = [];
	    for (var i = 0; i < snDraw.Game.Zones.PlayerZone.length; i++){
		ArrangementsArray[i] = snDraw.Game.Zones.stored_WordArrangement_noH;
	    }

	    var ZoneSizes = snDraw.Game.Zones.CalcZoneSizes(ArrangementsArray, upper_drawing_bound, interzonePad, Spacings);

	    // Actually generate all of the active player zones...
	    for (var i = 0; i < snDraw.Game.Zones.PlayerZone.length; i++){

		var Top = ZoneSizes[i].Top;
		var Height = ZoneSizes[i].Height;

		resizeZoneOnCanvas(snDraw.Game.Zones.PlayerZone[i], Top, Height, ZoneSty_P, WordBounds_P, ani_sty);
	    }
	    
	}


	// 4. modify the "Turn letter button, based upon who turned the tile.
	if(player_index == client_player_index){//the player that flipped was the client...
	    snDraw.Game.Controls.startTurnDisableTimeout();
	}else{
	    //the simple effect of this is that any non-client player flip resets the timer to re-allow client flip.
	    snDraw.Game.Controls.cancelTurnDisabled = true;
	}

    },
    
    Disconnection: function(){
	return null;
    },
    
    Reconnection: function(){

    },

    resizeTimeoutID: undefined,
    WindowResize: function(){

	if(this.resizeTimeoutID != undefined){
	    clearTimeout(this.resizeTimeoutID);
	    this.resizeTimeoutID = undefined;
	}
	
	this.resizeTimeoutID = setTimeout(function(){
	    canvas.clear();
	    snDraw.makeCanvasFitWholeWindow();
	    snDraw.Game.Event.DrawAll();
	    console.log("Toast: A window resize was executed");
	    snDraw.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
	}, 1000);
    }

};
