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
	for (var i = 0; i < tilestats.n_turned; i++){
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

	// 4.2 Add all players who who (A) have words, (B) aren't our client and (C) aren't disconnected
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


	//5. Define a function here to generate a player's words as a list of Fabric objects
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

	//5.1 retrieve style information...
	var ZoneSty_P = snDraw.Game.Zones.Style1;
	var WordBounds_P = ZoneSty_P.WordBlockBounds;
	var ZoneSty_U = snDraw.Game.Zones.Style2;
	var WordBounds_U = ZoneSty_U.WordBlockBounds;
	var interzonePad = snDraw.Game.Zones.ZoneVerticalPaddings;


	//5.2 Generate the word objects for all of the inactive players, and determine the arrangement for the unclaimed zone
	if(snDraw.Game.Zones.Unclaimed.exists){
	    var UnclaimedWordGroups = [];
	    for (var i = 0; i < snDraw.Game.Zones.Unclaimed.playerslist.length; i++){
		var player_i = snDraw.Game.Zones.Unclaimed.playerslist[i];
		UnclaimedWordGroups = UnclaimedWordGroups.concat(generatePlayerWordObjs(player_i));
	    }
	    var UnclaimedArrangement = snDraw.Game.Words.GenWordArrangement(UnclaimedWordGroups, WordBounds_U, Spacings, "center");
	}

	//5.3 Generate all word objects and arrangements for the zones of active players
	var ArrangementsArray = [];
	var ZonesWordsGroups = [];

	for (var i = 0; i < snDraw.Game.Zones.PlayerZone.length; i++){
	    var player_i = snDraw.Game.Zones.PlayerZone[i].player;

	    var WordGrpsList_i = generatePlayerWordObjs(player_i);
	    ZonesWordsGroups.push(WordGrpsList_i);

	    var Arrangement_i = snDraw.Game.Words.GenWordArrangement(WordGrpsList_i, WordBounds_P, Spacings, "left");
	    ArrangementsArray.push(Arrangement_i);
	}


	// 6. Define a function which draws a zone filled with words on screen...
	function generateZoneOnCanvas(Top, Height, ZoneSty, Properties, WordGroup, WordArrangement_noH, WordBounds){
	    //generate the fabric objects that represent the new zone. Note that properties left & top are not set
	    //nor are the objects present onf the canvas.
	    var Zone_FabObjs = snDraw.Game.Zones.CreateZoneBox(Height, ZoneSty, Properties);
	    var Zone_Tops = snDraw.Game.Zones.DetermineZoneBoxObjectsTops(Top, Height, ZoneSty);
	    var Zone_Lefts = snDraw.Game.Zones.DetermineZoneBoxObjectsLefts(0, ZoneSty, Zone_FabObjs[1].width);

	    if(ZoneSty.justify == "center"){
		console.log(Top);
		console.log(Zone_Tops);
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
	}

	var upper_drawing_bound = snDraw.Game.Grid.GetGridBottomPx();

	// 6.1 if an "unclaimed words zone" exists, then make this first.
	if(snDraw.Game.Zones.Unclaimed.exists){

	    upper_drawing_bound += snDraw.Game.Zones.ZoneVerticalPaddings.aboveU;
	    var Top = upper_drawing_bound;
	    console.log(upper_drawing_bound);
	    var tile_stroke_prop = 0.06;
	    //note that top padding includes 
	    var Height_pads_tot = Spacings.ts * tile_stroke_prop + ZoneSty_U.thick*2 + ZoneSty_U.w_vpad*2;
	    var Height = snDraw.Game.Zones.WordsStackHeightPx(UnclaimedArrangement, Spacings) + Height_pads_tot;// + ZoneSty_U;

	    var Properties = {
		color: 'grey',
		text: 'unclaimed',
		isClient: false
	    };

	    generateZoneOnCanvas(Top, Height, ZoneSty_U, Properties, UnclaimedWordGroups, UnclaimedArrangement, WordBounds_U);

	    upper_drawing_bound += Height;
	}
	

	// 6.2 Now make all of the player zones. Calculate their heights and draw them...
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

	    generateZoneOnCanvas(Top, Height, ZoneSty_P, Properties, ZonesWordsGroups[i], ArrangementsArray[i], WordBounds_P);
	}

    },

    SnatchEvent: function(){

    },
    
    TileTurn: function(){

    },
    
    Disconnection: function(){
	return null;
    },
    
    Reconnection: function(){

    }

};
