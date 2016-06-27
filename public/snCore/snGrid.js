snCore.Grid = {

    //member objects
    TileGrid: undefined,
    xGridOrigin: undefined,
    yGridOrigin: undefined,
    xy_incr: undefined,
    n_tiles_row: undefined,
    
    InitialiseGrid: function(Spacings){

	// 'Spacings.grpad' refers to minimum padding to left and right of the grid
	// 'Spacings.tsgg' is tile size plus grid gap
	this.n_tiles_row = Math.floor( (snCore.Basic.canv_W - 2*Spacings.grpad) / Spacings.tsgg );
	var width_used = (this.n_tiles_row-1) * Spacings.tsgg + Spacings.ts;
	var left_pad = (snCore.Basic.canv_W-width_used)/2;

	this.xGridOrigin = left_pad;
	this.yGridOrigin = snCore.Controls.underneath_buttons_px;
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
	    //the philosophy here 'col' refers to an empty column in the row of the grid we have reached so far, and so
	    //long as it is undefined, this means that no empty cell has been found.
	    var col = undefined;
	    var c_count = 0;
	    while(col == undefined){//gets an empty column
		// winge: why can't we just choose one of 'undefined' and 'null' to refer to unused locations in the array,
		// and one of == and === for tests like this, and stick to some defined convention and improve code elegance???
		if((this.TileGrid[row][c_count] === undefined)||(this.TileGrid[row][c_count] === null)){
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
	    //logging only
	    if(row > 20){console.log("There is a serious problem in the code. Has a NaN crept into tile dimentions calcs?")}
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
	return bottomLeft.top + snCore.Tile.dims.ts;
    },

    DetachLetterSetFromGrid: function(tileIDs, ani_sty){

	//1. Remove references
	//it is an array of tiles supplied...
	for (var i=0; i<tileIDs.length; i++){
	    var TID = tileIDs[i];
	    var TileObj = snCore.Tile.TileArray[TID];
	    //if present, remove references (i.e. follow the tile's reference to its grid location)
	    if((TileObj.Grid_row !== null)&&(TileObj.Grid_row !== undefined)){
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

	var TileObject = snCore.Tile.TileArray[tile_index];

	//update the GRID -> TILE references
	//only happens if tile already on grid.
	if(TileObject.Grid_row!=undefined){this.TileGrid[TileObject.Grid_row][TileObject.Grid_col] = null;}
	this.TileGrid[gridRC.row][gridRC.col] = tile_index;

	//set the TILE -> GRID references
	TileObject.Grid_row = gridRC.row;
	TileObject.Grid_col = gridRC.col;

	//move the tile object to the canvas location identified
	snCore.Basic.moveSwitchable(TileObject, ani_oC, ani_sty, this.RCgridPx(gridRC));
    },

    RCgridPx: function(gridRC){
	return{
	    left: (gridRC.col * this.xy_incr + this.xGridOrigin),
	    top: (gridRC.row * this.xy_incr + this.yGridOrigin)
	};
    }

};
