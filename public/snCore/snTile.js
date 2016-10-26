snCore.Tile = {

    //member variables
    Ratio_tile: undefined,

    //member objects (the point with these is that they contain fabric objects and are not native variables):
    TileArray: [],

    dims: undefined,
    stdDimention: undefined,

    //this function returns true if value has been changed...
    setTileRatSizeFromNTiles: function(n_tiles){
	var old_Ratio_tile = this.Ratio_tile;
	if(n_tiles < 30){
	    this.Ratio_tile = 0.65;
	}else if(n_tiles < 65){
	    this.Ratio_tile = 0.37;
	}else{
	    this.Ratio_tile = 0.28;
	}
	return this.Ratio_tile != old_Ratio_tile;

    },

    generateTileObject: function(tile,tile_id){

	var myTileLetterObj = new fabric.Text(tile.letter,{
	    originX: 'center',
	    top: -this.dims.ts/2,
	    fontWeight: 'bold',
	    fontSize: this.dims.ts_font1,
	    selectable: false
	});

	var myTileNumberObj = new fabric.Text(tile_id.toString(),{
	    left: this.dims.ts/2 * 0.4,
	    top: this.dims.ts/2 * 0.4,
	    fill: 'black',
	    fontWeight: 'bold',
	    fontSize: this.dims.ts_font2,
	    selectable: false
	});

	var myTileRectObj = new fabric.Rect({
	    originX: 'center',
	    originY: 'center',
	    strokeWidth: this.dims.ts_thick,
	    width: this.dims.tsi,
	    height: this.dims.tsi,
	    rx: this.dims.ts_rad,
	    ry: this.dims.ts_rad
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

	//initially, unconditionally set it to 'normal'
	this.modifyTileObject(myNewTileObj, "normal");

	if(tile.status == "turned"){this.modifyTileObject(myNewTileObj, "flipped");}
	if(tile.status == "inword"){this.modifyTileObject(myNewTileObj, "flipped");}

	//note that tile.status does not refer to a real member of the 'tileset' array, necessarily
	if(tile.status == "skeletal"){this.modifyTileObject(myNewTileObj, "skeletal");}

	//add flat-array reference to the object
	this.TileArray[tile_id] = myNewTileObj;

	return myNewTileObj;
    },


    modifyTileObject: function(myTile,to_state){
	//record the visual state of the tile as part of the object
	myTile.visual = to_state;

	if(to_state=="normal"){
	    myTile.item(0).setFill('rgb(54,161,235)');
	    myTile.item(1).setFill('#FF0');
	    myTile.item(0).setStroke('#777');
	}
	else if(to_state=="new"){
	    myTile.item(0).setFill('rgb(105,193,255)');
	    myTile.item(1).setFill('#FF0');
	    myTile.item(0).setStroke('#FF0');
	}
	else if(to_state=="flipped"){//only to be called from within the function
	    myTile.setOpacity(1.0);

	    //Change opacity of the letter in YELLOW - somehow the command above stopped affecting it.
	    myTile.item(1).setFill("rgba(255,255,0,1.0)");
	}
	else if(to_state=="skeletal"){
	    myTile.item(0).setFill('black');
	    myTile.item(1).setFill( players[client_player_index].color );
	    myTile.item(0).setStroke( players[client_player_index].color );
	}
	else if(to_state=="partial"){
	    myTile.setOpacity(0.75);

	    //Change opacity of the letter in YELLOW - somehow the command above stopped affecting it.
	    myTile.item(1).setFill("rgba(255, 255, 0, 0.75)");
	}
	else if(to_state=="shadow"){
	    myTile.setOpacity(0.40);

	    //Change opacity of the letter in YELLOW - somehow the command above stopped affecting it.
	    myTile.item(1).setFill("rgba(255, 255, 0, 0.4)");
	}
	else if(to_state=="invert"){
	    myTile.item(1).setFill('black');
	    myTile.item(0).setStroke('white');
	}

    },

    briefPaleTileObject: function(myTile){
	this.modifyTileObject(myTile, "new");
	setTimeout(function(){
	    snCore.Tile.modifyTileObject(myTile, "normal");	    
	    snCore.Basic.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
	}, 1500);
    },

    TileArray_to_LettersArray: function(TileArray){
	//get the letter set
	var letters_array = [];
	for(var i = 0; i < TileArray.length; i++){
	    letters_array.push(TileArray[i].letter);
	}
	return letters_array;
    },

    TileIDArray_to_LettersString: function(TileIDArray){
	//get the letter set
	var letters_string = "";
	for(var i = 0; i < TileIDArray.length; i++){
	    var myTile = this.TileArray[TileIDArray[i]];
	    letters_string += myTile.letter;
	}
	return letters_string;
    },

    GenRandomCoords_TileEntryOrigin: function (){

	var WW = 1.5 * snCore.Basic.canv_W; 
	var HH = 0.25 * (snCore.Basic.canv_H + snCore.Basic.canv_W);
	var Br1 = HH;
	var Br2 = Br1 + WW;
	var Br3 = Br2 + HH;

	var Sr = 0.25 * snCore.Basic.canv_W;

	var perim_pos = Math.random() * Br3;
	var x_orig = undefined;
	var y_orig = undefined;

	//coordinate transform from (1) a position along a line to (2) pixel (x,y) coords
	if(perim_pos < Br1){//left bar
	    x_orig = -Sr;
	    y_orig = -Sr + perim_pos;
	}else if(perim_pos < Br2){//top
	    var perim_remain = perim_pos - Br1;
	    x_orig = -Sr + perim_remain;
	    y_orig = -Sr;
	}else {//right bar
	    var perim_remain = perim_pos - Br2;
	    x_orig = snCore.Basic.canv_W + Sr;
	    y_orig = -Sr + perim_remain;
	}

	//fuzz that position a little.
	x_orig += (Math.random()-0.5) * 2 * Sr * 0.8;
	y_orig += (Math.random()-0.5) * 2 * Sr * 0.8;

	//and make it a tile plot coordinate (shift by half width and height)
	x_orig -= snCore.Tile.dims.ts/2;
	y_orig -= snCore.Tile.dims.ts/2;

	return {
	    left: x_orig,
	    top: y_orig
	};
    },

    //member
    r_spark: undefined,
    createObscurer: function (xx, yy, tile_index, pl_col){

	var tsz = snCore.Tile.dims.ts;
	this.r_spark = tsz * 0.2;
	var inset = 0.25;
	var Q1 = tsz*inset - this.r_spark;
	var Q3 = tsz*(1-inset) - this.r_spark;
	//add at 4 corners
	var sparks_coords = [
	    {x: Q1, y: Q1},
	    {x: Q1, y: Q3},
	    {x: Q3, y: Q1},
	    {x: Q3, y: Q3}
	];

	for (var i=0; i < 7; i++){//this makes a total of 11
	    sparks_coords.push({
		x: Math.random() * (tsz - 2 * this.r_spark),
		y: Math.random() * (tsz - 2 * this.r_spark)
	    });
	}

	var sparkObjs = [];

	var TopLeftPixelObj = new fabric.Rect({
	    fill: 'rgb(255,0,0)',
	    left: 0,
	    top: 0,
	    width: 1,
	    height: 1
	});
	TopLeftPixelObj.relObjCoords = {x:0, y:0};
	sparkObjs.push(TopLeftPixelObj);

	//create the spark objects based on the coordinates array
	for (var i=0; i < sparks_coords.length; i++){

	    var mySpark = new fabric.Circle({
		radius: this.r_spark,
		fill: pl_col,
		left: sparks_coords[i].x,
		top: sparks_coords[i].y,
		hasControls: false,
		hasBorders: false,
		selectable: false
	    });
	    mySpark.relObjCoords = sparks_coords[i];
	    sparkObjs.push(mySpark);
	}

 	var sparkGrp = new fabric.Group(sparkObjs, {
	    hasControls: false,
	    hasBorders: false,
	    selectable: false
	});

	sparkGrp.tileID = tile_index;
	sparkGrp.set({left: xx, top: yy});
	canvas.add(sparkGrp);
	return sparkGrp;
    },


    disperseObscurer: function (obscurerObj){

	var uncovered_tileID = obscurerObj.tileID;
	var SingleSparks = snCore.Basic.unGroupAndPlaceSingly(obscurerObj);
	var radSF = Math.PI*2 / 360;
	var fly_radius_px = snCore.Tile.dims.ts * 1.2;
	var fly_randomise_px = snCore.Tile.dims.ts * 0.4;

	canvas.remove(SingleSparks[0]);	//actions to remove that black from the canvas
	var n_sparks = SingleSparks.length-1;
	for (var i=1; i < SingleSparks.length; i++){
	    
	    //calculate all those dimentions associated with animating the
	    var placement_angle = 360 * (i / n_sparks);

	    //values inlude offset to place to top left pixel of the enclosing box for the circle
	    var raw_flyTo_x = obscurerObj.centerCoords.x + fly_radius_px * Math.cos(radSF * placement_angle);
	    var raw_flyTo_y = obscurerObj.centerCoords.y - fly_radius_px * Math.sin(radSF * placement_angle);
	    var flyTo_x = raw_flyTo_x - this.r_spark + fly_randomise_px * (Math.random()-0.5);
	    var flyTo_y = raw_flyTo_y - this.r_spark + fly_randomise_px * (Math.random()-0.5);

	    var onComplete_deleteLostZone = function(){

		//tile needs to be removed and re-added to restore touch sensitivity over obscurer
		var myTile = snCore.Tile.TileArray[uncovered_tileID];
		canvas.remove(myTile);
		canvas.add(myTile);
		canvas.remove(SingleSparks[i]);
	    };
	    
	    snCore.Basic.moveSwitchable(SingleSparks[i], onComplete_deleteLostZone, snCore.Basic.ani.sty_BBshrink,{
		left: flyTo_x - (this.r_spark/2),
		top: flyTo_y -(this.r_spark/2),
		radius: 0
	    });

	}
    }

};
