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
	for (var i=0; i<players.length; i++){
	    if((i!=client_player_index) && (players[i].words.length>0)){
		if(players[i].is_disconnected == false){
		    snDraw.Game.Zones.PlayerZone.push({
			player: players[i],
			is_client: false
		    });
		}else{
		    snDraw.Game.Zones.Unclaimed.playerslist.push(players[i]);
		}
	    }
	}

	// 4.9 For uncalimed

	// 5. For all player zones: generate words and determine their arrangement
	var ZoneSty_P = snDraw.Game.Zones.Style1;
	var WordBounds_P = ZoneSty_P.WordBlockBounds;
	var ZoneSty_U = snDraw.Game.Zones.Style2;
	var WordBounds_U = ZoneSty_U.WordBlockBounds;
	var interzonePad = snDraw.Game.Zones.ZoneVerticalPaddings;

	var ArrangementsArray = [];
	var ZonesWordsGroups = [];

	for (var i=0; i < snDraw.Game.Zones.PlayerZone.length; i++){

	    var Zone_i = snDraw.Game.Zones.PlayerZone[i];
	    var player_i = Zone_i.player;

	    // 5.1 Generate that player's word list (as Fabric Groups)
	    var WordGrpsList_i = [];
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
		WordGrpsList_i.push(WordGroup_j);
	    }

	    // 5.2 Determine the Arrangement of that player's words.


	    var Arrangement_i = snDraw.Game.Words.GenWordArrangement(WordGrpsList_i, WordBounds_P, Spacings, "left");
	    ArrangementsArray.push(Arrangement_i);
	    ZonesWordsGroups.push(WordGrpsList_i);
	}
	

	// 6. Determine the sizes for all the zones, then make them as Fabric objects...
	var grid_bottom_px = snDraw.Game.Grid.GetGridBottomPx();



	//Calculate sizes of the zones...
	var ZoneSizes = snDraw.Game.Zones.CalcZoneSizes(ArrangementsArray, grid_bottom_px, interzonePad, Spacings);


	for (var i = 0; i < snDraw.Game.Zones.PlayerZone.length; i++){
	    var Height = ZoneSizes[i].Height;
	    var Top = ZoneSizes[i].Top;


	    var Properties = {
		color: snDraw.Game.Zones.PlayerZone[i].player.color, // text colour and box boundary
		text: snDraw.Game.Zones.PlayerZone[i].player.name, // Text of the title
		isClient: snDraw.Game.Zones.PlayerZone[i].is_client
	    };

	    
	    //generate the fabric objects that represent the new zone. Note that properties left & top are not set
	    //nor are the objects present onf the canvas.
	    var Zone_i_FabObjs = snDraw.Game.Zones.CreateZoneBox(Height, ZoneSty_P, Properties);
	    var Zone_i_Tops = snDraw.Game.Zones.DetermineZoneBoxObjectsTops(Top, Height, ZoneSty_P);
	    var Zone_i_Lefts = snDraw.Game.Zones.DetermineZoneBoxObjectsLefts(0, ZoneSty_P);

	    //for each object making the ZONE, set coordinates and place on canvas...
	    for (var j = 0; j < Zone_i_FabObjs.length; j++){
		console.log("placing an object at : ", Zone_i_Lefts[j], Zone_i_Tops[j]);
		Zone_i_FabObjs[j].setLeft(Zone_i_Lefts[j]);
		Zone_i_FabObjs[j].setTop(Zone_i_Tops[j]);
		canvas.add(Zone_i_FabObjs[j]);
	    }

	    // place the words in the zone

	    var WordsTopPx = Top + WordBounds_P.topPadding;
	    var Arrangement_i = snDraw.Game.Words.WordArrangementSetHeight(ArrangementsArray[i], WordsTopPx);
	    for (var j = 0; j < Arrangement_i.coords.length; j++){
		snDraw.moveSwitchable(ZonesWordsGroups[i][j], false, null, Arrangement_i.coords[j]);
	    }
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
