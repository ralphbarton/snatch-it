//this is a container for functions and data for Word creation (the generally yellow bit)...

snDraw.Game.Spell = {

    // a note about players[i].saved_x_plotter // TODO write the note...
    x_next_letter: undefined,
    y_next_letter: undefined,

    nActiveLetters: 0,

    prev_DT_rdNt: 0,//previous Drag Tile's shift in tile position...

    destDragTileIndex: 0,

    //member objects & arrays of Fabric objects:
    ActiveLetterSet: [],//the set of yellow letters

    restoreBasePosition: function(){
	var ClientPlayer = players[client_player_index];
	this.x_next_letter = ClientPlayer.x_next_word;
	this.y_next_letter = ClientPlayer.y_next_word;
    },

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
		

		var animateTile = snDraw.Game.Spell.ActiveLetterSet[daT+anT];
		
		shiftRight = prev_DT_rdNt > DT_rdNt;
		destC = (daT+anT) + shiftRight-pos;
		destPx = destC * snDraw.Game.h_spacer + snDraw.Game.Spell.x_next_letter;

		animateTile.animate('left', destPx, {
		    onChange: function() {
			canvas.renderAll();
		    },
		    easing: fabric.util.ease.easeOutBounce,
		    duration: 200
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
	
	dTile.animate('left', destPx, {
	    onChange: function() {
		canvas.renderAll();
	    },
	    easing: fabric.util.ease.easeOutBounce,
	    duration: 100
	});

	//make sure all the stored indecies for position in activeletter set reflect new ordering
	for(i=0;i<this.nActiveLetters;i++){
	    this.ActiveLetterSet[i].activeGrpIndex = i;
	}
	this.prev_DT_rdNt = 0;//needs reset so as not to use old data
    },

    //shuffles letters horizonally, making a gap
    shuffleInsertionDrag: function(){
    },

    //include a new letter in the ActiveLetterSet
    addLetter: function(myTile){
	this.ActiveLetterSet.push(myTile);
	myTile.activeGrpIndex=this.nActiveLetters;
	this.nActiveLetters++;
	x_loco = this.x_next_letter + (this.nActiveLetters-1) * snDraw.Game.h_spacer;

	
	myTile.set({
	    left: x_loco,
	    top: this.y_next_letter
	});
	canvas.remove(myTile);
	canvas.add(myTile);
	snDraw.Game.modifyTileObject(myTile,"ACTIVE");
    },


    //remove a letter from the ActiveLetterSet
    removeLetter: function(myTile){

	this.nActiveLetters--;

	//TODO: must remove it from the arry ACTIVELETTERSET 
	this.ActiveLetterSet.splice(myTile.activeGrpIndex,1);
	myTile.activeGrpIndex=undefined;//it no longer has such an index.

	//make sure all the stored indecies for position in activeletter reflect removal    
	for(i=0;i<this.nActiveLetters;i++){
	    this.ActiveLetterSet[i].activeGrpIndex = i;
	    this.ActiveLetterSet[i].setLeft(this.x_next_letter + i * snDraw.Game.h_spacer);
	    //whenever namually changing tile coordinates, must do this to update drag zone
	    canvas.remove(this.ActiveLetterSet[i]);
	    canvas.add(this.ActiveLetterSet[i]);
	}


	//remove the event listener for that tile...
	myTile.off('moving');

	//move the tile to be removed back to wherever it was before
	myTile.set({
	    left: myTile.x_availableSpace,
	    top: myTile.y_availableSpace
	});
	//whenever namually changing tile coordinates, must do this to update drag zone
	canvas.remove(myTile);
	canvas.add(myTile);


	snDraw.Game.modifyTileObject(myTile,"flipped");

    },


    getTileIndecesFromSpeller: function(){
	var tile_indeces_of_word = [];
	for(i=0; i<this.nActiveLetters; i++){//for each TILE making up the word...
	    //run through the Letter objects to extract the word's tile indeces into an array
	    myTile = this.ActiveLetterSet[i];
	    tile_indeces_of_word[i] = myTile.tileID;
	}
	return tile_indeces_of_word;
    },

    //send a candidate word to the server
    ClearWordFromSpeller: function(replace_tiles_on_grid){
	
	for(i=0; i<this.nActiveLetters; i++){//for each TILE making up the word...
	    //run through the Letter objects to extract the word's tile indeces into an array
	    myTile = this.ActiveLetterSet[i];
	    if(replace_tiles_on_grid){
		myTile.set({
		    left: myTile.x_availableSpace,
		    top: myTile.y_availableSpace
		});
		//whenever namually changing tile coordinates, must do this to update drag zone
		canvas.remove(myTile);
		canvas.add(myTile);

	    }
	    //restore tile from it's special states when it's being used to spell a word
	    myTile.activeGrpIndex = undefined;
	    myTile.off('moving');
	    snDraw.Game.modifyTileObject(myTile,"flipped");
	}
	
	//finally, reset plotters back the the original values (TODO: is this necessary, they will be immediately changed back if word is accepted)
	this.restoreBasePosition();
	this.ActiveLetterSet = [];
	this.nActiveLetters = 0;
	this.prev_DT_rdNt = 0;//previous Drag Tile's shift in tile position...
    },

    //send a candidate word to the server
    SubmitWord: function(){
	var word_by_tile_indeces = this.getTileIndecesFromSpeller();
	PLAYER_SUBMITS_WORD(JSON.stringify(word_by_tile_indeces));
    },

    //cancel word
    CancelWord: function(){
	this.ClearWordFromSpeller(true);
    },


    //server accepted the candidate word, mutate the client side data and display...
    wordAccepted: function(){
	//do something...
    }
};
