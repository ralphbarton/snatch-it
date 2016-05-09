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
		snDraw.Game.Words.WordAsTileGroupAtOrigin(i, j, true, Spacings);
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
	snDraw.Game.Zones.Unclaimed.playerslist = [];
	snDraw.Game.Zones.Unclaimed.exists = false;
	for (var i=0; i<players.length; i++){
	    if((i!=client_player_index) && (players[i].words.length>0)){
		if(players[i].is_disconnected == false){
		    snDraw.Game.Zones.PlayerZone.push({
			player: players[i],
			is_client: false
		    });
		}else{//code within here creates the container for the unclaimed zone
		    snDraw.Game.Zones.Unclaimed.exists = true;
		    snDraw.Game.Zones.Unclaimed.playerslist.push(players[i]);
		}
	    }
	}

	// 6. Get the positions and arrangements of everything...
	var Positions = snDraw.Game.Zones.calculateAllPositionsArrangements();

	// 7. Drawing the zones on the canvas, and moving the words into them...

	// 7.1 if an "unclaimed words zone" exists, then make this first.
	if(snDraw.Game.Zones.Unclaimed.exists){

	    var Top = Positions.Unclaimed_D.Top;
	    var Height = Positions.Unclaimed_D.Height;
	    var ZoneProperties = snDraw.Game.Zones.getZoneProperties("unclaimed");
	    var WordGroup = snDraw.Game.Words.getUnclaimedWordsList("via Grp");
	    var Arrangement_noH = Positions.Unclaimed_D.Arrangement_noH;

	    // 7.2.1 Make the unclaimed zone box itself
	    var FAB = snDraw.Game.Zones.CreateNewZoneBoxOnCanvas(Top, Height, ZoneProperties);
	    snDraw.Game.Zones.Unclaimed.Zone_FabObjs = FAB;

	    // 7.2.2 Put unclaimed words into arrangement
	    snDraw.Game.Words.MoveWordsIntoArrangement(Top, ZoneProperties.WordBounds, WordGroup, Arrangement_noH);
	}
	

	// 7.2 Now make all of the player zones.
	for (var i = 0; i < snDraw.Game.Zones.PlayerZone.length; i++){

	    var player_index = snDraw.Game.Zones.PlayerZone[i].player.index;

	    var Top = Positions.ZoneSizes[i].Top;
	    var Height = Positions.ZoneSizes[i].Height;
	    var ZoneProperties = snDraw.Game.Zones.getZoneProperties(i);
	    var WordGroup = snDraw.Game.Words.TileGroupsArray[player_index];
	    var Arrangement_noH = Positions.ArrangementsArray_noH[i];

	    // 7.2.1 Make the unclaimed zone box itself
	    var FAB = snDraw.Game.Zones.CreateNewZoneBoxOnCanvas(Top, Height, ZoneProperties);
	    snDraw.Game.Words.MoveWordsIntoArrangement(Top, WordBounds, WordGroup, WordArrangement_noH);

	    // 7.2.2 Put unclaimed words into arrangement
	    snDraw.Game.Words.MoveWordsIntoArrangement(Top, ZoneProperties.WordBounds, WordGroup, Arrangement_noH);
	}
    },
    
    TileTurn: function(player_index, tile_index, letter){

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
	    snDraw.Game.Zones.AnimateResizeAllZones(snDraw.ani.sty_Resize, null, null);
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

	// 1.1 Toast to clarify what just got snatched (todo: this needs to be words).
	snDraw.Game.Toast.showToast(snatching_player.name + " has snatched a word, tile indices are:", tile_indices);

	// 2. Firstly, on the canvas, detach all the letters involved in the new word
	// also update underlying data to reflect the state update (i.e. updates "tileset" and "players[i].words")

	// 2.05. before mutating the data, this is the time to determine it it is "snatcher first word"
	var client_is_snatcher = client_player_index == snatching_player.index;
	var snatcher_first_word = snatching_player.words.length == 0;

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
	for (var i = 0; i < players.length; i++){
	    snDraw.Game.Words.TileGroupsArray[i].clean(undefined);
	    players[i].words.clean(undefined);
	}

	// 2.3 update tileset for letters now In Words, and detach any letters in grid (i.e. the Fabric Objects)
	for(var i = 0; i < tile_indices.length; i++){
	    var TID = tile_indices[i];
	    tileset[TID].status = 'inword';
	}
	//note that there is handling in-place for when a tile index in the array we supply here is not actually in the grid.
	//note also that this function will rearrange the tiles that remain in the grid, for efficient packing following the
	//removal. This includes animation.
	snDraw.Game.Grid.DetachLetterSetFromGrid(tile_indices, snDraw.ani.sty_Resize);

	// 2.2 update the players data structure:
	snatching_player.words.push(tile_indices);

	// 3. Zone Handling upon Snatch

	var new_zone = (!client_is_snatcher) && (snatcher_first_word);

	// 3.1 Create a new zone container, and additionally create the new zone on the canvas.
	if(new_zone){
	    snDraw.Game.Zones.PlayerZone.push({
		player: snatching_player,
		is_client: false
	    });
	    var new_zone_index = snDraw.Game.Zones.PlayerZone.length-1; 
	    
	    //put the new zone on the canvas (but with dummy dimentioning...)
	    var NewZoneProperties = snDraw.Game.Zones.getZoneProperties(new_zone_index);
	    var FAB = snDraw.Game.Zones.CreateNewZoneBoxOnCanvas(0, 0, NewZoneProperties);//provide null data for Top, Height
	    snDraw.Game.Zones.PlayerZone[new_zone_index].Zone_FabObjs = FAB;

	}

	// 3.2 Delete zones if required
	for(var i = 0; i < snDraw.Game.Zones.PlayerZone.length; i++){
	    var zone_i = snDraw.Game.Zones.PlayerZone[i];
	    
	    //proceed to remove zone_i if (A) there are no words in the zone and (B) it's a non-client player
	    if((zone_i.player.words.length == 0)&&(!zone_i.is_client)){
		var empty_zone = snDraw.Game.Zones.PlayerZone.splice(i,1)[0];

		//animate OUT the zone which is for removal
		snDraw.Game.Zones.InOutAnimateZoneBox(empty_zone, snDraw.ani.sty_Boot, "exit", "bottom");

		i--;//because we spliced, counteract the increment of i.
	    }
	}

	// 3.25 Delete the Unclaimed Zone if required
	var UnclaimedWordGroup = snDraw.Game.Words.getUnclaimedWordsList("via TID");
	if((snDraw.Game.Zones.Unclaimed.exists)&&(UnclaimedWordGroup.length == 0)){
	    snDraw.Game.Zones.InOutAnimateZoneBox(snDraw.Game.Zones.Unclaimed, snDraw.ani.sty_Resize, "exit", "right");
	    snDraw.Game.Zones.Unclaimed.exists = false;
	}

	// 3.3 shift everything
	// in terms of the exclusion parameters, two things to think about:
	// (A) sometimes a new zone is created (never more than x1, and we don't want to animate its elements but do want to
	// calculate its arrangement

	// (B) always, a new word is added. We do want to include it in arrangement calculations, but don't want to attempt to
	// move it into a position...
	// no additional code needed to achieve (B) since, words are picked up by accessing
	// Arrangements = {coords: [], word_width_px: [], breaks: []};

	/* PLEASE NOTE THAT THE FUNCTION BELOW DOES THE HUGE BULK OF THE WORK HERE */
	var Positions = snDraw.Game.Zones.AnimateResizeAllZones(snDraw.ani.sty_Resize, new_zone_index);

	//animate the new zone coming in (this has to happen after the resize all, which determines correct size...)
	if(new_zone){
	    var NewZone = snDraw.Game.Zones.PlayerZone[new_zone_index];
	    snDraw.Game.Zones.InOutAnimateZoneBox(NewZone, snDraw.ani.sty_Join, "entry", "left");
	}

	//Gahh. We need to determine the zone of the snatching player
	for(var i = 0; i < snDraw.Game.Zones.PlayerZone.length; i++){
	    if(snDraw.Game.Zones.PlayerZone[i].player.index == snatching_player.index){
		var snatching_player_zone_index = i;
	    }
	}

	var sp_Arrangement_noH = Positions.ArrangementsArray_noH[snatching_player_zone_index];
	var sp_Top = Positions.ZoneSizes[snatching_player_zone_index].Top;
	var PlayerZoneProperties = snDraw.Game.Zones.getZoneProperties("player");

	var Arrangement = snDraw.Game.Words.WordArrangementSetHeight(sp_Arrangement_noH, PlayerZoneProperties.WordBounds, sp_Top);

	//finally, animate the snatching of the snatched word...
	var word_index = snatching_player.words.length - 1;
	snDraw.Game.Words.AnimateWordCapture(snatching_player.index,
					     word_index,
					     Arrangement.coords[word_index]
					    );
    },

    Disconnection: function(player_index){

	console.log("Player disconnetion message recieved, with player_index="+player_index);
	var dis_plr = players[player_index];
	dis_plr.is_disconnected = true;

	snDraw.Game.Toast.showToast(dis_plr.name + " disconnected");

	// An "Unclaimed Zone" will exist by the end of this function call, but does it exist at the beginning?
	var unclaimed_zone_isNew = !snDraw.Game.Zones.Unclaimed.exists;
	snDraw.Game.Zones.Unclaimed.exists = true;
	snDraw.Game.Zones.Unclaimed.playerslist.push(players[i]);
	


	// Now that its existance is asserted via the zone containers, we can calculate all positions...

	//at this point, physically create the zone on Canvas if necessary
	if(unclaimed_zone_isNew){


	    snDraw.Game.Zones.Unclaimed.exists = true;
	    var FAB = generateZoneAndMoveWordsOnCanvas(0,// dummy 'Top'
						       0,// dummy 'Height'
						       snDraw.Game.Zones.getZoneProperties("unclaimed"),
						       snDraw.Game.Words.getUnclaimedWordsList("via Grp"),
						       undefined //this will surely fail: Dummy Arrangement_noH
						      );

	    //store a reference to the fabric ojects that make the zone box on the canvas
	    snDraw.Game.Zones.Unclaimed.Zone_FabObjs = FAB;
	}



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
