snCore.Words = {

    //member objects
    TileGroupsArray: [],


    MoveWordsIntoRectangleSpace: function(words_list_as_tileIDs, WordArray, Bounds, Spacings, justification, b_animate){

	//get the coordinates for the arrangement
	var myArrangement = this.GenWordArrangement(words_list_as_tileIDs, Bounds, Spacings, justification);

	//move all words to those coordinates.
	for (var i = 0; i < WordArray.length; i++){//this will run through the words to move...
	    snCore.Basic.moveSwitchable(WordArray[i], b_animate, snCore.Basic.ani.sty_Resize, myArrangement.coords[i]);
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
	    snCore.Basic.moveSwitchable(WordGroup[i], B_animation, ani_sty, Arrangement.coords[i]);
	    // aggressively bring words to front, which ensures all clicks land on them (as well as aesthetic)
	    WordGroup[i].bringToFront();
	}
    },

    AnimateWordCapture: function(player_index, word_index, Coords){
	var Spacings = snCore.Tile.dims;
	var word_length = players[player_index].words[word_index].length;
	var w_width_px = this.word_width_px(word_length, Spacings);
	
	var ZoneProperties = snCore.Zones.getZoneProperties("player");
	var wrapCoords = this.wordTilesWrap(Coords, ZoneProperties.WordBounds, Spacings, w_width_px);
	if(wrapCoords){
	    Coords = wrapCoords;
	}

	var word_by_TIDs = players[player_index].words[word_index];

	var TargetCoords_clone = {left: Coords.left, top: Coords.top};
	var onComplete_groupLetters = function(){
	    var WordGrp = snCore.Words.WordAsTileGroupAtOrigin(player_index, word_index, false, Spacings);
	    //move into position...
	    // remember, one of the benefits of this 'moveSwitchable' function is to remove/re-add for D&D zone behaviour
	    snCore.Basic.moveSwitchable(WordGrp, false, null, TargetCoords_clone);
	};

	var waveAnimateContext_WordTA = function (i){
	    
	    var TID = word_by_TIDs[i];
	    var ThisTile = snCore.Tile.TileArray[TID];
	    var my_animate_onComplete = (i == word_length-1) ? onComplete_groupLetters : true;
	    snCore.Basic.moveSwitchable(ThisTile, my_animate_onComplete, snCore.Basic.ani.sty_Sing, Coords);
	    Coords.left += Spacings.tslg; 

	    i++;
	    if(i < word_length){
		setTimeout(function(){waveAnimateContext_WordTA(i);}, snCore.Basic.ani.sty_Sing.duration * 0.3);
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
		var TileObject = snCore.Tile.generateTileObject(tileset[TID], TID);
	    }else{
		var TileObject = snCore.Tile.TileArray[TID];
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
	snCore.Words.TileGroupsArray[player_index].push(WordGRP);
	return WordGRP;
    },

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

    // This non-side-effect function transforms an *Arrangement* into a
    // a new *Arrangement with the height set (i.e. relevant to a zone)
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

	for (var i = 0; i < snCore.Zones.Unclaimed.playerslist.length; i++){

	    var player_i = snCore.Zones.Unclaimed.playerslist[i];
	    var VARIANT_unclaimed_words_chunk = undefined;

	    if (TYPE_DIRECTIVE == "via Grp"){
		VARIANT_unclaimed_words_chunk = snCore.Words.TileGroupsArray[player_i.index]; 

	    }else if(TYPE_DIRECTIVE == "via TID"){
		VARIANT_unclaimed_words_chunk = player_i.words;
	    } 

	    VARIANT_unclaimed_words_list = VARIANT_unclaimed_words_list.concat(VARIANT_unclaimed_words_chunk);
	}

	return VARIANT_unclaimed_words_list;
    }

};
