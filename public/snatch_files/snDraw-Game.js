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
    client_col: undefined,

    //member objects (the point with these is that they contain fabric objects and are not native variables):
    TileArray: [],

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
	document.addEventListener("keydown",function(e){snDraw.Game.Keyboard.kDown(e); }, false);
    },

    initialDrawEntireGame: function(){
	this.calculateRenderingDimentionConstants();
	canvas.setBackgroundColor(this.bg_col);
	snDraw.Game.Controls.createControls();//draw buttons on the top of the screen
	snDraw.Game.Grid.createEveryTileObject_inGridAtTop();//next draw all the unturned tiles underneath
	snDraw.Game.Zones.CreatePlayerZoneListAndDraw();//next draw all the players word zones
	snDraw.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
	snDraw.measureFramePeriod();
	TA = this.TileArray;//this is to enable faster debugging
    },

    calculateRenderingDimentionConstants: function(){    //this function relies upon a defined number of tiles, which is only after game state is loaded...
	var N_pixels = snDraw.canv_W * snDraw.canv_H;
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
	this.x_plotter_R = 2 * this.marginUnit + this.stroke_px;
	this.tile_space_px = this.tileSize * grid_letter_spacing;
	this.client_col = players[client_player_index].color;
    },

    generateTileObject: function(tile,tile_id){

	//parameter controlling the proportions of the tiles (boarder, font size)
	var tile_letter_prop = 0.9;
	var tile_stroke_prop = 0.06;

	var myTileLetterObj = new fabric.Text(tile.letter,{
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
	    stroke: '#777',
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

	if(tile.status == "turned"){this.modifyTileObject(myNewTileObj,"flipped");}
	if(tile.status == "inword"){this.modifyTileObject(myNewTileObj,"flipped");}

	//note that tile.status does not refer to a real member of the 'tileset' array, necessarily
	if(tile.status == "skeletal"){this.modifyTileObject(myNewTileObj,"skeletal");}

	//add flat-array reference to the object
	this.TileArray[tile_id] = myNewTileObj;

	return myNewTileObj;
    },


    modifyTileObject: function(myTile,to_state){
	//record the visual state of the tile as part of the object
	myTile.visual = to_state;

	if(to_state=="flipped"){//only to be called from within the function
	    myTile.setOpacity(1.0);
	}
	else if(to_state=="skeletal"){
	    myTile.item(0).setFill('black');
	    myTile.item(1).setFill(this.client_col);
	    myTile.item(0).setStroke(this.client_col);
	}
	else if(to_state=="partial"){
	    myTile.setOpacity(0.75);
	}
	else if(to_state=="shadow"){
	    myTile.setOpacity(0.40);
	}
    }
};
