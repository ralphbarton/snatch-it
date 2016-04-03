snDraw.Game.Grid = {
    //member objects
    TileGrid: undefined,
    Grid_xPx: [],
    Grid_yPx: [],

    createEveryTileObject_inGridAtTop: function (){

	//parameters controlling tile spacing in the tile grid
	var XPD = 6;//this is the left-px for the tiles grid
	var xy_incr = snDraw.Game.tileSize + snDraw.Game.tile_space_px;
	var x_plotter = XPD;
	var y_plotter = snDraw.Game.Controls.underneath_buttons_px;

	//initialise reference arrays, in case of past usage...
	this.TileGrid = [[]];//contents of the first ROW (it's empty).
	this.Grid_yPx = [];
	this.Grid_xPx = [];
	this.Grid_yPx.push(y_plotter);//y-coordinate of a row of the grid...
	var grid_row_counter = 0;

	for (var i=0; i < tilestats.n_tiles; i++){

	    //in this loop, we have an 'i' for every tile there will be.
	    //We create and iterate through all grid positions, creating references as appropriate
	    var refTileID = null;
	    var refGrid_row = null;
	    var refGrid_col = null;

	    //is there a tile at this position?
	    if(tileset[i]!=undefined){
		//here is the BUSINESS code to create the Fabric object for a tile
		var myTile = snDraw.Game.generateTileObject(tileset[i], i);

		//shall we leave the tile here?
		if(tileset[i].status!="inword"){
		    refTileID = myTile.tileID; //forward reference to go into the grid
		    refGrid_row = grid_row_counter; //backward reference to go into the tile
		    refGrid_col = this.TileGrid[grid_row_counter].length; //backward reference
		}

		//add the tile reference to the grid
		myTile.Grid_row = refGrid_row;
		myTile.Grid_col = refGrid_col;

		//move the tile (ok, but this is kinda duplication of code, this one next line...)
		myTile.set({top:y_plotter,left:x_plotter});
		canvas.add(myTile);

	    }

	    //add the Grid reference to the object
	    this.TileGrid[grid_row_counter].push(refTileID);

	    //capture all the x_coordinates of the colums of the grid (only needs to be done for one row)
	    if(grid_row_counter == 0){
		this.Grid_xPx.push(x_plotter);//x-coordinate of a column of the grid...
	    }

	    //modify the plot coordinates, ready to place the next tile alongside...
	    x_plotter += xy_incr;

	    //rule to wrap around at end of line:
	    if(x_plotter + xy_incr > snDraw.canv_W){
		//plotting coordinates calculation
		x_plotter = XPD;
		y_plotter += xy_incr;
		//additional row:
		this.TileGrid.push([]);//contents another, lower row (empty at the point of starting new line).
		this.Grid_yPx.push(y_plotter);//y-coordinate of a row of the grid...
		grid_row_counter++;
	    }
	}
	//tidy up in case of missing tiles. This also has the (necessary) effect of setting variable playersZoneTopPx
	this.shiftTilesUpGrid();
    },


    shiftTilesUpGrid: function(tile_IDs_moved_off_grid){

	//where no tileIDs are supplied, it is presumed to be the intital screen-rendering call which does not require animation
	var animate = false;
	if(tile_IDs_moved_off_grid){
	    this.remove_Tile_references_from_grid(tile_IDs_moved_off_grid);
	    animate = true;
	}

	var max_col_height = 0;
	for (var c = 0; c < this.Grid_xPx.length; c++){//loop through all COLUMNS
	    var n_tiles_in_col = 0; //counts tiles in this column
	    for (var r = 0; r < this.Grid_yPx.length; r++){//loop through all ROWS
		if(this.TileGrid[r][c]!=null){//is there a tile here in the grid?
		    n_tiles_in_col++;
		    var min_row_index = n_tiles_in_col - 1;
		    if(min_row_index<r){//could it be shifted up?
			this.moveTileOnGrid(this.TileGrid[r][c], min_row_index, c, animate);
		    }
		}
	    }
	    //record the height of the heighest column (in order to adjust player zone size)
	    if(n_tiles_in_col > max_col_height){
		max_col_height = n_tiles_in_col;
	    }
	}

	//added term is one tile height
	var grid_height = (max_col_height==0? snDraw.Game.marginUnit : this.Grid_yPx[max_col_height-1]);

	//here is the one place in the code where tiles bottom is determined and thus set in the Zones class.
	snDraw.Game.Zones.unusedTilesBottomPx = grid_height + snDraw.Game.tile_space_px + snDraw.Game.tileSize;
    },

    //it is important that the destination grid location is empty
    //it is not important that the tile is on the Grid to begin with.
    moveTileOnGrid: function(tile_ID, row, col, animate_aniSty){
	var myTile = snDraw.Game.TileArray[tile_ID];

	var aniSty = typeof(animate_aniSty) == 'boolean' ? snDraw.ani.sty_Resize : animate_aniSty;
	var animate = typeof(animate_aniSty) == 'boolean' ? animate_aniSty : true;
	//animate and move the tile on the canvas
	snDraw.moveSwitchable(myTile, animate, aniSty,{
	    left: this.Grid_xPx[col],
	    top: this.Grid_yPx[row]
	});

	//update the GRID -> TILE references
	if(myTile.Grid_row!=undefined){this.TileGrid[myTile.Grid_row][myTile.Grid_col] = null;}//only happens if tile already on grid.
	this.TileGrid[row][col] = tile_ID;

	//update the TILE -> GRID references
	myTile.Grid_row = row;
	myTile.Grid_col = col;
    },

    remove_Tile_references_from_grid: function(tileIDs){
	for (var i=0; i<tileIDs.length; i++){
	    var TID = tileIDs[i];
	    var TileObj = snDraw.Game.TileArray[TID];
	    //if present, remove references (i.e. follow the tile's reference to its grid location)
	    if(TileObj.Grid_row !== null){
		this.TileGrid[TileObj.Grid_row][TileObj.Grid_col] = null;//now nullify forward ref
		TileObj.Grid_row = null;//nullify back-refs:
		TileObj.Grid_col = null;
	    }
	}
    },

    findNextEmptyGridSlot: function(){
	for (var r=0; r<this.Grid_yPx.length; r++){
	    for (var c=0; c<this.Grid_xPx.length; c++){
		if(this.TileGrid[r][c]===null){//an empty slot in the grid!
		    return {r:r, c:c}
		}
	    }
	}
    },
};
