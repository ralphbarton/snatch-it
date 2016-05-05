snDraw.Game.Grid = {

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


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NEW FUNCTIONS HERE...

    //member objects
    TileGrid: undefined,
    xGridOrigin: undefined,
    yGridOrigin: undefined,
    xy_incr: undefined,
    n_tiles_row: undefined,
    
    InitialiseGrid: function(Spacings){

	// 'Spacings.grpad' refers to minimum padding to left and right of the grid
	// 'Spacings.tsgg' is tile size plus grid gap
	this.n_tiles_row = Math.floor( (snDraw.canv_W - 2*Spacings.grpad) / Spacings.tsgg );
	var width_used = (this.n_tiles_row-1) * Spacings.tsgg + Spacings.ts;
	var left_pad = (snDraw.canv_W-width_used)/2;

	this.xGridOrigin = left_pad;
	this.yGridOrigin = snDraw.Game.Controls.underneath_buttons_px;
	this.xy_incr = Spacings.tsgg;
	
	//clear any old version of the grid...
	this.TileGrid = [[]];
    },

    // This function handles the visual canvas placement, as well as the logic for ensuring that the tile is added
    // to the NEXT AVAILABLE SPACE in the grid. It will be used both for the initial render and for the turned tiles
    // during game play
    GetGridSpace: function(){

	//find empty grid slot
	//get to a row with space
	row = 0;
	while(true){
	    var col = undefined;
	    var c_count = 0;
	    while(col == undefined){//gets an empty column
		if(this.TileGrid[row][c_count] === undefined){
		    col = c_count;
		}
		c_count++;
	    }
	    if(col < this.n_tiles_row){//it's a valid column (within bounds...)
		break;
	    }else{
		row++;
		if(this.TileGrid[row] == undefined){
		    this.TileGrid.push([]);
		}
	    }
	}
	
	return {row: row, col: col};
    },

    GetGridBottomPx: function(){
	var empty_row = false;
	var row_count = 0;
	// determine index of the highest row which is empty
	while(!empty_row){
	    empty_row = true;    
	    if(this.TileGrid[row_count] != undefined){//the row exists, or has existed...
		//determine if the row is empty
		for (var c = 0; c < this.n_tiles_row; c++){//loop through all columns
		    if(this.TileGrid[row_count][c] != undefined){
			empty_row = false;	
		    }
		}
		if(!empty_row){
		    row_count++;
		}
	    }
	}
	var bottomLeft = this.RCgridPx({row:(row_count-1), col:0})
	return bottomLeft.top + snDraw.Game.tileSpacings.ts;
    },

    DetachLetterSetFromGrid: function(tileIDs, ani_sty){

	//1. Remove references
	//it is an array of tiles supplied...
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

	//2. shuffle all tiles into these new gaps defined
	var max_col_height = 0;
	for (var c = 0; c < this.n_tiles_row; c++){//loop through all COLUMNS
	    var n_tiles_in_col = 0; //counts tiles in this column
	    for (var r = 0; r < this.TileGrid.length; r++){//loop through all ROWS
		var TID = this.TileGrid[r][c];
		if(TID != null){//is there a tile here in the grid?
		    n_tiles_in_col++;
		    var min_row_index = n_tiles_in_col - 1;
		    if(min_row_index < r){//could it be shifted up?
			this.PlaceTileInGrid(TID, {row:min_row_index, col:c}, true, ani_sty);
		    }
		}
	    }
	    //record the height of the heighest column (in order to adjust player zone size)
	    if(n_tiles_in_col > max_col_height){
		max_col_height = n_tiles_in_col;
	    }
	}
    },

    PlaceTileInGrid: function(tile_index, gridRC, ani_oC, ani_sty){

	var TileObject = snDraw.Game.TileArray[tile_index];

	//update the GRID -> TILE references
	//only happens if tile already on grid.
	if(TileObject.Grid_row!=undefined){this.TileGrid[TileObject.Grid_row][TileObject.Grid_col] = null;}
	this.TileGrid[gridRC.row][gridRC.col] = tile_index;

	//set the TILE -> GRID references
	TileObject.Grid_row = gridRC.row;
	TileObject.Grid_col = gridRC.col;

	//move the tile object to the canvas location identified
	snDraw.moveSwitchable(TileObject, ani_oC, ani_sty, this.RCgridPx(gridRC));
    },

    RCgridPx: function(gridRC){
	return{
	    left: (gridRC.col * this.xy_incr + this.xGridOrigin),
	    top: (gridRC.row * this.xy_incr + this.yGridOrigin)
	};
    }

};
