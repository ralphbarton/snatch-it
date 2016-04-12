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
	    if(tileset[i].status == "turned"){
		//generate tile & put in grid
		var TileObject_i = snDraw.Game.generateTileObject(tileset[i], i);
		var gridRC = snDraw.Game.Grid.GetGridSpace();
		var bottomTilePx = snDraw.Game.Grid.PlaceTileInGrid(i, gridRC, false, null);//todo rename this...
	    }
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
		WordGrpsList_i.push(WordGroup_j);
	    }

	    // 5.2 Determine the Arrangement of that player's words.
	    // ?? efficiency problem. Use the function iteratively?
	    /*
	      This is a problem. We're supposed to get the inner bound of the box from creating the zone,
	      but we also require the before the zone is created. Refactor AAargh.
	    */
	    Bounds = {
		left: 20,
		right: 480,
		top: 0
	    };


	    var Arrangement_i = snDraw.Game.Words.CalculateWordArrangement(WordGrpsList_i, Bounds, Spacings, "left");
	    ArrangementsArray.push(Arrangement_i);
	}

	// 6. Determine the sizes for all the zones, then make them as Fabric objects...
	var ZoneSizes = snDraw.Game.Zones.CalculateAllZoneSizes(ArrangementsArray, 100, 4, Spacings);

	for (var i = 0; i < snDraw.Game.Zones.PlayerZone.length; i++){
	    var Height = ZoneSizes[i].Height;
	    var Top = ZoneSizes[i].Top;

	    var Style = { //all in pixels
		hpad: 4,  // horizonal padding between screen boundary and box edge (vertical)
		// no use here... vpad: 1, // vertical spacing between zones (between lower edge of bottom boundary and top of upper text)
		spellpad: 10, // vertical padding of spell (between upper edge of bottom box boundary and lower edge of tile).
		box_fill: 'rgba(0,0,0,0)', // inside the box
		text_bg: 'blue', // inside the box
		color: 'yellow', // text colour and box boundary
		thick: 8, // thickness of the box line
		text: "Newt", // Text of the title
		text_pad: " ",
		justify: "left", // justification of the title
		titlepad: 40, // effectively, the indentation of the title	
		fontsize: 30, // refers to the font of the title
		fonthalfheight: 17, // refers to the offset between top of font and top surface of box
		isClient: false, // boolean, means extra
		scale_you: 80, // scaling of the block saying "you"
		tri_w: 50, // Width, in pixels, of the little triangle (spell pointer)
		tri_h: 30 // Height, in pixels, of the little triangle (spell pointer)
	    }

	    
	    //generate the fabric objects that represent the new zone. Note that properties left & top are not set
	    //nor are the objects present onf the canvas.
	    var Zone_i_FabObjs = snDraw.Game.Zones.CreateZoneBox(Height, Style);
	    var Zone_i_Tops = snDraw.Game.Zones.DetermineZoneBoxObjectsTops(Top, Height, Style);
	    var Zone_i_Lefts = snDraw.Game.Zones.DetermineZoneBoxObjectsLefts(0, Style);

	    //for each object, set coordinates and place on canvas...
	    for (var j = 0; j < Zone_i_FabObjs.length; j++){
		Zone_i_FabObjs[j].setLeft(Zone_i_Lefts[j]);
		Zone_i_FabObjs[j].setTop(Zone_i_Tops[j]);
		canvas.add(Zone_i_FabObjs[j]);
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
