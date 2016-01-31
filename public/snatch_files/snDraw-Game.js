
//this file contains the functions that render the game onto the screen

snDraw.Game = {
    
    //member variables - relating to specific dimentions to use on this screen...
    tileSize: undefined,
    marginUnit: undefined,
    textMarginUnit: undefined,
    stroke_px: undefined,
    Ratio_tile: 0.15, //Tuneable

    //member variables - dynamic, for rendering...
    unusedTilesBottomPx: undefined,
    playersZoneTopPx: undefined,
    dark_background: undefined,
    bg_col: undefined,
    fg_col: undefined,

    //member objects (the point with these is that they contain fabric objects and are not native variables):
    TileArray: [],


    //methods:
    calculateRenderingDimentionConstants: function(){    //this function relies upon a defined number of tiles, which is only after game state is loaded...
	var N_pixels = myZoneWidth * myZoneHeight;
	var Tile_pixels = N_pixels * Ratio_tile / N_tiles;
	var tile_dim = Math.sqrt(Tile_pixels);
	this.tileSize = Math.round(tile_dim);
	
	this.marginUnit = this.tileSize*0.13;
	this.textMarginUnit = this.tileSize*0.2;
	this.playersZoneTopPx = Math.round(this.unusedTilesBottomPx) + this.marginUnit;
	this.stroke_px = Math.round(this.marginUnit*0.5);
    },

    setDarkBackground: function(isDark){
	dark_background = isDark;
	bg_col: isDark ? 'black' : 'white';
	fg_col: isDark ? 'white' : 'black';

    },

    initialDrawEntireGame: function(){
	canvas.setBackgroundColor(bg_col);
	canvas.clear();	    
	this.createEveryTileObject_inGridAtTop();
	this.drawEntirePlayerZone();//this is the BIG DEAL and it creates all of the objects for the game
	snDraw.Game.Controls.createControls();
	canvas.renderAll();
    },

    createEveryTileObject_inGridAtTop: function (){

	var letter_spacing = 0.14;

	//parameters controlling tile spacing in the tile grid
	var tile_space_px = this.tileSize * letter_spacing;
	var XPD=6;//this is the left-px for the tiles grid
	var x_plotter = XPD;
	var y_plotter = 6 + this.tileSize + tile_space_px;

	//now create a fabric object for every tile...
	for (i=0; i<tileset.length; i++){
	    
	    var myTile = this.generateTileObject(tileset[i],i);//here is the BUSINESS code to create the Fabric object for a tile
	    myTile.set({top:y_plotter,left:x_plotter});
	    TileArray[i]=myTile;
	    canvas.add(myTile);

	    //modify the plot coordinates, ready to place the next tile alongside...
	    x_plotter += tile_space_px + this.tileSize;

	    //rule to wrap around at end of line:
	    if(x_plotter+tile_space_px+this.tileSize>myZoneWidth){
		x_plotter=XPD;
		y_plotter += tile_space_px + this.tileSize;
	    }
	}

	//handles the case of a full bottom line of tiles...
	this.unusedTilesBottomPx = y_plotter + (x_plotter==XPD ? 0 :  tile_space_px + this.tileSize);
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

	var myNewTileObj = new fabric.Group( [myTileRectObj, myTileLetterObj], {
	    hasControls: false,
	    hasBorders: false,
	    selectable: false
	});

	myNewTileObj.tileID=tile_id;
	myNewTileObj.letter=tile.letter;
	myNewTileObj.visual="facedown";

	if(tile.status == "turned"){this.modifyTileObject(myNewTileObj,"flipped");}
	if(tile.status == "inword"){this.modifyTileObject(myNewTileObj,"flipped");}

	return myNewTileObj;
    },


    modifyTileObject: function(myTile,to_state,options){
	myTile.visual = to_state;
	if(to_state=="flipping"){//this will animate the tile...

	    pl_col = players[options.player_i].color;
	    function animateCountDown(hs){
		// variable 'hs' is number of quarter-seconds remaining
		if (hs%2){
		    myTile.item(0).setStroke(pl_col);
		}else{
		    myTile.item(0).setStroke(bg_col);
		}
		canvas.renderAll();
		var hs2 = hs-1;
		if(hs2){
		    setTimeout(function(){animateCountDown(hs2);},125);
		}else{
		    modifyTileObject(myTile,"flipped");
		}
	    }
	    animateCountDown(8*options.time);
	}
	if(to_state=="flipped"){//only to be called from within the function
	    myTile.item(1).setFill('yellow');
	    myTile.item(0).setFill('rgb(54,161,235)');
	    myTile.item(1).setText(myTile.letter);
	    myTile.item(0).setStroke('#666');
	    myTile.set({selectable:true});
	    canvas.renderAll();
	}
	else if(to_state=="ACTIVE"){
    	    console.log("checkpoint 5");

	    myTile.item(1).setFill('red');
	    myTile.item(0).setFill('yellow');
	    canvas.renderAll();
	}
    },


    drawEntirePlayerZone: function(){

	var heights_px = this.calculatePlayerZoneSizes();
	var plr_top_cumulator = this.playersZoneTopPx;
	
	for (aa=0; aa<players.length; aa++){
	    drawPlayerZoneBox(players[aa],plr_top_cumulator,heights_px[aa]);// Draws the BOX
	    drawPlayerWords(players[aa],plr_top_cumulator);//Draws all the WORDS
	    plr_top_cumulator += heights_px[aa] + textMarginUnit + stroke_px;
	}
    },


    calculatePlayerZoneSizes: function(){
	var nPlayers = players.length;
	nLettersPlayer = [];
	nLettersTotPlayed = 0;
	
	//count the number of letters each player has, and total letters used within words
	for(i=0; i<nPlayers; i++){
	    nLettersPlayer[i] = 0;
	    for(j=0; j<players[i].words.length; j++){
		nLettersPlayer[i] += players[i].words[j].length;
	    }
	    nLettersTotPlayed += nLettersPlayer[i];
	}

	//determine total amount of height contained within players' zone boxes
	section_height = myZoneHeight - this.playersZoneTopPx;
	zones_sum_height = section_height - nPlayers * stroke_px - (nPlayers-1)*textMarginUnit - marginUnit;
	basic_height = getTileSize() + 4*marginUnit;
	shareable_height = zones_sum_height - nPlayers * basic_height;

	zoneHeightPlayer = [];
	for(i=0; i<nPlayers; i++){
	    //now, we don't want to go dividing by zero if it's a new game with nothing played!!
	    var hRatio = 0;
	    if(nLettersTotPlayed){
		hRatio = nLettersPlayer[i]/nLettersTotPlayed;
	    }else{
		hRatio = 1 / nPlayers;
	    }

	    zoneHeightPlayer[i] = basic_height + Math.round( hRatio * shareable_height );
	}

	return zoneHeightPlayer;
    },


    drawPlayerZoneBox: function(myplayer, mytop, myheight){

	var zoneBox = new fabric.Rect({
	    left: marginUnit,
	    top: mytop,
	    fill: bg_col,
	    stroke: myplayer.color,
	    strokeWidth: stroke_px,
	    width: myZoneWidth-2*marginUnit-stroke_px,
	    height: myheight,
	});

	var plrName = new fabric.Text(myplayer.name,{
	    left: 4*marginUnit,
	    top: mytop - textMarginUnit,
	    fontSize: 2*textMarginUnit,
	    textBackgroundColor: bg_col,
	    fill: myplayer.color,
	});

	var plrZone = new fabric.Group([zoneBox,plrName],{
	    hasControls: false,
	    hasBorders: false,
	    lockMovementX: true,
	    lockMovementY: true
	});

	canvas.sendToBack(plrZone);
    },


    // for example player.words : [[23,14,11],[44,12,13,19,4]]
    drawPlayerWords: function(myplayer, mytop){
	var h_space_word = getTileSize() * 0.6;//define a constant: additional horizonal spacing pixels to use for a space between words
	var h_spacer = getTileSize() * 1.04;
	var v_spacer = getTileSize() * 1.12;
	var x_plotter_R = 2*marginUnit; //this is just defining a constant, the x-coordinate of drawing to set upon "carriage return"
	var x_plotter = x_plotter_R;
	var y_plotter = mytop + 1.8*marginUnit;
	for (i=0; i<myplayer.words.length; i++){//LOOP thru all the player's words...
	    var lettersOfThisWord = [];
	    for (j=0; j<myplayer.words[i].length; j++){//LOOP thru the letters of one specific word...
		var thisLetterIndex = myplayer.words[i][j];
		var thisTile = TileArray[thisLetterIndex];
		//move the relevant tile (already existing on the canvas) to location...
		thisTile.set({
		    left: x_plotter,
		    top: y_plotter
		});
		
		canvas.remove(thisTile);
		modifyTileObject(thisTile,"flipped");//TODO: delete this line of code it should not be required.

		lettersOfThisWord[j]=thisTile;
		
		x_plotter += h_spacer;
	    }

	    //at a completion of the inner loop, a word has just been drawn on canvas
	    var PlayerWordGRP = new fabric.Group( lettersOfThisWord, {
		hasControls: false,
		hasBorders: false
	    });
	    
	    canvas.add(PlayerWordGRP);
	    x_plotter+=h_space_word;
	    
	    //word wrap handler
	    //first check if the player has more words...
	    var upcomingWord = myplayer.words[i+1]; 
	    if(upcomingWord){
		if(x_plotter+(h_spacer*upcomingWord.length)>myZoneWidth - marginUnit){
		    y_plotter+= v_spacer;
		    x_plotter=x_plotter_R;
		}
	    }
	}
	//record the coordinates at which to start word spelling...
	snDraw.Game.Spell.x_first_letter = x_plotter;
	snDraw.Game.Spell.y_first_letter = y_plotter;
    }

};
