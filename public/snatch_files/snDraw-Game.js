
//this file contains the functions that render the game onto the screen

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
    setDarkBackground: function(isDark){
	dark_background = isDark;
	this.bg_col = isDark ? 'black' : 'white';
	this.fg_col = isDark ? 'white' : 'black';

    },

    initialDrawEntireGame: function(){
	this.calculateRenderingDimentionConstants();
	canvas.setBackgroundColor(this.bg_col);
	canvas.clear();	    
	snDraw.Game.Controls.createControls();//draw buttons on the top of the screen
	this.createEveryTileObject_inGridAtTop();//next draw all the unturned tiles underneath
	this.drawEntirePlayerZone();//next draw all the players word zones
	canvas.renderAll();
	TA = this.TileArray;//this is to enable faster debugging
    },

    calculateRenderingDimentionConstants: function(){    //this function relies upon a defined number of tiles, which is only after game state is loaded...
	var N_pixels = myZoneWidth * myZoneHeight;
	var Tile_pixels = N_pixels * this.Ratio_tile / tileset.length;
	var tile_dim = Math.sqrt(Tile_pixels);
	this.tileSize = Math.round(tile_dim);
	
	this.marginUnit = this.tileSize*0.13;
	this.textMarginUnit = this.tileSize*0.2;
	this.stroke_px = Math.round(this.marginUnit * 0.5);
	
	this.h_space_word = this.tileSize * 0.6;//define a constant: additional horizonal spacing pixels to use for a space between words
	this.h_spacer = this.tileSize * 1.04;
	this.v_spacer = this.tileSize * 1.12;
	this.x_plotter_R = 2 * this.marginUnit;

    },

    createEveryTileObject_inGridAtTop: function (){

	var letter_spacing = 0.14;

	//parameters controlling tile spacing in the tile grid
	var tile_space_px = this.tileSize * letter_spacing;
	var XPD=6;//this is the left-px for the tiles grid
	var x_plotter = XPD;
	var y_plotter = 6 + this.tileSize + tile_space_px;

	//now create a fabric object for every tile...
	for (var i=0; i<tileset.length; i++){
	    
	    var myTile = this.generateTileObject(tileset[i],i);//here is the BUSINESS code to create the Fabric object for a tile
	    
	    myTile.set({top:y_plotter,left:x_plotter});
	    this.TileArray[i]=myTile;
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
	
	//it's only upon determining the bottom of the unsed tiles that we can set this variable (and it's done once, right now...)
	this.playersZoneTopPx = Math.round(this.unusedTilesBottomPx + this.marginUnit);
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
	var anon_modifyTileObject = arguments.callee;
	if(to_state=="flipping"){//this will animate the tile...

	    pl_col = players[options.player_i].color;
	    myTile.item(0).setStroke(pl_col);
	    var l_tot = snDraw.Game.tileSize*3.9;
	    myTile.item(0).setStrokeDashArray([0, l_tot]);
	    var fps = 25;
	    var dur = 2;
	    var f_tot = dur*fps;
	    snDraw.AnimationFunction.push({
		R: myTile.item(0),
		count:0,
		frame: function(){
		    this.count++;
		    var s = (this.count/f_tot)*l_tot;
		    this.R.setStrokeDashArray([s, l_tot-s]);
		    if(this.count > f_tot){//animation completed...
			//anon_modifyTileObject(myTile,"flipped");// this is a recursive call of my modifyTileObject function
			snDraw.Game.modifyTileObject(myTile,"flipped");
			return true;
		    }else{
			return false;
		    }
		}
	    });
	    snDraw.setFrameRenderingTimeout (3000);//the correspondence is not exact, but this should allow the custom animation to ply through...
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
	    myTile.item(1).setFill('red');
	    myTile.item(0).setFill('yellow');
	    canvas.renderAll();
	}
    },


    drawEntirePlayerZone: function(){

	this.calculatePlayerZoneSizes();//this sets attributes within the player objects
	var plr_top_cumulator = this.playersZoneTopPx;// the starting value for this variable is the lower edge of the tile zone...

	for (var i=0; i<players.length; i++){
	    players[i].zone_top = plr_top_cumulator;
	    this.drawPlayerZoneBox(players[i]);// Draws the BOX
	    this.drawAllPlayerWords(players[i]);//Draws all the WORDS
	    plr_top_cumulator += players[i].zone_height + this.textMarginUnit + this.stroke_px;
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
	zones_sum_height = section_height - nPlayers * this.stroke_px - (nPlayers-1)*this.textMarginUnit - this.marginUnit;
	basic_height = this.tileSize + 4*this.marginUnit;
	shareable_height = zones_sum_height - nPlayers * basic_height;

	for(i=0; i<nPlayers; i++){
	    //now, we don't want to go dividing by zero if it's a new game with nothing played!!
	    var hRatio = 0;
	    if(nLettersTotPlayed){
		hRatio = nLettersPlayer[i]/nLettersTotPlayed;
	    }else{
		hRatio = 1 / nPlayers;
	    }

	    //this line of code adds the attribute calculated to the relevant player object within the array...
	    players[i].zone_height = basic_height + Math.round( hRatio * shareable_height );
	}
    },


    drawPlayerZoneBox: function(myplayer){

	var zoneBox = new fabric.Rect({
	    left: this.marginUnit,
	    top: myplayer.zone_top,
	    fill: this.bg_col,
	    stroke: myplayer.color,
	    strokeWidth: this.stroke_px,
	    width: myZoneWidth - 2 * this.marginUnit - this.stroke_px,
	    height: myplayer.zone_height,
	});

	var plrName = new fabric.Text(myplayer.name,{
	    left: 4 * this.marginUnit,
	    top: myplayer.zone_top - this.textMarginUnit,
	    fontSize: 2 * this.textMarginUnit,
	    textBackgroundColor: this.bg_col,
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
    drawAllPlayerWords: function(myplayer){
	//since this function is only invoked when first drawing the game for each player, this is the time to set the base coordinates:
	myplayer.x_next_word = this.x_plotter_R;
	myplayer.y_next_word = myplayer.zone_top + 1.8 * this.marginUnit;
	//LOOP thru all the player's words...
	// draw them onscreen
	for (var i=0; i<myplayer.words.length; i++){
	    this.drawSingleCapturedWord(myplayer, i);	
	}

	//this prep's the SPELL class to place letters in the right location
	// it is needed within this function call because the player won't necessarily have any words at the start...
	snDraw.Game.Spell.restoreBasePosition();
    },


    drawSingleCapturedWord: function(myplayer, word_index, animate){
	console.log("called drawSingleCapturedWord");
	var x_plotter = myplayer.x_next_word;
	var y_plotter = myplayer.y_next_word;

	var word_as_tile_index_array = myplayer.words[word_index]; 
	var word_length = word_as_tile_index_array.length;

	//word wrap handler
	//if this word will run over the end of the line, do a carriage return...
	if( this.xCoordExceedsWrapThreshold(x_plotter + (this.h_spacer * word_as_tile_index_array.length))){
	    y_plotter += this.v_spacer;
	    x_plotter = this.x_plotter_R;
	}

	var LettersOfThisWord = [];//this is an array of Fabric objects (the tiles)

	//generates a new animation properties object which includes a callback to group the relevant set of letter tiles upon completion of the animation
	var ani_withGRPcallback = jQuery.extend({
	    onComplete: function(){snDraw.Game.makeTilesDraggableGroup(LettersOfThisWord);}
	}, snDraw.ani.sty_Sing);

	function Recursive_Letters_Loop(i){
	    var this_tile_index = word_as_tile_index_array[i];
	    var ThisTile = snDraw.Game.TileArray[this_tile_index];
	    LettersOfThisWord[i]=ThisTile;

	    //move the relevant tile (already existing on the canvas) to location...
	    snDraw.moveSwitchable(ThisTile, animate, (i == word_length-1) ? ani_withGRPcallback : snDraw.ani.sty_Sing,{
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

		if(!animate){snDraw.Game.makeTilesDraggableGroup(LettersOfThisWord);}//this only gets called via a later callback in the case of animation (see above)

		//when the letter has been moved, these instructions finish it all off
		x_plotter+=this.h_space_word;

		//finally, always at the end of writing a word, record the coordinates for writing a new word...
		myplayer.x_next_word = x_plotter;
		myplayer.y_next_word = y_plotter;

		//this prep's the SPELL class to place letters in the right location
		// it is needed within this function call because this function is called directly by a SNATCH ASSERT
		snDraw.Game.Spell.restoreBasePosition();

	    }
	}
	Recursive_Letters_Loop(0);
    },

    makeTilesDraggableGroup: function(LettersOfThisWord){
	var grp_left = LettersOfThisWord[0].getLeft() - 0.5;
	var grp_top = LettersOfThisWord[0].getTop() - 0.5;
	
	for (var i=0; i<LettersOfThisWord.length; i++){//LOOP thru the letters of one specific word...
	    canvas.remove(LettersOfThisWord[i]);//remove the single tile (after animation) so that it can be readded as a group...
	}

	var PlayerWordGRP = new fabric.Group( LettersOfThisWord, {
	    hasControls: false,
	    hasBorders: false
	});

	PlayerWordGRP.set({
	    left: grp_left,
	    top: grp_top
	});

	canvas.add(PlayerWordGRP);
	canvas.renderAll();
    },

    xCoordExceedsWrapThreshold: function(x_coord){
	return (x_coord > myZoneWidth - this.marginUnit);
    },

    animateTileFlip: function(flipping_player_i, tile_id){
	var TargetTile = this.TileArray[tile_id];
	var targetTileData = tileset[tile_id];
	targetTileData.status="turned";//whilst the status change is immediate, the animation causes delay
	this.modifyTileObject(TargetTile, "flipping",{player_i:flipping_player_i,time:2});
    }

};
