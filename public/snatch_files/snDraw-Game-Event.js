snDraw.Game.Event = {

    //this function is called upon entry into the game and anything that requires redraw of all (such as window resize)
    DrawAll: function(){

	//Determine Scale Constants & set background...
	snDraw.Game.calculateRenderingDimentionConstants();
	canvas.setBackgroundColor(snDraw.Game.bg_col);

	//Add the controls strip
	snDraw.Game.Controls.createControls();

	//Create all the grid tiles...
	snDraw.Game.Grid.InitialiseGrid();
	for (var i = 0; i < tilestats.n_turned; i++){
	    //generate a tile
	    var TileObject_i = snDraw.Game.generateTileObject(tileset[i], i);
	    //put it into grid
	    snDraw.Game.Grid.AddLetterToGrid(TileObject_i, false, null);
	}

	//Create all the zones

	// .. make the box

	// .. create and add all the words...

    },

    SnatchEvent: function(){

    },
    
    TileTurn: function(){

    },
    
    Disconnection: function(){
    
    },
    
    Reconnection: function(){

    }

};
