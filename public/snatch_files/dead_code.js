
<"taken from snDraw-Game-Spell.js">



    nActiveLetters: 0,
    n_letters_unwrap: undefined,

    prev_DT_rdNt: 0,//previous Drag Tile's shift in tile position...

    destDragTileIndex: 0,

    //member objects & arrays of Fabric objects:
    ActiveLetterSet: [],//the set of yellow letters










    //shuffles letters horizonally, making a gap
    shuffleAnagramDrag: function(dTile){
	var daT = dTile.activeGrpIndex;//dragging tile's index within the Active Letter Set
	DT_dx = dTile.xPickup - dTile.get('left');
	DT_dNt = -(DT_dx) / snDraw.Game.h_spacer;// dTile is the tile object being dragged
	DT_rdNt = Math.round(DT_dNt);
	//apply limitation to DT_rdNt
	max_DT = (this.nActiveLetters-1)-daT;
	min_DT = -daT;
	DT_rdNt = Math.min(max_DT, DT_rdNt);
	DT_rdNt = Math.max(min_DT, DT_rdNt);

	this.destDragTileIndex = daT+DT_rdNt;

	if(DT_rdNt != this.prev_DT_rdNt){
	    
	    //within the context of a context-defined function, instead of keyword this we must use full reference 'snDraw.Game.Spell'
	    function letterShuffler(prev_DT_rdNt, DT_rdNt){
		pos=true;
		console.log("transition", prev_DT_rdNt, DT_rdNt);
		anT = Math.max(DT_rdNt, prev_DT_rdNt);
		if(anT<=0){//tile is relatively negative to DragTile
		    anT = Math.min(DT_rdNt, prev_DT_rdNt);
		    pos=false;
		}
		

		var AnimateTile = snDraw.Game.Spell.ActiveLetterSet[daT+anT];
		
		shiftRight = prev_DT_rdNt > DT_rdNt;
		destC = (daT+anT) + shiftRight-pos;
		destPx = destC * snDraw.Game.h_spacer + snDraw.Game.Spell.x_next_letter;

		snDraw.moveSwitchable(AnimateTile, true, snDraw.ani.sty_Anag,{
		    left: destPx
		});

	    }

	    //these lines of code handle a transition of more than 1 tile
	    //probably due to slow rendering
	    Trans_inc = DT_rdNt > this.prev_DT_rdNt ? 1 : -1;
	    var imbetweener=this.prev_DT_rdNt;
	    while(imbetweener != DT_rdNt){
		letterShuffler(imbetweener,imbetweener+Trans_inc);
		imbetweener+=Trans_inc;
	    }	    

	    this.prev_DT_rdNt = DT_rdNt;

	}
    },

    //at the end of a drag event (anagram=>no new letter added) reshuffle the array to reflect...
    shuffleAnagramRelease: function(dTile){
	//Todo:
	var daT = dTile.activeGrpIndex;//dragging tile's index within the Active Letter Set
	this.ActiveLetterSet.move(daT,this.destDragTileIndex)

	dTile.setTop(this.y_next_letter);
	destPx = this.destDragTileIndex * snDraw.Game.h_spacer + this.x_next_letter;
	
	snDraw.moveSwitchable(dTile, true, snDraw.ani.sty_Anag,{
	    left: destPx
	});

	//make sure all the stored indecies for position in activeletter set reflect new ordering
	for(var i=0;i<this.nActiveLetters;i++){
	    this.ActiveLetterSet[i].activeGrpIndex = i;
	}
	this.prev_DT_rdNt = 0;//needs reset so as not to use old data
    },

    //shuffles letters horizonally, making a gap
    shuffleInsertionDrag: function(){
    },

    //include a new letter in the ActiveLetterSet
    //TODO: delete this function (just keep for now for reference)
    addLetter_OLD: function(MyTile){
	this.ActiveLetterSet.push(MyTile);
	MyTile.activeGrpIndex=this.nActiveLetters;
	this.nActiveLetters++;
	x_loco = this.x_next_letter + (this.nActiveLetters-1) * snDraw.Game.h_spacer;
	//check to see if Wrap is necessary (pixel condition and not already wrapped condition)
	if( snDraw.Game.xCoordExceedsWrapThreshold(x_loco + snDraw.Game.h_spacer) && (this.n_letters_unwrap===undefined)){
	    //retain how the word must be reduced for unwrap to occur
	    this.n_letters_unwrap = this.nActiveLetters-2; //(minus 2 for hysteresis)
	    //shift all letters
	    this.x_next_letter = snDraw.Game.x_plotter_R;
	    this.y_next_letter += snDraw.Game.v_spacer;
	    this.rebaseSpellerLocation();
	}
	else{//behaviour contigent on wrap NOT happening:
	    snDraw.moveSwitchable(MyTile, true, snDraw.ani.sty_Sing,{
		left: x_loco,
		top: this.y_next_letter
	    });
	}
	snDraw.Game.modifyTileObject(MyTile,"ACTIVE");
    },




















    
    //remove a letter from the ActiveLetterSet
    removeLetter_OLD: function(MyTile){

	this.nActiveLetters--;

	//TODO: must remove it from the array ActiveLetterSet
	this.ActiveLetterSet.splice(MyTile.activeGrpIndex,1);
	MyTile.activeGrpIndex = undefined;//it no longer has such an index.

	//potentially unwrap
	if(this.n_letters_unwrap !== undefined){
	    if(this.nActiveLetters <= this.n_letters_unwrap){//detect that word length has reduced so that it can all be moved back to the previous line...
		this.n_letters_unwrap = undefined;
		this.restoreBasePosition();
		this.rebaseSpellerLocation();
	    }
	}

	//make sure all the stored indecies for position in activeletter reflect removal    
	for(var i=0;i<this.nActiveLetters;i++){
	    this.ActiveLetterSet[i].activeGrpIndex = i;
	    this.ActiveLetterSet[i].setLeft(this.x_next_letter + i * snDraw.Game.h_spacer);
	    //whenever namually changing tile coordinates, must do this to update drag zone
	    canvas.remove(this.ActiveLetterSet[i]);
	    canvas.add(this.ActiveLetterSet[i]);
	}


	//remove the event listener for that tile...
	MyTile.off('moving');

	//move the tile to be removed back to wherever it was before
	snDraw.moveSwitchable(MyTile, true, snDraw.ani.sty_Sing,{
	    left: MyTile.x_availableSpace,
	    top: MyTile.y_availableSpace
	});
	snDraw.Game.modifyTileObject(MyTile,"flipped");

    },

    rebaseSpellerLocation: function(){
	for(var i=0; i<this.nActiveLetters; i++){//for each TILE making up the word...
	    var IterTile = this.ActiveLetterSet[i];
	    var x_loco = this.x_next_letter + i * snDraw.Game.h_spacer;
	    IterTile.set({
		left: x_loco,
		top: this.y_next_letter
	    });
	    canvas.remove(IterTile);
	    canvas.add(IterTile);
	}
    },

    //OLD code - to be deleted...
    //the concept of this function is no longer relevant...
    /*
    getTileIndecesFromSpeller_OLD: function(){
	var tile_indeces_of_word = [];
	for(var i=0; i<this.nActiveLetters; i++){//for each TILE making up the word...
	    //run through the Letter objects to extract the word's tile indeces into an array
	    var MyTile = this.ActiveLetterSet[i];
	    tile_indeces_of_word[i] = MyTile.tileID;
	}
	return tile_indeces_of_word;
    },
    */

    //clear the speller (the letters animate back into position)
    //optional 2nd parameter excludes letters from animation (their animation is handled by the new word formation)
    ClearWordFromSpeller: function(replace_tiles_on_grid,mid_spell_snatch){
    	
	for(var i=0; i<this.nActiveLetters; i++){//for each TILE making up the word...
	    //run through the Letter objects to extract the word's tile indeces into an array
	    var MyTile = this.ActiveLetterSet[i];
	    var letter_in_other_snatch = false;//default value, is parameter not provided.
	    if(mid_spell_snatch){
		letter_in_other_snatch = contains(mid_spell_snatch,MyTile.tileID);
	    }
	    if((replace_tiles_on_grid)&&(!letter_in_other_snatch)){

		//case animation spec and add render
		
		snDraw.moveSwitchable(MyTile, true, snDraw.ani.sty_Sing, {
		    left: MyTile.x_availableSpace,
		    top: MyTile.y_availableSpace
		});

	    }//restore tiles on grid

	    
	    //restore tile from it's special states when it's being used to spell a word
	    MyTile.activeGrpIndex = undefined;
	    MyTile.off('moving');
	    snDraw.Game.modifyTileObject(MyTile,"flipped");
	}//for loop
	
	//finally, reset plotters back the the original values (TODO: is this necessary, they will be immediately changed back if word is accepted)
	this.restoreBasePosition();
	this.ActiveLetterSet = [];
	this.nActiveLetters = 0;
	this.prev_DT_rdNt = 0;//previous Drag Tile's shift in tile position...
	this.n_letters_unwrap=undefined;//reset the record of wrap occuring
    },





















    ActiveLetters_tile_ids: function(){
	var ret = [];
	for(var i=0; i<this.nActiveLetters; i++){
	    ret.push(this.ActiveLetterSet[i].tileID);	
	}
	return ret;
    },









