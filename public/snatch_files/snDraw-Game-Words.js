snDraw.Game.Words = {

    //member objects
    TileGroupsArray: [],


    //this is my most complex function, it uses recursion to achieve a letter-by-letter animation.
    drawSingleCapturedWord: function(myplayer, word_index, animate){
	var x_plotter = myplayer.x_next_word;
	var y_plotter = myplayer.y_next_word;

	var word_as_tile_index_array = myplayer.words[word_index]; 
	var word_length = word_as_tile_index_array.length;

	//remove any grid references of any tiles:
	snDraw.Game.Grid.remove_Tile_references_from_grid(word_as_tile_index_array);

	//word wrap handler
	//if this word will run over the end of the line, do a carriage return...
	if( this.xCoordExceedsWrapThreshold(x_plotter + (snDraw.Game.h_spacer * word_as_tile_index_array.length))){
	    y_plotter += snDraw.Game.v_spacer;
	    x_plotter = snDraw.Game.x_plotter_R;
	}

	var LettersOfThisWord = [];//this is an array of Fabric objects (the tiles)

	//generates a new animation properties object which includes a callback to group the relevant set of letter tiles upon completion of the animation
	var onComplete_groupLetters = function(){
	    snDraw.Game.Words.makeTilesDraggableGroup(LettersOfThisWord, myplayer, word_index);
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
		if(!animate){snDraw.Game.Words.makeTilesDraggableGroup(LettersOfThisWord, myplayer, word_index);}//this only gets called via a later callback in the case of animation (see above)

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
	snDraw.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
    },


    //given the possibility that snatching a word from a player will leave a gap, this function runs through the words
    //drawing them one after another to avoid any gap.
    //in the case where this player has just snatched a word, the final word in their list will be animating into place.
    //Thus function should not attempt to animate it (which would be duplication), hence the flag...
    animateRepositionPlayerWords: function(player_index,exclude_final_word_reposition){

	//being used on a real player...
	if (player_index !== null){
	    var X_left_offset = snDraw.Game.x_plotter_R;
	    var X_right_offset = snDraw.Game.marginUnit;
	    var player = players[player_index];
	    var y_plotter = player.y_first_word;
	    var word_GRPs = this.TileGroupsArray[player_index];
	    var r_offset = snDraw.Game.marginUnit;
	    //being used to put words into the unclaimed zone
	}else{
	    var X_left_offset = snDraw.Game.Zones.uc_Zone_words_L;
	    var X_right_offset = snDraw.Game.Zones.uc_Zone_words_R;
	    var y_plotter = snDraw.Game.Zones.uc_Zone_words_T;

	    var word_GRPs = [];
	    for (var i = 0; i < disconnected_players.length; i++){
		var dPIi = disconnected_players[i].index;
		word_GRPs.concat(this.TileGroupsArray[dPIi]);
	    }
	}
	var x_plotter = X_left_offset;

	var n_words = word_GRPs.length;
	if(exclude_final_word_reposition){n_words--;}

	for (var i = 0; i < n_words; i++){

	    var x_span_word = snDraw.Game.h_spacer * word_GRPs[i].getObjects().length;

	    //if this word will run over the end of the line, do a carriage return...
	    if( this.xCoordExceedsWrapThreshold(x_plotter + x_span_word, X_right_offset)){
		y_plotter += snDraw.Game.v_spacer;
		x_plotter = X_left_offset;
	    }
	    
	    //now its position is determined; animate it into position.
	    snDraw.moveSwitchable(word_GRPs[i], true, snDraw.ani.sty_Resize,{
		left: x_plotter,
		top: y_plotter
	    });

	    //move the plotter along, given the placing of the word...
	    x_plotter += snDraw.Game.h_space_word + x_span_word;
	}

	if (player_index !== null){
	    //set the saved coordinates back as modified...
	    player.x_next_word = x_plotter;
	    player.y_next_word = y_plotter;
	}
    },

    xCoordExceedsWrapThreshold: function(x_coord, r_offset){//second parameter optional
	if(!r_offset){
	    var r_offset = snDraw.Game.marginUnit;
	}
	return (x_coord > snDraw.canv_W - r_offset);
    },


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NEW FUNCTIONS HERE...

    //based upon animateRepositionPlayerWords [138]
    MoveWordsIntoRectangleSpace: function(words_list_as_tileIDs, WordArray, Bounds, Spacings, justification, b_animate){

	//get the coordinates for the arrangement
	var myArrangement = this.GenWordArrangement(words_list_as_tileIDs, Bounds, Spacings, justification);

	//move all words to those coordinates.
	for (var i = 0; i < WordArray.length; i++){//this will run through the words to move...
	    snDraw.moveSwitchable(WordArray[i], b_animate, snDraw.ani.sty_Resize, myArrangement.coords[i]);
	}

	//this last bit is just to provide the drawing-coordinates for next word...
	var last_coords = myArrangement.coords.slice(-1)[0];
	var last_word_width_px = myArrangement.word_width_px.slice(-1)[0];
	return {
	    left: (last_coords.left + last_word_width_px + Spacing.wg),
	    top: last_coords.top
	};//coordinates to use for next word...
    },


    MoveWordsIntoArrangement: function(Top, WordBounds, WordGroup, WordArrangement_noH, ani_sty){
	// place the words in the zone
	var Arrangement = this.WordArrangementSetHeight(WordArrangement_noH, WordBounds, Top);
	// note the difference between "WordGroup.length" and "Arrangement.coords.length".
	// The first excludes and animating new word which isn't yet formed into a Group.
	var B_animation = (ani_sty != null);
	for (var i = 0; i < WordGroup.length; i++){
	    snDraw.moveSwitchable(WordGroup[i], B_animation, ani_sty, Arrangement.coords[i]);
	    // aggressively bring words to front, which ensures all clicks land on them (as well as aesthetic)
	    WordGroup[i].bringToFront();
	}
    },


    AnimateWordCapture: function(player_index, word_index, Coords){
	var Spacings = snDraw.Game.tileSpacings;
	var word_length = players[player_index].words[word_index].length;
	var w_width_px = this.word_width_px(word_length, Spacings);
	
	var ZoneProperties = snDraw.Game.Zones.getZoneProperties("player");
	var wrapCoords = this.wordTilesWrap(Coords, ZoneProperties.WordBounds, Spacings, w_width_px);
	if(wrapCoords){
	    Coords = wrapCoords;
	}

	var word_by_TIDs = players[player_index].words[word_index];

	var TargetCoords_clone = {left: Coords.left, top: Coords.top};
	var onComplete_groupLetters = function(){
	    var WordGrp = snDraw.Game.Words.WordAsTileGroupAtOrigin(player_index, word_index, false, Spacings);
	    //move into position...
	    WordGrp.set(TargetCoords_clone);//messy syntax in lieu of whatever jquery clones an object...
	};

	var waveAnimateContext_WordTA = function (i){
	    
	    var TID = word_by_TIDs[i];
	    var ThisTile = snDraw.Game.TileArray[TID];
	    var my_animate_onComplete = (i == word_length-1) ? onComplete_groupLetters : true;
	    snDraw.moveSwitchable(ThisTile, my_animate_onComplete, snDraw.ani.sty_Sing, Coords);
	    Coords.left += Spacings.tslg; 

	    i++;
	    if(i < word_length){
		setTimeout(function(){waveAnimateContext_WordTA(i);}, snDraw.ani.sty_Sing.duration * 0.3);
	    }
	};
	waveAnimateContext_WordTA(0);
    },

    // this is mostly a side-effects only function...
    WordAsTileGroupAtOrigin: function(player_index, word_index, B_create_tiles, Spacings){
	//extract the tileIDs of the tiles that make up this word, and create a tile object array
	// simultaneously remove singly tiles from the canvas. They will be put in a group, and the group will go on canvas
	var WordTileArray = [];
	var word_by_TIDs = players[player_index].words[word_index];

	for (var k = 0; k < word_by_TIDs.length; k++){

	    var TID = word_by_TIDs[k];
	    if(B_create_tiles){
		var TileObject = snDraw.Game.generateTileObject(tileset[TID], TID);
	    }else{
		var TileObject = snDraw.Game.TileArray[TID];
	    }
	    canvas.remove(TileObject);
	    WordTileArray.push(TileObject);

	    //arrange into word based at origin
	    TileObject.set({
		left: (k * Spacings.tslg),
		top: 0
	    });
	}
	
	//Form the Group for the word...
	var WordGRP = new fabric.Group( WordTileArray, {
	    left: 0, 
	    top: 0,
	    hasControls: false,
	    hasBorders: false
	});
	canvas.add(WordGRP);

	//Global references forwards and backwards
	WordGRP.OwnerPlayer = players[player_index];
	snDraw.Game.Words.TileGroupsArray[player_index].push(WordGRP);
	return WordGRP;
    },

    // drawSingleCapturedWord & animateRepositionPlayerWords
    GenWordArrangement: function(words_list_as_tileIDs, HorizonalBounds, Spacings, justification){

	// Array 'breaks' holds the indices of the last word of each line
	var Arrangement = {coords: [], word_width_px: [], breaks: []};

	var x_plotter = HorizonalBounds.left;
	var y_plotter = 0;

	var N_words = words_list_as_tileIDs.length;

	//function used internally
	var justify_final_word_row = function(spare_px){
	    var j_first = 0;
	    if(Arrangement.breaks.length > 1){
		j_first = Arrangement.breaks.slice(-2)[0] + 1;//first word of next line...
	    }
	    var j_final = Arrangement.breaks.slice(-1)[0];

	    for (var j = j_first; j <= j_final; j++){//this will run through the words to shift
		if(justification == "center"){
		    Arrangement.coords[j].left += (spare_px/2);
		}else if(justification == "right"){
		    Arrangement.coords[j].left += spare_px;
		}
	    }
	};

	for (var i = 0; i < N_words; i++){
	    var n_tile = words_list_as_tileIDs[i].length;

	    //determine word width on screen	    
	    var w_width_px = this.word_width_px(n_tile, Spacings);
	    Arrangement.word_width_px.push(w_width_px);
	    
	    //determine if wrap necessary
	    var wrapCoords = this.wordTilesWrap({left: (x_plotter-Spacings.wg), top: y_plotter}, HorizonalBounds, Spacings, w_width_px);
	    if(wrapCoords){//this is if wrap is happening
		Arrangement.breaks.push(i-1);

		//potentially shuffle the words along in accordance with the requested justification
		justify_final_word_row(HorizonalBounds.right - (x_plotter - Spacings.wg));

		//now adjust the plotter coords along...
		x_plotter = wrapCoords.left;
		y_plotter = wrapCoords.top;
	    }

	    //add the coordinate that has been determined....
	    Arrangement.coords.push({
		left: x_plotter,
		top: y_plotter
	    });

	    //increment the plotter to the pixel which marks the end of the word
	    x_plotter += w_width_px + Spacings.wg;
	}

	//take all the wrap actions for the final word
	if(N_words > 0){
	    Arrangement.breaks.push(N_words-1);
	    justify_final_word_row(HorizonalBounds.right - (x_plotter - Spacings.wg));//the value passed is "space px"
	}
	return Arrangement;
    },

    WordArrangementSetHeight: function(Arrangement, WordBounds, Top){
	// Arrangement
	// data...
	// Arrangement = {coords: [], word_width_px: [], breaks: []};
	var height_fixed_coord_set = []; 
	var WordsTopPx = Top + WordBounds.topPadding;
	for (var i = 0; i < Arrangement.coords.length; i++){
	    height_fixed_coord_set[i] = {
		left: Arrangement.coords[i].left,
		top: (Arrangement.coords[i].top + WordsTopPx)
	    }

	}
	return {coords: height_fixed_coord_set,
		word_width_px: Arrangement.word_width_px,
		breaks: Arrangement.breaks
	       };
    },


    word_width_px: function(n_letters, Spacings){
	return n_letters * Spacings.ts + (n_letters -1) * Spacings.lg;
    },


    //the function assumes it is passed a coordinate which does not include a "trailing space"
    wordTilesWrap: function(Coords, HorizonalBounds, Spacings, my_width_px){
	if(Coords.left + Spacings.wg + my_width_px > HorizonalBounds.right){
	    return {
		left: HorizonalBounds.left,
		top: (Coords.top + Spacings.tsvg)
	    };
	}else{
	    return false;
	}
    },


    getUnclaimedWordsList: function(TYPE_DIRECTIVE){

	var VARIANT_unclaimed_words_list = [];

	for (var i = 0; i < snDraw.Game.Zones.Unclaimed.playerslist.length; i++){

	    var player_i = snDraw.Game.Zones.Unclaimed.playerslist[i];
	    var VARIANT_unclaimed_words_chunk = undefined;

	    if (TYPE_DIRECTIVE == "via Grp"){
		VARIANT_unclaimed_words_chunk = snDraw.Game.Words.TileGroupsArray[player_i.index]; 

	    }else if(TYPE_DIRECTIVE == "via TID"){
		VARIANT_unclaimed_words_chunk = player_i.words;
	    } 

	    VARIANT_unclaimed_words_list = VARIANT_unclaimed_words_list.concat(VARIANT_unclaimed_words_chunk);
	}

	return VARIANT_unclaimed_words_list;
    }

};
