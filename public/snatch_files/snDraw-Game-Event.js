snDraw.Game.Event = {

    //this function is called upon entry into the game and anything that requires redraw of all (such as window resize)
    DrawAll: function(){

	// 1. Determine Scale Constants & set background...
	var Spacings = snDraw.Game.calculateRenderingDimentionConstants();
	canvas.setBackgroundColor(snDraw.Game.bg_col);

	// 2. Add the controls strip
	snDraw.Game.Controls.createControls();

	// 3. Create all the grid tiles...
	snDraw.Game.Grid.InitialiseGrid(Spacings);
	for (var i = 0; i < tilestats.n_turned; i++){
	    //generate a tile
	    var TileObject_i = snDraw.Game.generateTileObject(tileset[i], i);
	    //put it into grid
	    snDraw.Game.Grid.AddLetterToGrid(TileObject_i, false, null);
	}

	// 4. Create the zones containers (this is NOT visually creating the zones)
	snDraw.Game.Zones.PlayerZone = [];

	// 4.1 Unconditionally add client's zone
	snDraw.Game.Zones.PlayerZone[0] = {
	    player: players[client_player_index],
	    is_client: true
	};

	// 4.2 Add all players who who have words and aren't client
	for (var i=0; i<players.length; i++){
	    if((i!=client_player_index) && (players[i].words.length>0)){
		snDraw.Game.Zones.PlayerZone.push({
		    player: players[i],
		    is_client: false
		});
	    }
	}

	// 5. For all zones: generate words and determine their arrangement
	var ArrangementsArray = [];
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
		WordGrpsList_i.push();
	    }

	    // 5.2 Determine the Arrangement of that player's words.
	    // ?? efficiency problem. Use the function iteratively?
	    /*
	      This is a problem. We're supposed to get the inner bound of the box from creating the zone,
	      but we also require the before the zone is created. Refactor AAargh.
	    */
	    Bounds = {
		left: 0,
		right: 200,
		top: 0
	    };

	    var Arrangement_i = snDraw.Game.Words.CalculateWordArrangement(WordGrpsList_i, Bounds, Spacings, "left");
	    ArrangementsArray.push(Arrangement_i);
	}

	// 6. Determine the sizes for all the zones, then make them as Fabric objects...
	var xxx = snDraw.Game.Zones.CalculateAllZoneSizes(ArrangementsArray);

	for (var i=0; i < snDraw.Game.Zones.PlayerZone.length; i++){
	    var Height = 0;//TODO this is wrong
	    var Style = {text:'33'};//TODO this is wrong
	    var Zone_i_FabObjs = snDraw.Game.Zones.CreateZoneBox(Height, Style);
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