<"taken from snatch-client.js">

    //This code is no longer relevant with the skeletal spell...

    //The snatch will potentially impact on the 'speller' of all players
    if(client_is_snatcher){
	//clear the speller of the snatching player (clear those yellow letters)
	snDraw.Game.Spell.ClearWordFromSpeller(false);//remove it from the speller (clears up the speller)
    }else{
	//determine if the other player's snatch affects the client player's spell (are letters consumed?)
	var overlap = commonElements(tile_indices,snDraw.Game.Spell.ActiveLetters_tile_ids()).length != 0;
	if(overlap){//there is some overlap between speller and snatched word
	    snDraw.Game.Spell.ClearWordFromSpeller(true,tile_indices);//division of letters in the speller between the snatched word and the spare letters area
	}
    }



<"taken from snDraw-Game-Mouse.js">
{
    // let this be turn a letter
    var target_tile_index = snDraw.Game.visuallyNextUnturnedTileIndex();
    if(target_tile_index !== undefined){
	tileTurnObj = {
	    playerIndex: client_player_index,
	    tileID: target_tile_index
	}
    }else{
	console.log("TOAST: there are no more unturned tiles for turning over");    
    }
}

	    else if(tileset[my_tile_index].status=="unturned"){
		tileTurnObj = {
		    playerIndex: client_player_index,
		    tileID: my_tile_index
		}
		TILE_TURN_REQUEST(tileTurnObj);//for an unturned tile, always message to flip
	    }




