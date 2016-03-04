
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
    dark_background: undefined,
    bg_col: undefined,
    fg_col: undefined,

    //member objects (the point with these is that they contain fabric objects and are not native variables):
    TileArray: [],
    TileGroupsArray: [],//not convinced we need this...

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
	snDraw.Game.Zones.drawEntirePlayerZone();//next draw all the players word zones
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
	    
	    var myTile = this.generateTileObject(tileset[i], i);//here is the BUSINESS code to create the Fabric object for a tile
	    
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
	snDraw.Game.Zones.playersZoneTopPx = Math.round(this.unusedTilesBottomPx + this.marginUnit);
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
	if(tile.status == "skeletal"){this.modifyTileObject(myNewTileObj,"skeletal");}
	if(tile.status == "partial"){this.modifyTileObject(myNewTileObj,"partial");}
	if(tile.status == "shadow"){this.modifyTileObject(myNewTileObj,"shadow");}

	return myNewTileObj;
    },


    modifyTileObject: function(myTile,to_state,options){
	myTile.visual = to_state;
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
			//TODO: this may be inefficient. Actually, I think it is necessary, as whose to say when a single flipevent will happen.
			snDraw.Game.Spell.recolourAll(snDraw.Game.Spell.ListAllVisibleTilesOf(myTile.letter));

			return true;
		    }else{
			return false;
		    }
		}
	    });
	    snDraw.setFrameRenderingTimeout (3000);//the correspondence is not exact, but this should allow the custom animation to play through...
	}

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
	else if(to_state=="ACTIVE"){
	    myTile.item(1).setFill('red');
	    myTile.item(0).setFill('yellow');
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

	snDraw.setFrameRenderingTimeout (100);//as an alternative to canvas.renderAll()
    },

    //wrapper for the function above (is it actually necessary?)
    animateTileFlip: function(flipping_player_i, tile_id){
	var TargetTile = this.TileArray[tile_id];
	var targetTileData = tileset[tile_id];
	targetTileData.status="turned";//whilst the status change is immediate, the animation causes delay
	this.modifyTileObject(TargetTile, "flipping",{player_i:flipping_player_i,time:2});
    },


    //this is my most complex function, it uses recursion to achieve a letter-by-letter animation.
    drawSingleCapturedWord: function(myplayer, word_index, animate){
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
	    onComplete: function(){
		snDraw.Game.makeTilesDraggableGroup(LettersOfThisWord, myplayer, word_index);
	    }
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
    removeWordsAndRewrap: function(RemovalWordList){

	console.log("call of removeWordsAndRewrap", JSON.stringify(RemovalWordList));
	
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

	for (var i=0; i<players.length; i++){
	    this.TileGroupsArray[i].clean(undefined);
	    players[i].words.clean(undefined);
	    console.log("The state of the data structures of player "+ i +" is:", players[i].words, this.TileGroupsArray[i]);
	}

	//at this point, it should be possible to see a word converted to consituent letters

    },

    //this function removes an arbitrary set of words, indexed by player and within that by word index.
    animateRepositionPlayerWords: function(player){

	var x_plotter = this.x_plotter_R;
	var y_plotter = player.y_first_word;
	var word_set = player.words;
	var word_GRPs = this.TileGroupsArray[player.index];

	for (var i=0; i<word_set.length; i++){

	    var x_span_word = this.h_spacer * word_set[i].length;

	    //if this word will run over the end of the line, do a carriage return...
	    if( this.xCoordExceedsWrapThreshold(x_plotter + x_span_word)){
		y_plotter += this.v_spacer;
		x_plotter = this.x_plotter_R;
	    }
	    
	    //now its position is determined; animate it into position.
	    console.log("Attempting to animate ", word_GRPs[i], " from ", word_GRPs ,"(element "+i+")");
	    snDraw.moveSwitchable(word_GRPs[i], true, snDraw.ani.sty_Resize,{
		left: x_plotter,
		top: y_plotter
	    });

	    //move the plotter along, given the placing of the word...
	    x_plotter = this.h_space_word + x_span_word;
	}

	//interate through all player words, applying the rewrapping. This should be animated
	// CONSIDER that the rewrapping animation should be much slower than the SNATCH animation.
	// consider how this relates to the above purge (before or after??)
	// consider conflicting (overlapping) animating commands from both zone resizeing and wrap handling. These need to be consolidated.

	/*
	//CODE taken from elsewhere
	//animate the words, if present...
	var MyWordGrp = snDraw.Game.TileGroupsArray[myZone.player.index];
	if(MyWordGrp.length > 0){
	//re-determine height shift by considering first word...

	var DY = (myZone.zone_top + 1.8 * snDraw.Game.marginUnit) - MyWordGrp[0].getTop();
	//hack to adjust the location for upcoming animation:
	myZone.player.y_first_word += DY;
	myZone.player.y_next_word += DY;

	// j index used below, note the nested loop...
	for (var j=0; j<MyWordGrp.length; j++){//loop through the player's words
	snDraw.moveSwitchable(MyWordGrp[j], true, snDraw.ani.sty_Resize,{
	top: MyWordGrp[j].getTop() + DY
	});
	}
	}
	*/ 
    },

    xCoordExceedsWrapThreshold: function(x_coord){
	return (x_coord > myZoneWidth - this.marginUnit);
    }

};
