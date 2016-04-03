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
		var StolenTile = snDraw.Game.TileArray[removed_word_tileIDs[j]];
		this.TileGroupsArray[PIi][WIi].remove(StolenTile);		
		//place individual tiles back on the canvas in location
		StolenTile.set({
		    left: Stolen_x_base + snDraw.Game.h_spacer * j,
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
	    var X_left_offset = 0;//
	    var X_right_offset = 0;//xs

	    var y_plotter = 200;//player.y_first_word;
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
    }
};
