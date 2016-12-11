snCore.Event = {

    //this function is called upon entry into the game and anything that requires redraw of all (such as window resize)
    DrawAll: function(){

	// 1. Set Background
	canvas.setBackgroundColor('black');
	canvas.clear();	    

	// 1.1 Calculate all the dimentions used in rendering, based upon window dimentions...
	var N_pixels = snCore.Basic.canv_W * snCore.Basic.canv_H;

	// here we access the number of tiles & turned tiles, which is only set after game state is loaded...
	var Tile_pixels = N_pixels * snCore.Tile.Ratio_tile / tilestats.n_tiles;
	var raw_TS = Math.round(Math.sqrt(Tile_pixels)); //excludes the effect of the border, centered on the tile edge

	var tile_stroke_prop = 0.06;
	var tot_TS = raw_TS * (1+tile_stroke_prop); //overall total Tile size, includes effect of the border

	snCore.Tile.stdDimention = Math.round(Math.sqrt(N_pixels * 0.0037));

	snCore.Tile.dims = { //all in pixels
	    tsi: raw_TS, // supposed to refer to 'internal' tile size (before all sides widened by half a thickness unit)
	    ts_thick: raw_TS * tile_stroke_prop,
	    ts: tot_TS, //tile size, including border
	    ts_rad: (tot_TS * 0.12), // radius on the corners of tiles
	    ts_font1: (tot_TS * 0.9), // main font size
	    ts_font2: (tot_TS * 0.29), // tiny font size
	    lg: (tot_TS * 0.01), //letter gap (gap only) - "letter gap" refers to the gaps between letters within words. 
	    tslg: (tot_TS * 1.00), //tile size added to letter gap
	    tsgg: (tot_TS * 1.09), //tile size added to grid gap
	    wg: (tot_TS * 0.6), // word gap (gap only)
	    tsvg: (tot_TS * 1.15), //vertical gap between different rows of words, plus actual tile size
	    grpad: (tot_TS * 0.20), // minimum horizonal padding of the left and the right of the grid of letters
	    ingh: (tot_TS * 0.20), // inside a zone box, this is the horizonal padding between the inner wall and a letter
	    ingt: (tot_TS * 0.20) // inside a zone box, this is the vertical padding between the upper wall and a letter
	};

	var Spacings = snCore.Tile.dims;
	snCore.Zones.CalculateAllZoneStyleScalings();
	snCore.Popup.calcModalScale();//if scores were present on resize, this changes some scale params

	// 2. Add the controls strip
	snCore.Controls.createControls();

	// 3. Create all the grid tiles...
	snCore.Grid.InitialiseGrid(Spacings);
	for (var i = 0; i < tileset.length; i++){
	    if(tileset[i].status == "turned"){
		//generate tile & put in grid
		var TileObject_i = snCore.Tile.generateTileObject(tileset[i], i);
		var gridRC = snCore.Grid.GetGridSpace();
		snCore.Grid.PlaceTileInGrid(i, gridRC, false, null);//todo rename this...
	    }
	}

	// 4. Create all the word objects
	// (for all players indiscriminately, as this will generate those for the unclaimed zone also)
	// this declares no data locally, but 'snCore.Words.TileGroupsArray' is modified.
	for (var i = 0; i < players.length; i++){
	    snCore.Words.TileGroupsArray[i] = [];
	    for (var j = 0; j < players[i].words.length; j++){
		snCore.Words.WordAsTileGroupAtOrigin(i, j, true, Spacings);
	    }
	}

	// 5. Create the zones containers (this is NOT visually creating the zones)
	snCore.Zones.PlayerZone = [];

	// 5.1 Unconditionally add client's zone
	snCore.Zones.PlayerZone[0] = {
	    player: players[client_player_index],
	    is_client: true
	};

	// 5.2 Add all players who who (A) have words, (B) aren't client and (C) aren't disconnected.
	snCore.Zones.Unclaimed.playerslist = [];
	snCore.Zones.Unclaimed.exists = false;
	for (var i=0; i<players.length; i++){
	    if((i!=client_player_index) && (players[i].words.length>0)){
		if(players[i].is_disconnected == false){
		    snCore.Zones.PlayerZone.push({
			player: players[i],
			is_client: false
		    });
		}else{//code within here creates the container for the unclaimed zone
		    snCore.Zones.Unclaimed.exists = true;
		    snCore.Zones.Unclaimed.playerslist.push(players[i]);
		}
	    }
	}

	// 6. Get the positions and arrangements of everything...
	var Positions = snCore.Zones.calculateAllPositionsArrangements();

	// 7. Drawing the zones on the canvas, and moving the words into them...

	// 7.1 if an "unclaimed words zone" exists, then make this first.
	if(snCore.Zones.Unclaimed.exists){

	    var Top = Positions.Unclaimed_D.Top;
	    var Height = Positions.Unclaimed_D.Height;
	    var ZoneProperties = snCore.Zones.getZoneProperties("unclaimed");
	    var WordGroup = snCore.Words.getUnclaimedWordsList("via Grp");
	    var Arrangement_noH = Positions.Unclaimed_D.Arrangement_noH;

	    // 7.2.1 Make the unclaimed zone box itself
	    var FAB = snCore.Zones.CreateNewZoneBoxOnCanvas(Top, Height, ZoneProperties);
	    snCore.Zones.Unclaimed.Zone_FabObjs = FAB;

	    // 7.2.2 Put unclaimed words into arrangement (no animation)
	    snCore.Words.MoveWordsIntoArrangement(Top, ZoneProperties.WordBounds, WordGroup, Arrangement_noH, null);
	}
	

	// 7.2 Now make all of the player zones.
	for (var i = 0; i < snCore.Zones.PlayerZone.length; i++){

	    var player_index = snCore.Zones.PlayerZone[i].player.index;

	    var Top = Positions.ZoneSizes[i].Top;
	    var Height = Positions.ZoneSizes[i].Height;
	    var ZoneProperties = snCore.Zones.getZoneProperties(i);
	    var WordGroup = snCore.Words.TileGroupsArray[player_index];
	    var Arrangement_noH = Positions.ArrangementsArray_noH[i];

	    // 7.2.1 Make the unclaimed zone box itself
	    var FAB = snCore.Zones.CreateNewZoneBoxOnCanvas(Top, Height, ZoneProperties);
	    snCore.Zones.PlayerZone[i].Zone_FabObjs = FAB;

	    // 7.2.2 Put unclaimed words into arrangement (no animation)
	    snCore.Words.MoveWordsIntoArrangement(Top, ZoneProperties.WordBounds, WordGroup, Arrangement_noH, null);
	}

	//  apply 'ended' style if necessary.
	if(this.game_ended == true){
	    snCore.Event.EndGame();
	}

	// draw some such frames
	snCore.Basic.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
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
	snCore.Controls.updateTurnLetter_number(n_tiles_remaining);

	// 1.2 maybe modify tile size...
	var tile_size_change = snCore.Tile.setTileRatSizeFromNTiles(tilestats.n_turned);
	if (tile_size_change){	
	    setTimeout(function(){
		canvas.clear();
		snCore.Event.DrawAll();
		snCore.Toast.showToast("Scale changed to fit tiles...");
		snCore.Toast.ToastsJumpDown(true);//true means reposition ALL existing toasts...
	    }, 2000); //2 seconds after turn, apply the resize. This avoids interference with animate in tile...
	}

	// 2. Create the new tile on the screen, and animate its entry...

	// 2.1 record the old bottom of the grid. Later, we will test if adding the new tile has expanded the 
	var old_grid_bottom_px = snCore.Grid.GetGridBottomPx();

	// 2.2 Put new tile and obsurer into location outside the canvas (plot only no animation)
	var newTile = snCore.Tile.generateTileObject(tileset[tile_index], tile_index);
	snCore.Tile.briefPaleTileObject(newTile);
	newTile.visual = "animating_in";
	var RandCx = snCore.Tile.GenRandomCoords_TileEntryOrigin();
	snCore.Basic.moveSwitchable(newTile, false, null, RandCx);
	var obs_col = player_index != null ? players[player_index].color : 'black';
	var newTileObscurer = snCore.Tile.createObscurer(RandCx.left, RandCx.top, tile_index, obs_col);

	// 2.3 Now set up the animation of the tile, and the chain of animations for the obscurer
	var gridRC = snCore.Grid.GetGridSpace();
	var gridPx = snCore.Grid.RCgridPx(gridRC);

	snCore.Grid.PlaceTileInGrid(tile_index, gridRC, true, snCore.Basic.ani.sty_Sing);

	var onComplete_disperseThisObscurer = function(){
	    var hts = snCore.Tile.dims.ts / 2;

	    //update object stored coordinates to the final animation position
	    newTileObscurer.grpCoords = {x:gridPx.left, y:gridPx.top};
	    newTileObscurer.centerCoords = {x: gridPx.left + hts, y: gridPx.top + hts};
	    snCore.Tile.disperseObscurer(newTileObscurer);

	    //the start of dispersing the obscurer is also treated as when the tile really exists (before it is not visible)
	    newTile.visual = "flipped";

	    //This is a little expensive, but any new tile has the potential to change letter availability
	    if(snCore.Spell.SkeletalLetters.length>0){ // irrelivant if the speller is empty
		snCore.Spell.recolourAll(snCore.Spell.ListAllVisibleTilesOf(newTile.letter));
		snCore.Spell.indicateN_validMoves_onButton();//also re-indicate how to make
	    }
	};
	snCore.Basic.moveSwitchable(newTileObscurer, onComplete_disperseThisObscurer, snCore.Basic.ani.sty_Sing, gridPx);


	// 3. Determine if zones need to be squeezed downwards because the tile grid has grown vertically...
	if(snCore.Grid.GetGridBottomPx() != old_grid_bottom_px){
	    snCore.Zones.AnimateResizeAllZones(snCore.Basic.ani.sty_Resize, null);

	    // 3.1 in the special case where this is an Auto flip which has cause squeezing...
	    // as a crude fix to any interrupted-animation glitches, redraw the whole canvas in 1.5 seconds time
	    // $('#uOpt_flippy').prop('checked') - "null player index" can anyway only happen when "Flippy rule" is active.
	    if(player_index == null){
		this.resizeTimeoutID = setTimeout(function(){
		    snCore.Event.DrawAll();
		}, 1500);
	    }


	}

	// 4. Modify the "Turn Letter" button, based upon who turned the tile (start timer or cancel timer)
	if(player_index == client_player_index){ // the player that flipped was the client...
	    snCore.Controls.startTurnDisableTimeout();
	}else{
	    //the simple effect of this is that any non-client player flip resets the timer to re-allow client flip.
	    snCore.Controls.cancelTurnDisabled = true;
	}

    },

    SnatchEvent: function(player_index, tile_indices, words_used_list){

	// 1. Clear the Spell if it is the Client Snatching. Set some variables used in this script.
	snCore.DefineWord.KPicker_cycler('clear');
	var snatching_player = players[player_index];
	var client_is_snatcher = client_player_index == player_index;
	if(client_is_snatcher){snCore.Spell.CancelWord();}
	var client_is_snatcher = client_player_index == snatching_player.index;
	var snatcher_first_word = snatching_player.words.length == 0;

	// 2. Tile Detachment (from existing words & fresh). Tile & Words data structure update (incl. "tileset", "players[i].words")

	var words_used_list_as_strings = []; // This is for generating the string-text of the toast explaining the SNATCH
	snCore.Toast.ToastTop_consumed_words = 0;// this is to initiate 'top' coord for consumed words of client player...

	// 2.1 Detach all tile objects from the words they're in
	for (var i = 0; i < words_used_list.length; i++){
	    var PIi = words_used_list[i].PI;
	    var WIi = words_used_list[i].WI;

	    //modify the players data structure:
	    var removed_word_tileIDs = players[PIi].words[WIi];

	    // Take this opportunity of running through consumed words to generate them as a list of strings...
	    words_used_list_as_strings.push(snCore.Tile.TileIDArray_to_LettersString(removed_word_tileIDs));
	    delete players[PIi].words[WIi];//just delete the array element now, purge the array of empy elements later

	    //determine the group coordinates...
	    var StolenGRP = snCore.Words.TileGroupsArray[PIi][WIi];	    
	    var Stolen_x_base = StolenGRP.getLeft(); 
	    var Stolen_y_base = StolenGRP.getTop(); 

	    // Take this opportunity of running through consumed word Groups to retain coordinates.
	    // Part of the Toast Height Calc algorithm (Part A)
	    if(PIi == client_player_index){
	       snCore.Toast.ToastTop_consumed_words = Math.max(snCore.Toast.ToastTop_consumed_words, Stolen_y_base);  
	    }

	    //remove tiles from Group, and place in position as individual tiles:
	    for (var j=0; j<removed_word_tileIDs.length; j++){
		var StolenTile = snCore.Tile.TileArray[removed_word_tileIDs[j]];
		snCore.Words.TileGroupsArray[PIi][WIi].remove(StolenTile);		
		//place individual tiles back on the canvas in location
		StolenTile.set({
		    left: Stolen_x_base + snCore.Tile.dims.tslg * j,
		    top: Stolen_y_base
		});
		canvas.add(StolenTile);
	    }
	    
	    //remove the now empty group itself
	    canvas.remove(StolenGRP);
	    delete snCore.Words.TileGroupsArray[PIi][WIi];
	}

	// Remove the all references to Fabric Groups which are now empty of letter tiles, and words removed from raw data
	for (var i = 0; i < players.length; i++){
	    snCore.Words.TileGroupsArray[i].clean(undefined);
	    players[i].words.clean(undefined);
	}

	// 2.2 update tileset for to reflect that all of these tiles are in a word.
	// trigger Animated pale effect
	for(var i = 0; i < tile_indices.length; i++){
	    var TID = tile_indices[i];
	    tileset[TID].status = 'inword';
	    snCore.Tile.briefPaleTileObject(snCore.Tile.TileArray[TID]);
	}

	// 2.3 Detach tiles from grid and animate compacting of the remainder
	// note, function CAN cope when 'tile_indices' includes tiles not in grid.
	// Animated rearrange (packing eff.) will follow removal
	snCore.Grid.DetachLetterSetFromGrid(tile_indices, snCore.Basic.ani.sty_Resize);

	// 2.4 update the players data structure:
	snatching_player.words.push(tile_indices);



	// 3. Zone Handling upon Snatch = add/remove zones, unclaimed zone handling, and the animated reshuffle.
	var new_zone = (!client_is_snatcher) && (snatcher_first_word);

	// 3.1 Create a new zone container, and additionally create the new zone on the canvas.
	if(new_zone){
	    snCore.Zones.PlayerZone.push({
		player: snatching_player,
		is_client: false
	    });
	    var new_zone_index = snCore.Zones.PlayerZone.length-1; 
	    
	    //put the new zone on the canvas (but with dummy dimentioning...)
	    var NewZoneProperties = snCore.Zones.getZoneProperties(new_zone_index);
	    var FAB = snCore.Zones.CreateNewZoneBoxOnCanvas(0, 0, NewZoneProperties);//provide null data for Top, Height
	    snCore.Zones.PlayerZone[new_zone_index].Zone_FabObjs = FAB;
	}

	// 3.2 Delete zones if required
	for(var i = 0; i < snCore.Zones.PlayerZone.length; i++){
	    var zone_i = snCore.Zones.PlayerZone[i];
	    
	    //proceed to remove zone_i if (A) there are no words in the zone and (B) it's a non-client player
	    if((zone_i.player.words.length == 0)&&(!zone_i.is_client)){
		var empty_zone = snCore.Zones.PlayerZone.splice(i,1)[0];
		//animate OUT the zone which is for removal
		snCore.Zones.InOutAnimateZoneBox(empty_zone, snCore.Basic.ani.sty_Boot, "exit", "bottom");
		i--;//because we spliced, counteract the increment of i.
	    }
	}

	// 3.3 Delete the Unclaimed Zone if required
	var UnclaimedWordGroup = snCore.Words.getUnclaimedWordsList("via TID");
	if((snCore.Zones.Unclaimed.exists)&&(UnclaimedWordGroup.length == 0)){
	    snCore.Zones.InOutAnimateZoneBox(snCore.Zones.Unclaimed, snCore.Basic.ani.sty_Resize, "exit", "right");
	    snCore.Zones.Unclaimed.exists = false;
	}

	// 3.4 Animate the zones into their squeezed positions + animate in the new zone.

	// in terms of the exclusion parameters, two things to think about:
	// (A) sometimes a new zone is created (never more than x1, and we don't want to animate its elements but do want to
	// calculate its arrangement

	// (B) always, a new word is added. We do want to include it in arrangement calculations, but don't want to attempt to
	// move it into a position...
	// no additional code needed to achieve (B) since, words are picked up by accessing
	// Arrangements = {coords: [], word_width_px: [], breaks: []};

	/* PLEASE NOTE THAT THE FUNCTION BELOW DOES THE HUGE BULK OF THE WORK HERE */
	var Positions = snCore.Zones.AnimateResizeAllZones(snCore.Basic.ani.sty_Resize, new_zone_index);

	//animate the new zone coming in (this has to happen after the resize all, which determines correct size...)
	if(new_zone){
	    var NewZone = snCore.Zones.PlayerZone[new_zone_index];
	    snCore.Zones.InOutAnimateZoneBox(NewZone, snCore.Basic.ani.sty_Resize, "entry", "left");// strictly, animate to "snCore.Basic.ani.sty_Join"
	}

	// 3.5 'wave effect' animation of taking the tiles that make up the snatch.

	// This is all to extract the word arrangement of the snatching player
	var snatching_player_zone_index = snCore.Zones.getZoneIndexOfPlayer(snatching_player.index);
	var sp_Arrangement_noH = Positions.ArrangementsArray_noH[snatching_player_zone_index];
	var sp_Top = Positions.ZoneSizes[snatching_player_zone_index].Top;
	var PlayerZoneProperties = snCore.Zones.getZoneProperties("player");
	var sp_Arrangement = snCore.Words.WordArrangementSetHeight(sp_Arrangement_noH, PlayerZoneProperties.WordBounds, sp_Top);
	//finally, animate the snatching of the snatched word...
	var word_index = snatching_player.words.length - 1;
	snCore.Words.AnimateWordCapture(snatching_player.index,
					     word_index,
					     sp_Arrangement.coords[word_index]
					    );


	// 4. Relating to Toasts

	// 4.1 in the case where the client has snatched, use the final coordinates of all their words to dictate toast position
	// (query: would it be better to do this wor all cases, i.e. client not involved in snatch??? TODO: check answer.)
	var snWo_top = 0;
	if(client_is_snatcher){
	    for(var i = 0; i < sp_Arrangement.coords.length; i++){
		snWo_top = Math.max(snWo_top, sp_Arrangement.coords[i].top);
	    }
	}
	snCore.Toast.ToastTop_snatched_word = snWo_top;

	// 4.2 A toast to descibe the snatch in English
	// (add player's names??)
	var snatched_word_str = snCore.Tile.TileIDArray_to_LettersString(tile_indices);
	if(words_used_list_as_strings.length == 0){
	    var ss_ee = ".";
	}else if(words_used_list_as_strings.length == 1){
	    var ss_ee = " taking the word " + words_used_list_as_strings[0];
	}else if(words_used_list_as_strings.length > 1){
	    var ss_ee = " by combining words ";
	    var n_words = words_used_list_as_strings.length;
	    for(var i = 0; i < n_words; i++){
		ss_ee += words_used_list_as_strings;
		if(i < (n_words-1)){
		    ss_ee += ", ";
		}else{
		    ss_ee += ".";
		}
	    }
	}
	snCore.Toast.showToast(snatching_player.name + " has snatched the word " + snatched_word_str + ss_ee);
    },


    Disconnection: function(player_index){
	var dis_plr = players[player_index];
	dis_plr.is_disconnected = true;

	// An "Unclaimed Zone" may exist by the end of this function call, but does it exist at the beginning?

	if(dis_plr.words.length > 0){// non-zero words of Disconnecting player is the condition for removing their zone

	    var dis_plr_zone_index = snCore.Zones.getZoneIndexOfPlayer(player_index);

	    //remove both the zone container and the Fabric objects.... Note how this is done before Positions calc...
	    var dis_zone = snCore.Zones.PlayerZone.splice(dis_plr_zone_index,1)[0];
	    snCore.Zones.InOutAnimateZoneBox(dis_zone, snCore.Basic.ani.sty_Boot, "exit", "bottom");

	    var b_new_unclaimed_zone = !snCore.Zones.Unclaimed.exists;
	    snCore.Zones.Unclaimed.exists = true;
	    snCore.Zones.Unclaimed.playerslist.push(dis_plr);
	    
	    // Now that its existance is asserted via the zone containers, we can calculate all positions...
	    // Get the positions and arrangements of everything...

	    /* PLEASE NOTE THAT THE FUNCTION BELOW DOES THE HUGE BULK OF THE WORK HERE */
	    var unclaimed_excl_param = b_new_unclaimed_zone ? "unclaimed" : null;
	    var Positions = snCore.Zones.AnimateResizeAllZones(snCore.Basic.ani.sty_Resize, unclaimed_excl_param);

	    //at this point, physically create the zone on Canvas if necessary
	    if(b_new_unclaimed_zone){

		// Unfortunately, the code below is copied and pasted...
		var Top = Positions.Unclaimed_D.Top;
		var Height = Positions.Unclaimed_D.Height;
		var ZoneProperties = snCore.Zones.getZoneProperties("unclaimed");
		var WordGroup = snCore.Words.getUnclaimedWordsList("via Grp");
		var Arrangement_noH = Positions.Unclaimed_D.Arrangement_noH;

		// Make the unclaimed zone box itself
		var FAB = snCore.Zones.CreateNewZoneBoxOnCanvas(Top, Height, ZoneProperties);
		snCore.Zones.Unclaimed.Zone_FabObjs = FAB;

		// Put unclaimed words into arrangement (use the 'Resize' animation stlye)
		var wb = ZoneProperties.WordBounds;
		snCore.Words.MoveWordsIntoArrangement(Top, wb, WordGroup, Arrangement_noH, snCore.Basic.ani.sty_Resize);

		// Animate in the NEW unclaimed box:
		snCore.Zones.InOutAnimateZoneBox(snCore.Zones.Unclaimed, snCore.Basic.ani.sty_Resize, "entry", "right");
	    }
	}

	// Finally, show the Toast. By doing this last, it means that the Toast fits with Final Zone sizing.
	snCore.Toast.showToast(dis_plr.name + " left");

    },
    
    // note that this event is not triggered when 'connecting' the client themself, it is always someone else.
    Connection: function(player_join_details){

	var rejoining_player_index = player_join_details.rejoin_PID;
	if (rejoining_player_index !== undefined){
	    // a player is rejoining...
	    var rej_plr = players[rejoining_player_index];
	    rej_plr.is_disconnected = false;
	    
	    if(rej_plr.words.length > 0){// non-zero words of Reconnecting player. Means a new player zone (A).
		//may mean remove the unclaimed zone (B).

		//////UNFORTUNATELY, MUCH OF the code below (i.e. next 25 lines or so) is copied from Section 3. of the snatch event //

		//Create a new zone container
		snCore.Zones.PlayerZone.push({
		    player: rej_plr,
		    is_client: false
		});

		// create the new zone on the canvas
		var new_zone_index = snCore.Zones.PlayerZone.length-1; 
		var NewZoneProperties = snCore.Zones.getZoneProperties(new_zone_index);
		var FAB = snCore.Zones.CreateNewZoneBoxOnCanvas(0, 0, NewZoneProperties);//null data for Top, Height
		snCore.Zones.PlayerZone[new_zone_index].Zone_FabObjs = FAB;

		//remove the rejoined player from the list associated with the unclaimed zone...
		var UL = snCore.Zones.Unclaimed.playerslist;
		for(var i = 0; i < UL.length; i++){
		    if(UL[i].index == rejoining_player_index){
			UL.splice(i,1);//remove from list and discard this ref.
		    }
		}

		// potentially delete Unclaimed Zone
		var UnclaimedWordGroup = snCore.Words.getUnclaimedWordsList("via TID");
		if((snCore.Zones.Unclaimed.exists)&&(UnclaimedWordGroup.length == 0)){
		    snCore.Zones.InOutAnimateZoneBox(snCore.Zones.Unclaimed, snCore.Basic.ani.sty_Resize, "exit", "right");
		    snCore.Zones.Unclaimed.exists = false;
		}

		// squeeze & resize those zones...
		var Positions = snCore.Zones.AnimateResizeAllZones(snCore.Basic.ani.sty_Resize, new_zone_index);

		// animate rejoining player's zone gliding in. (This has to happen after the resize all, which determines correct size.)
		var NewZone = snCore.Zones.PlayerZone[new_zone_index];
		snCore.Zones.InOutAnimateZoneBox(NewZone, snCore.Basic.ani.sty_Join, "entry", "left");

		// Also, animate all the reclaimed WORDS into the newly restored player box...
		// Unfortunately, the code below is copied and pasted... TWICE!
		var Top = Positions.ZoneSizes[new_zone_index].Top;
		var Height = Positions.ZoneSizes[new_zone_index].Height;
		var ZoneProperties = snCore.Zones.getZoneProperties(new_zone_index);
		var WordGroup = snCore.Words.TileGroupsArray[rejoining_player_index];
		var Arrangement_noH = Positions.ArrangementsArray_noH[new_zone_index];
		var wb = ZoneProperties.WordBounds;
		snCore.Words.MoveWordsIntoArrangement(Top, wb, WordGroup, Arrangement_noH, snCore.Basic.ani.sty_Resize);

		snCore.Toast.showToast(rej_plr.name + " rejoined, reclaiming "+rej_plr.words.length+" words");
	    }else{
		snCore.Toast.showToast(rej_plr.name + " rejoined on " + player_join_details.device_type);
	    }

	}else{
	    // a new player is joining...
	    var player_object = player_join_details.player_object;
	    player_object.index = players.length;//take the length prior to pushing incorporates -1

	    //DO NOT FORGET, upon addition of a new player, to modify their data structure accordingly.
	    snCore.Words.TileGroupsArray[player_object.index]=[];//correctly create empty container
	    players.push(player_object);

	    //Add colour or something??
	    snCore.Toast.showToast(player_object.name + " joined on " + player_join_details.device_type);
	}
    },

    resizeTimeoutID: undefined,
    WindowResize: function(){

	if(this.resizeTimeoutID != undefined){
	    clearTimeout(this.resizeTimeoutID);
	    this.resizeTimeoutID = undefined;
	}
	
	this.resizeTimeoutID = setTimeout(function(){
	    snCore.DefineWord.KPicker_cycler('clear');
	    snCore.Basic.makeCanvasFitWholeWindow();
	    snCore.Event.DrawAll();
	}, 200); //inject 0.2 second delay ("size stablisation time") before redrawing all...
    },


    FirstGameRender: function(){

	//mouse event listeners
	canvas.on('mouse:down', function(e){snCore.Mouse.mDown(e); });
	canvas.on('mouse:up',   function(e){snCore.Mouse.mUp(e);   });
	canvas.on('mouse:over', function(e){snCore.Mouse.mOver(e); });
	canvas.on('mouse:out',  function(e){snCore.Mouse.mOut(e);  });

	//keyboard event listeners
	document.addEventListener("keydown",function(e){snCore.Keyboard.kDown(e); }, false);

	
	window.onresize = this.WindowResize; /*function(){
	    snCore.Event.WindowResize();
	};*/
    },

    game_ended: false,
    EndGame: function(){
	var completion_moment = (this.game_ended == false);
	this.game_ended = true;
	snCore.Controls.updateTurnLetter_number("Play Again");

	//change all tiles appearance
	for(var i = 0; i < snCore.Tile.TileArray.length; i++){
	    snCore.Tile.modifyTileObject(snCore.Tile.TileArray[i],"invert");
	}

	//make all words non-draggable (for what this is worth)
	for(var i = 0; i < snCore.Words.TileGroupsArray.length; i++){
	    for(var j = 0; j < snCore.Words.TileGroupsArray[i].length; j++){
		snCore.Words.TileGroupsArray[i][j].set({
		    hasControls: false,
		    hasBorders: false,
		    lockMovementX: true,
		    lockMovementY: true,
		    selectable: false
		});
	    }
	}
	if(completion_moment){
	    // 1. Add new propery to all players, recording whether they were in the game at completion moment.
	    // this is bascially a copy of serverside code in function "PlayerFinishedGame"
	    for(var i=0; i < players.length; i++){
		if(players[i].was_connected_at_completion == undefined){
		    players[i].was_connected_at_completion = !players[i].is_disconnected;
		}
	    }

	    // 2. Automatically open the scores window
	    snCore.Popup.openModal("scores");
	}
    }

};
