snDraw.Game.Turn = {

    //member
    r_spark: undefined,

    addNewTurnedTile: function (tile_index, player_index){
	var newTile = snDraw.Game.generateTileObject(tileset[tile_index], tile_index);

	var WW = 1.5 * snDraw.canv_W; 
	var HH = 0.25 * (snDraw.canv_H + snDraw.canv_W);
	var Br1 = HH;
	var Br2 = Br1 + WW;
	var Br3 = Br2 + HH;

	var Sr = 0.25 * snDraw.canv_W;

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
	    x_orig = snDraw.canv_W + Sr;
	    y_orig = -Sr + perim_remain;
	}

	//fuzz that position a little.
	x_orig += (Math.random()-0.5) * 2 * Sr * 0.8;
	y_orig += (Math.random()-0.5) * 2 * Sr * 0.8;

	//and make it a tile plot coordinate (shift by half width and height)
	x_orig -= snDraw.Game.tileSize/2;
	y_orig -= snDraw.Game.tileSize/2;

	//move the tile onto the boundary line (this is a plot operation without animation
	snDraw.moveSwitchable(newTile, false, null,{
	    left: x_orig,
	    top: y_orig
	});
	//also obscure the tile
	var newTileObscurer = this.createObscurer(x_orig, y_orig, tile_index, players[player_index].color);

	var loc = snDraw.Game.Grid.findNextEmptyGridSlot();
	var loc_left = snDraw.Game.Grid.Grid_xPx[loc.c];
	var loc_top = snDraw.Game.Grid.Grid_yPx[loc.r];
	//ANIMATE the tile
	snDraw.Game.Grid.moveTileOnGrid(tile_index, loc.r, loc.c, snDraw.ani.sty_Sing);

	var onComplete_disperseThisObscurer = function(){
	    var hts = snDraw.Game.tileSize / 2;

	    //update object stored coordinates to the final animation position
	    newTileObscurer.grpCoords = {x:loc_left, y:loc_top};
	    newTileObscurer.centerCoords = {x: loc_left + hts, y: loc_top + hts};
	    snDraw.Game.Turn.disperseObscurer(newTileObscurer);
	};

	//apply the SAME animation to the obscurer:
	snDraw.moveSwitchable(newTileObscurer, onComplete_disperseThisObscurer, snDraw.ani.sty_Sing,{
	    left: loc_left,
	    top: loc_top
	});


    },

    createObscurer: function (xx, yy, tile_index, pl_col){

	var tsz = snDraw.Game.tileSize;
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
	var SingleSparks = snDraw.unGroupAndPlaceSingly(obscurerObj);
	var radSF = Math.PI*2 / 360;
	var fly_radius_px = snDraw.Game.tileSize * 1.2;
	var fly_randomise_px = snDraw.Game.tileSize * 0.4;

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
		var myTile = snDraw.Game.TileArray[uncovered_tileID];
		canvas.remove(myTile);
		canvas.add(myTile);
		canvas.remove(SingleSparks[i]);
	    };
	    
	    snDraw.moveSwitchable(SingleSparks[i], onComplete_deleteLostZone, snDraw.ani.sty_BBshrink,{
		left: flyTo_x - (this.r_spark/2),
		top: flyTo_y -(this.r_spark/2),
		radius: 0
	    });

	}
    }

};
