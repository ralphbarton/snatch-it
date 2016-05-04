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

	// 4. Create all the word objects
	// (for all players indiscriminately, as this will generate those for the unclaimed zone also)
	// this declares no data locally, but 'snDraw.Game.Words.TileGroupsArray' is modified.
	for (var i = 0; i < players.length; i++){
	    snDraw.Game.Words.TileGroupsArray[i] = [];
	    for (var j = 0; j < players[i].words.length; j++){

		//extract the tileIDs of the tiles that make up this word, and create a tile object array
		// simultaneously remove singly tiles from the canvas. They will be put in a group, and the group will go on canvas
		var WordTileArray = [];
		for (var k = 0; k < players[i].words[j].length; k++){

		    var TID = players[i].words[j][k];
		    var TileObject = snDraw.Game.generateTileObject(tileset[TID], TID);
		    canvas.remove(TileObject);
		    WordTileArray.push(TileObject);

		    //arrange into word based at origin
		    TileObject.set({
			left: (k * Spacings.tslg),
			top: 0
		    });
		}
		
		//Form the Group for the word...
		var WordGRP = new fabric.Group( WordTileArray, {
		    left: 0, 
		    top: 0,
		    hasControls: false,
		    hasBorders: false
		});
		canvas.add(WordGRP);

		//Global references forwards and backwards
		WordGRP.OwnerPlayer = players[i];
		snDraw.Game.Words.TileGroupsArray[i].push(WordGRP);
	    }
	}


	// 5. Create the zones containers (this is NOT visually creating the zones)
	snDraw.Game.Zones.PlayerZone = [];

	// 5.1 Unconditionally add client's zone
	snDraw.Game.Zones.PlayerZone[0] = {
	    player: players[client_player_index],
	    is_client: true
	};

	// 5.2 Add all players who who (A) have words, (B) aren't client and (C) aren't disconnected.
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

	// 6. Get the positions and arrangements of everything...
	var Positions = snDraw.Game.Zones.calculateAllPositionsArrangements();

	// 7. Drawing the zones on the canvas, and moving the words into them...

	// 7.1 Define a function which draws a zone filled with words on screen...
	function generateZoneAndMoveWordsOnCanvas(Top, Height, ZoneSty, Properties, WordGroup, WordArrangement_noH, WordBounds){
	    //generate the fabric objects that represent the new zone. Note that properties left & top are not set
	    //nor are the objects present onf the canvas.
	    var Zone_FabObjs =  snDraw.Game.Zones.CreateZoneBox(Height, ZoneSty, Properties);
	    var Zone_Tops = snDraw.Game.Zones.DetermineZoneBoxObjectsTops(Top, Height, ZoneSty);
	    var Zone_Lefts = snDraw.Game.Zones.DetermineZoneBoxObjectsLefts(0, ZoneSty, Zone_FabObjs[1].width);
	    var flex_box_height = snDraw.Game.Zones.DetermineZoneFlexBoxHeight(Height, ZoneSty);

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
	    //also set the height of the only item in Zone_FabObjs which has flexi-height...
	    Zone_FabObjs[0].setHeight(flex_box_height);

	    // place the words in the zone
	    var WordsTopPx = Top + WordBounds.topPadding;
	    var Arrangement = snDraw.Game.Words.WordArrangementSetHeight(WordArrangement_noH, WordsTopPx);
	    for (var j = 0; j < Arrangement.coords.length; j++){
		snDraw.moveSwitchable(WordGroup[j], false, null, Arrangement.coords[j]);
	    }
	    return Zone_FabObjs;
	}

	// 7.2 - retrieve style information, for both player and unclaimed zones
	var ZoneSty_P = snDraw.Game.Zones.Style1;
	var WordBounds_P = ZoneSty_P.WordBlockBounds;
	var ZoneSty_U = snDraw.Game.Zones.Style2;
	var WordBounds_U = ZoneSty_U.WordBlockBounds;

	// 7.3 if an "unclaimed words zone" exists, then make this first.
	if(snDraw.Game.Zones.Unclaimed.exists){
	    var Properties = {
		color: 'grey',
		text: 'unclaimed',
		isClient: false
	    };
	    
	    var FAB = generateZoneAndMoveWordsOnCanvas(Positions.Unclaimed_D.Top,
						       Positions.Unclaimed_D.Height,
						       ZoneSty_U,
						       Properties,
						       snDraw.Game.Words.getUnclaimedWordsList("via Grp"),
						       Positions.Unclaimed_D.Arrangement_noH,
						       WordBounds_U
						      );

	    //store a reference to the fabric ojects that make the zone box on the canvas
	    snDraw.Game.Zones.Unclaimed.Zone_FabObjs = FAB;
	}
	

	// 7.4 Now make all of the player zones.
	for (var i = 0; i < snDraw.Game.Zones.PlayerZone.length; i++){
	    var player_index = snDraw.Game.Zones.PlayerZone[i].player.index;
	    var Properties = {
		color: snDraw.Game.Zones.PlayerZone[i].player.color, // text colour and box boundary
		text: snDraw.Game.Zones.PlayerZone[i].player.name, // Text of the title
		isClient: snDraw.Game.Zones.PlayerZone[i].is_client
	    };
	    var FAB = generateZoneAndMoveWordsOnCanvas(Positions.ZoneSizes[i].Top,
						       Positions.ZoneSizes[i].Height,
						       ZoneSty_P,
						       Properties,
						       snDraw.Game.Words.TileGroupsArray[player_index],
						       Positions.ArrangementsArray_noH[i],
						       WordBounds_P
						      );

	    //store a reference to the fabric ojects that make the zone box on the canvas
	    snDraw.Game.Zones.PlayerZone[i].Zone_FabObjs = FAB;
	}
    },
    
    TileTurn: function(player_index, tile_index, letter, ani_sty){

	// 1. modifiy the client copy of the fundamental game-state data:
	tileset[tile_index] = {
	    letter: letter,
	    status: "turned"
	};
	tilestats.n_turned++;

	// 1.1 update the button (to display correct number of letters remainng)
	var n_tiles_remaining = tilestats.n_tiles - tileset.length;
	snDraw.Game.Controls.updateTurnLetter_number(n_tiles_remaining);


	// 2. Determine if zones need to be squeezed because the tile grid has grown vertically...
	var old_grid_bottom_px = snDraw.Game.Grid.GetGridBottomPx();
	snDraw.Game.Turn.newTurnedTile_FlyIn_animate(tile_index, player_index, snDraw.ani.sty_Sing);

	var upper_drawing_bound = snDraw.Game.Grid.GetGridBottomPx();
	var zone_resize_necesary = old_grid_bottom_px != upper_drawing_bound;

	// 3. If necessary, squeeze everything downwards.
	if(zone_resize_necesary){
	    snDraw.Game.Zones.AnimateResizeAllZones(ani_sty);
	}

	// 4. Modify the "Turn Letter" button, based upon who turned the tile (start timer or cancel timer)
	if(player_index == client_player_index){ // the player that flipped was the client...
	    snDraw.Game.Controls.startTurnDisableTimeout();
	}else{
	    //the simple effect of this is that any non-client player flip resets the timer to re-allow client flip.
	    snDraw.Game.Controls.cancelTurnDisabled = true;
	}

    },

    SnatchEvent: function(player_index, tile_indices, words_used_list){

	// 1. Clear the Spell if it is the Client Snatching (this also sets some useful variables that are used in-among).
	var snatching_player = players[player_index];
	var client_is_snatcher = client_player_index == player_index;
	if(client_is_snatcher){snDraw.Game.Spell.CancelWord();}

	// 1.1 (log some data relevant to the SNATCH event. TODO: convert to Toasts)
	console.log("TOAST: " + snatching_player.name + " has snatched a word, tile indices are:", tile_indices);    
	console.log("words_used_list = " + JSON.stringify(words_used_list));

	// 2. Firstly, on the canvas, detach all the letters involved in the new word
	// also update underlying data to reflect the state update (i.e. updates "tileset" and "players")

	// 2.1 Detach all tile objects from the words they're in
	for (var i = 0; i < words_used_list.length; i++){
	    var PIi = words_used_list[i].PI;
	    var WIi = words_used_list[i].WI;

	    //modify the players data structure:
	    var removed_word_tileIDs = players[PIi].words[WIi];
	    delete players[PIi].words[WIi];//just delete the array element now, purge the array of empy elements later

	    //determine the group coordinates...
	    var StolenGRP = snDraw.Game.Words.TileGroupsArray[PIi][WIi];	    
	    var Stolen_x_base = StolenGRP.getLeft(); 
	    var Stolen_y_base = StolenGRP.getTop(); 

	    //remove tiles from Group, and place in position as individual tiles:
	    for (var j=0; j<removed_word_tileIDs.length; j++){
		var StolenTile = snDraw.Game.TileArray[removed_word_tileIDs[j]];
		snDraw.Game.Words.TileGroupsArray[PIi][WIi].remove(StolenTile);		
		//place individual tiles back on the canvas in location
		StolenTile.set({
		    left: Stolen_x_base + snDraw.Game.h_spacer * j,
		    top: Stolen_y_base
		});
		canvas.add(StolenTile);
	    }
	    
	    //remove the now empty group itself
	    canvas.remove(StolenGRP);
	    delete snDraw.Game.Words.TileGroupsArray[PIi][WIi];
	}
	// Remove the all references to Fabric Groups which are now empty of letter tiles, and words removed from raw data
	for (var i = 0; i<players.length; i++){
	    snDraw.Game.Words.TileGroupsArray[i].clean(undefined);
	    players[i].words.clean(undefined);
	}

	// 2.2 update the players data structure:
	snatching_player.words.push(tile_indices);


	// 2.3 update tileset for letters now In Words, and detach any letters in grid (i.e. the Fabric Objects)
	for(var i = 0; i < tile_indices.length; i++){
	    var TID = tile_indices[i];
	    tileset[TID].status = 'inword';
	}
	//note that there is handling in-place for when a tile index in the array we supply here is not actually in the grid.
	//note also that this function will rearrange the tiles that remain in the grid, for efficient packing following the
	//removal. This includes animation.
	snDraw.Game.Grid.DetachLetterSetFromGrid(tile_indices, ani_styleXX);


	// 3. Zone Handling upon Snatch
	var client_is_snatcher = client_player_index == snatching_player.index;
	var snatcher_first_word = snatching_player.words.length == 0;
	var new_zone = (!client_is_snatcher) && (snatcher_first_word);

	// 3.1 Create a new zone container (this is NOT visually creating the new zone for the snatching player)
	if(new_zone){
	    snDraw.Game.Zones.PlayerZone.push({
		player: snatching_player,
		is_client: false
	    });
	}
	//TODO - add function to create and animate IN the newly defined zone box

	// 3.2 Delete zones if required
	for(var i = 0; i < snDraw.Game.Zones.PlayerZone.length; i++){
	    var zone_i = snDraw.Game.Zones.PlayerZone[i];
	    
	    //proceed to remove zone_i if (A) there are no words in the zone and (B) it's a non-client player
	    if((zone_i.player.words.length == 0)&&(!zone_i.is_client)){
		var empty_zone = snDraw.Game.Zones.PlayerZone.splice(i,1)[0];
		i--;//because we spliced, counteract the increment of i.

		//TODO - replace with function to animate OUT the zone box
		//this.removeZoneBox(empty_zone);


	    }
	}



	// Animate the resizing of the zones 
	var nZones = this.PlayerZone.length; //note that the immediately preceeding code may remove zones and change the length.
	this.calculatePlayerZoneSizes();
	if (new_zone){nZones--;}//don't make adjustment animations to any new final zone...

	for(var i=0; i<nZones; i++){
	    //second parameter true prevents it from attempting to shuffle the final word (already present as data), as it will not yet be existant as a fabric group 
	    var zone_i = this.PlayerZone[i];
	    var snatched_word_in_this_zone = zone_i.player.index == snatching_player.index;
	    this.animateResizeZoneBox(zone_i);
	    //shuffle the player's words to back fill the gap, in case one of their words was just snatched away.
	    snDraw.Game.Words.animateRepositionPlayerWords(zone_i.player.index, snatched_word_in_this_zone);
	}//loop

	// does the player box need to be inserted onto the screen?
	if(new_zone){
	    //create new zone box...
	    var PZ = snDraw.Game.Zones.PlayerZone;
	    var FinalZone = PZ[PZ.length-1];
	    snDraw.Game.Zones.createZoneBox(FinalZone,true);// Draws the BOX, second parameter is for animation.	
	}





	//OLD CODE, TAKEN FROM 'snatch-client.js'...
	
	//draw the new word into the player zone...
	//the final parameter of this function call determines if animation is required (which we always have)
	snDraw.Game.Words.drawSingleCapturedWord(snatching_player,snatching_player.words.length - 1, true);
	snDraw.Game.Spell.repositionSkeletal();




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