<"taken from snDraw-Game.js">


    visuallyNextUnturnedTileIndex: function(){
	var grid = snDraw.Game.TileGrid;
	for (var r=this.Grid_yPx.length-1; r>=0; r--){
	    for (var c=this.Grid_xPx.length-1; c>=0; c--){
		if(grid[r][c]!=undefined){
		    if(grid[r][c]!=null){
			var TID = grid[r][c];
			if (tileset[TID].status == 'unturned'){
			    return TID;
			}
		    }
		}
	    }
	}
    },


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
			//TODO: this may be inefficient. Actually, I think it is necessary, as who'se to say when a single flip event will happen.
			snDraw.Game.Spell.recolourAll(snDraw.Game.Spell.ListAllVisibleTilesOf(myTile.letter));

			return true;
		    }else{
			return false;
		    }
		}
	    });
	    snDraw.setFrameRenderingTimeout (3000);//the correspondence is not exact, but this should allow the custom animation to play through...
	}

    //wrapper for the function above (is it actually necessary?)
    animateTileFlip: function(flipping_player_i, tile_id){
	var TargetTile = this.TileArray[tile_id];
	var targetTileData = tileset[tile_id];
	targetTileData.status="turned";//whilst the status change is immediate, the animation causes delay
	this.modifyTileObject(TargetTile, "flipping",{player_i:flipping_player_i,time:2});
    },
















///upon server assertion that a letter is turned over
socket.on('tile turn assert', function(tileDetailsObj){
    var flipping_player_i = tileDetailsObj.playerIndex;
    var tile_id = tileDetailsObj.tileID;

    snDraw.Game.animateTileFlip(flipping_player_i, tile_id);
});





<"from snDraw.js">

    frame_rendering_timeout: undefined,
    setFrameRenderingTimeout: function(duration){
	var already_running = this.frame_rendering_timeout !== undefined;
	
	if(already_running){
	    clearTimeout(this.frame_rendering_timeout);
	}
	this.frame_rendering_timeout = setTimeout(function(){snDraw.frame_rendering_timeout = undefined;}, duration*4);//fudge factor

	if(!already_running){
	    this.startScreenFrameDrawing();//this ensures another chain of recusive function calls will not happen but timeout can still be adjusted.
	}
    },

