//this file contains the functions that render the game onto the screen
var dev = false;

var TA = [];//this is to enable faster debugging

snDraw.Game = {
    
    //member variables - relating to specific dimentions to use on this screen...
    tileSize: undefined,
    marginUnit: undefined,
    textMarginUnit: undefined,
    stroke_px: undefined,

    h_space_word: undefined,
    h_spacer: undefined,
    v_spacer: undefined,
    x_plotter_R: undefined, // x-coordinate of "carriage return"
    tile_space_px: undefined,

    Ratio_tile: 0.37, //Tuneable

    //member variables - dynamic, for rendering...
    dark_background: undefined,
    bg_col: undefined,
    fg_col: undefined,

    //member objects (the point with these is that they contain fabric objects and are not native variables):
    TileArray: [],
    TileGrid: undefined,
    Grid_xPx: [],
    Grid_yPx: [],
    TileGroupsArray: [],//not convinced we need this...

    //methods:
    setDarkBackground: function(isDark){
	dark_background = isDark;
	this.bg_col = isDark ? 'black' : 'white';
	this.fg_col = isDark ? 'white' : 'black';

    },

    addListeners_kb_mouse: function(){
	//mouse event listeners
	canvas.on('mouse:down', function(e){snDraw.Game.Mouse.mDown(e); });
	canvas.on('mouse:up',   function(e){snDraw.Game.Mouse.mUp(e);   });
	canvas.on('mouse:over', function(e){snDraw.Game.Mouse.mOver(e); });
	canvas.on('mouse:out',  function(e){snDraw.Game.Mouse.mOut(e);  });

	//keyboard event listeners
	document.addEventListener("keydown",function(e){snDraw.Game.KB.kDown(e); }, false);
    },

    initialDrawEntireGame: function(){
	this.calculateRenderingDimentionConstants();
	canvas.setBackgroundColor(this.bg_col);
	canvas.clear();	    
	snDraw.Game.Controls.createControls();//draw buttons on the top of the screen
	this.createEveryTileObject_inGridAtTop();//next draw all the unturned tiles underneath
	snDraw.Game.Zones.CreatePlayerZoneListAndDraw();//next draw all the players word zones
	canvas.renderAll();
	snDraw.measureFramePeriod();
	TA = this.TileArray;//this is to enable faster debugging
    },

    calculateRenderingDimentionConstants: function(){    //this function relies upon a defined number of tiles, which is only after game state is loaded...
	var N_pixels = myZoneWidth * myZoneHeight;
	var Tile_pixels = N_pixels * this.Ratio_tile / tilestats.n_tiles;
	var tile_dim = Math.sqrt(Tile_pixels);
	var grid_letter_spacing = 0.14;

	this.tileSize = Math.round(tile_dim);
	
	this.marginUnit = this.tileSize*0.13;
	this.textMarginUnit = this.tileSize*0.2;
	this.stroke_px = Math.round(this.marginUnit * 0.5);
	
	this.h_space_word = this.tileSize * 0.6;//define a constant: additional horizonal spacing pixels to use for a space between words
	this.h_spacer = this.tileSize * 1.04;
	this.v_spacer = this.tileSize * 1.12;
	this.x_plotter_R = 2 * this.marginUnit;
	this.tile_space_px = this.tileSize * grid_letter_spacing;

    },

    addNewTurnedTile: function (tile_index){
	var newTile = this.generateTileObject(tileset[tile_index], tile_index);
	var loc = this.findNextEmptyGridSlot();
	this.moveTileOnGrid(tile_index, loc.r, loc.c, false);
    },

    createEveryTileObject_inGridAtTop: function (){

	//parameters controlling tile spacing in the tile grid
	var XPD=6;//this is the left-px for the tiles grid
	var xy_incr = this.tileSize + this.tile_space_px;
	var x_plotter = XPD;
	var y_plotter = 6 + xy_incr;

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
		var myTile = this.generateTileObject(tileset[i], i);

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
	    if(x_plotter + xy_incr > myZoneWidth){
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
	var grid_height = (max_col_height==0? this.marginUnit : this.Grid_yPx[max_col_height-1]);
	var unusedTilesBottomPx = grid_height + (this.tile_space_px + this.tileSize);

	//it's only upon determining the bottom of the unsed tiles that we can set the variable "playersZoneTopPx"
	snDraw.Game.Zones.playersZoneTopPx = Math.round(unusedTilesBottomPx + this.marginUnit);
    },

    //it is important that the destination grid location is empty
    //it is not important that the tile is on the Grid to begin with.
    moveTileOnGrid: function(tile_ID, row, col, animate){
	var myTile = this.TileArray[tile_ID];
	//animate and move the tile on the canvas
	snDraw.moveSwitchable(myTile, animate, snDraw.ani.sty_Resize,{
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
	    var TileObj = this.TileArray[TID];
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
		if(snDraw.Game.TileGrid[r][c]===null){//an empty slot in the grid!
		    return {r:r, c:c}
		}
	    }
	}
    },


    generateTileObject: function(tile,tile_id){

	//parameter controlling the proportions of the tiles (boarder, font size)
	var tile_letter_prop = 0.9;
	var tile_stroke_prop = 0.06;

	var myTileLetterObj = new fabric.Text("",{
	    originX: 'center',
	    top: -this.tileSize/2,
	    fill: 'yellow',
	    fontWeight: 'bold',
	    fontSize: tile_letter_prop * this.tileSize,
	    selectable: false
	});

	
	var myTileNumberObj = new fabric.Text(tile_id.toString(),{
	    left: this.tileSize/2 * 0.4,
	    top: this.tileSize/2 * 0.4,
	    fill: 'black',
	    fontWeight: 'bold',
	    fontSize: tile_letter_prop * this.tileSize * 0.32,
	    selectable: false
	});


	var myTileRectObj = new fabric.Rect({
	    originX: 'center',
	    originY: 'center',
	    fill: 'rgb(54,161,235)',
	    stroke: '#999',
	    strokeWidth: this.tileSize*tile_stroke_prop,
	    width: this.tileSize,
	    height: this.tileSize,
	    rx: 0.12 * this.tileSize,
	    ry: 0.12 * this.tileSize
	});

	var TileObjCollection = [myTileRectObj, myTileLetterObj];
	if(dev){TileObjCollection.push(myTileNumberObj);}

	var myNewTileObj = new fabric.Group(TileObjCollection, {
	    hasControls: false,
	    hasBorders: false,
	    selectable: false
	});

	myNewTileObj.tileID=tile_id;
	myNewTileObj.letter=tile.letter;
	myNewTileObj.visual="facedown";

	if(tile.status == "turned"){this.modifyTileObject(myNewTileObj,"flipped");}
	if(tile.status == "inword"){this.modifyTileObject(myNewTileObj,"flipped");}
	if(tile.status == "skeletal"){this.modifyTileObject(myNewTileObj,"skeletal");}
	if(tile.status == "partial"){this.modifyTileObject(myNewTileObj,"partial");}
	if(tile.status == "shadow"){this.modifyTileObject(myNewTileObj,"shadow");}

	//add flat-array reference to the object
	this.TileArray[tile_id] = myNewTileObj;

	return myNewTileObj;
    },


    modifyTileObject: function(myTile,to_state,options){
	myTile.visual = to_state;

	var ObjFlip = function(){
	    myTile.item(1).setText(myTile.letter);
	    //myTile.set({selectable:true});
	};

	if(to_state=="flipped"){//only to be called from within the function
	    myTile.item(0).setFill('rgb(54,161,235)');
	    myTile.item(1).setFill('yellow');
	    myTile.item(0).setStroke('#666');
	    ObjFlip();
	}
	else if(to_state=="skeletal"){
	    myTile.item(0).setFill('#383838');
	    myTile.item(1).setFill('#8ec2e8');
	    myTile.item(0).setStroke('#8ec2e8');
	    ObjFlip();
	}
	else if(to_state=="partial"){
	    myTile.item(0).setFill('#75b8c9');
	    myTile.item(1).setFill('#c77a00');
	    myTile.item(0).setStroke('#c77a00');
	    ObjFlip();
	}
	else if(to_state=="shadow"){
	    myTile.item(0).setFill('#70855c');
	    myTile.item(1).setFill('#682424');
	    myTile.item(0).setStroke('#682424');
	    ObjFlip();
	}
    },

    //this is my most complex function, it uses recursion to achieve a letter-by-letter animation.
    drawSingleCapturedWord: function(myplayer, word_index, animate){
	var x_plotter = myplayer.x_next_word;
	var y_plotter = myplayer.y_next_word;

	var word_as_tile_index_array = myplayer.words[word_index]; 
	var word_length = word_as_tile_index_array.length;

	//remove any grid references of any tiles:
	this.remove_Tile_references_from_grid(word_as_tile_index_array);

	//word wrap handler
	//if this word will run over the end of the line, do a carriage return...
	if( this.xCoordExceedsWrapThreshold(x_plotter + (this.h_spacer * word_as_tile_index_array.length))){
	    y_plotter += this.v_spacer;
	    x_plotter = this.x_plotter_R;
	}

	var LettersOfThisWord = [];//this is an array of Fabric objects (the tiles)

	//generates a new animation properties object which includes a callback to group the relevant set of letter tiles upon completion of the animation
	var onComplete_groupLetters = function(){
	    snDraw.Game.makeTilesDraggableGroup(LettersOfThisWord, myplayer, word_index);
	};

	function Recursive_Letters_Loop(i){
	    var this_tile_index = word_as_tile_index_array[i];
	    var ThisTile = snDraw.Game.TileArray[this_tile_index];
	    LettersOfThisWord[i]=ThisTile;

	    //move the relevant tile (already existing on the canvas) to location...
	    var my_animate_onComplete = animate ? ((i == word_length-1) ? onComplete_groupLetters : true) : false;
	    snDraw.moveSwitchable(ThisTile, my_animate_onComplete, snDraw.ani.sty_Sing,{
		left: x_plotter,
		top: y_plotter
	    });
	    x_plotter += snDraw.Game.h_spacer;
	
	    //recursively call this function to achieve looping
	    i++;
	    if(i < word_length){
		if(animate){
		    setTimeout(function(){Recursive_Letters_Loop(i);}, snDraw.ani.sty_Sing.duration * 0.3);
		}
		else{
		    Recursive_Letters_Loop(i);
		}
	    }else{//the letters of the word have finished being run through
		if(!animate){snDraw.Game.makeTilesDraggableGroup(LettersOfThisWord, myplayer, word_index);}//this only gets called via a later callback in the case of animation (see above)

		//when the letter has been moved, these instructions finish it all off
		x_plotter += snDraw.Game.h_space_word;

		//finally, always at the end of writing a word, record the coordinates for writing a new word...
		myplayer.x_next_word = x_plotter;
		myplayer.y_next_word = y_plotter;
	    }
	}
	Recursive_Letters_Loop(0);
    },


    makeTilesDraggableGroup: function(LettersOfThisWord, myplayer, word_index){
	var grp_left = LettersOfThisWord[0].getLeft() - 0.5;
	var grp_top = LettersOfThisWord[0].getTop() - 0.5;
	
	for (var i=0; i<LettersOfThisWord.length; i++){//LOOP thru the letters of one specific word...
	    canvas.remove(LettersOfThisWord[i]);//remove the single tile (after animation) so that it can be readded as a group...
	}

	var PlayerWordGRP = new fabric.Group( LettersOfThisWord, {
	    hasControls: false,
	    hasBorders: false
	});

	PlayerWordGRP.OwnerPlayer = myplayer;
	PlayerWordGRP.Player_word_index = word_index;
	this.TileGroupsArray[myplayer.index].push(PlayerWordGRP);

	PlayerWordGRP.set({
	    left: grp_left,
	    top: grp_top
	});

	canvas.add(PlayerWordGRP);
	canvas.renderAll();
    },

    //this function removes an arbitrary set of words, indexed by player and within that by word index.
    removeWordsAndUngroup: function(RemovalWordList){
	
	//LOOP through all stolen words
	for (var i=0; i<RemovalWordList.length; i++){
	    var PIi = RemovalWordList[i].PI;
	    var WIi = RemovalWordList[i].WI;

	    //modify the players data structure:
	    var removed_word_tileIDs = players[PIi].words[WIi];
	    delete players[PIi].words[WIi];//just delete the array element now, purge the array of empy elements later

	    //determine the group coordinates...
	    var StolenGRP = this.TileGroupsArray[PIi][WIi];	    
	    var Stolen_x_base = StolenGRP.getLeft(); 
	    var Stolen_y_base = StolenGRP.getTop(); 

	    //remove tiles from Group, and place in position as individual tiles:
	    for (var j=0; j<removed_word_tileIDs.length; j++){
		var StolenTile = this.TileArray[removed_word_tileIDs[j]];
		this.TileGroupsArray[PIi][WIi].remove(StolenTile);		
		//place individual tiles back on the canvas in location
		StolenTile.set({
		    left: Stolen_x_base + this.h_spacer * j,
		    top: Stolen_y_base
		});
		canvas.add(StolenTile);
	    }
	    
	    //remove the now empty group itself
	    canvas.remove(StolenGRP);
	    delete this.TileGroupsArray[PIi][WIi];
	}

	for (var i = 0; i<players.length; i++){
	    this.TileGroupsArray[i].clean(undefined);
	    players[i].words.clean(undefined);
	}
    },

    //given the possibility that snatching a word from a player will leave a gap, this function runs through the words
    //drawing them one after another to avoid any gap.
    //in the case where this player has just snatched a word, the final word in their list will be animating into place.
    //Thus function should not attempt to animate it (which would be duplication), hence the flag...
    animateRepositionPlayerWords: function(player,exclude_final_word_reposition){

	var x_plotter = this.x_plotter_R;
	var y_plotter = player.y_first_word;
	var word_set = player.words;
	var word_GRPs = this.TileGroupsArray[player.index];

	var n_words = word_set.length;
	if(exclude_final_word_reposition){n_words--;}

	for (var i = 0; i < n_words; i++){

	    var x_span_word = this.h_spacer * word_set[i].length;

	    //if this word will run over the end of the line, do a carriage return...
	    if( this.xCoordExceedsWrapThreshold(x_plotter + x_span_word)){
		y_plotter += this.v_spacer;
		x_plotter = this.x_plotter_R;
	    }
	    
	    //now its position is determined; animate it into position.
	    snDraw.moveSwitchable(word_GRPs[i], true, snDraw.ani.sty_Resize,{
		left: x_plotter,
		top: y_plotter
	    });

	    //move the plotter along, given the placing of the word...
	    x_plotter += this.h_space_word + x_span_word;
	}

	//set the saved coordinates back as modified...
	player.x_next_word = x_plotter;
	player.y_next_word = y_plotter;
    },

    xCoordExceedsWrapThreshold: function(x_coord){
	return (x_coord > myZoneWidth - this.marginUnit);
    }

};
