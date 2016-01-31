
//this is a container for functions and data for Word creation (the generally yellow bit)...

snDraw.Game.Spell = {

    // a note about players[i].saved_x_plotter // TODO write the note...
    x_first_letter: undefined,
    y_first_letter: undefined,
    x_next_letter: undefined,
    y_next_letter: undefined,
    ActiveLetterSet: [],
    nActiveLetters: 0,
    active: false,
    prev_DT_rdNt: 0,//previous Drag Tile's shift in tile position...

    destDragTileIndex: 0,
    h_spacer: snDraw.Game.tileSize * 1.04,


    //shuffles letters horizonally, making a gap
    shuffleAnagramDrag: function(dTile){
	var daT = dTile.activeGrpIndex;//dragging tile's index within the Active Letter Set
	DT_dx = dTile.xPickup - dTile.get('left');
	DT_dNt = -(DT_dx)/h_spacer;// dTile is the tile object being dragged
	DT_rdNt = Math.round(DT_dNt);
	//apply limitation to DT_rdNt
	max_DT = (nActiveLetters-1)-daT;
	min_DT = -daT;
	DT_rdNt = Math.min(max_DT, DT_rdNt);
	DT_rdNt = Math.max(min_DT, DT_rdNt);

	destDragTileIndex = daT+DT_rdNt;

	if(DT_rdNt != prev_DT_rdNt){
	    
	    function letterShuffler(prev_DT_rdNt, DT_rdNt){
		pos=true;
		console.log("transition", prev_DT_rdNt, DT_rdNt);
		anT = Math.max(DT_rdNt, prev_DT_rdNt);
		if(anT<=0){//tile is relatively negative to DragTile
		    anT = Math.min(DT_rdNt, prev_DT_rdNt);
		    pos=false;
		}
		
		var animateTile = ActiveLetterSet[daT+anT];
		
		shiftRight = prev_DT_rdNt > DT_rdNt;
		destC = (daT+anT)+shiftRight-pos;
		destPx = destC*h_spacer + x_next_letter;

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
	    Trans_inc = DT_rdNt > prev_DT_rdNt ? 1 : -1;
	    var imbetweener=prev_DT_rdNt;
	    while(imbetweener != DT_rdNt){
		letterShuffler(imbetweener,imbetweener+Trans_inc);
		imbetweener+=Trans_inc;
	    }

	    

	    prev_DT_rdNt = DT_rdNt;

	}
    },

    //at the end of a drag event (anagram=>no new letter added) reshuffle the array to reflect...
    shuffleAnagramRelease: function(dTile){
	//Todo:
	var daT = dTile.activeGrpIndex;//dragging tile's index within the Active Letter Set
	ActiveLetterSet.move(daT,destDragTileIndex)

	dTile.setTop(y_next_letter);
	destPx = destDragTileIndex * h_spacer + x_next_letter;
	
	dTile.animate('left', destPx, {
	    onChange: function() {
		canvas.renderAll();
	    },
	    easing: fabric.util.ease.easeOutBounce,
	    duration: 100
	});

	//make sure all the stored indecies for position in activeletter set reflect new ordering
	for(i=0;i<nActiveLetters;i++){
	    ActiveLetterSet[i].activeGrpIndex = i;
	}
	prev_DT_rdNt = 0;//needs reset so as not to use old data
    },

    //shuffles letters horizonally, making a gap
    shuffleInsertionDrag: function(){
    },

    //include a new letter in the ActiveLetterSet
    addLetter: function(myTile){
	ActiveLetterSet.push(myTile);
	console.log(ActiveLetterSet);
	myTile.activeGrpIndex=nActiveLetters;
	nActiveLetters++;
	x_loco = x_next_letter + (nActiveLetters-1) * h_spacer
	myTile.set({
	    left: x_loco,
	    top: y_next_letter
	});
	canvas.remove(myTile);
	canvas.add(myTile);
	console.log(myTile);
	modifyTileObject(myTile,"ACTIVE");
    },


    //remove a letter from the ActiveLetterSet
    removeLetter: function(myTile){

	nActiveLetters--;

	//TODO: must remove it from the arry ACTIVELETTERSET 
	ActiveLetterSet.splice(myTile.activeGrpIndex,1);
	myTile.activeGrpIndex=undefined;//it no longer has such an index.

	//make sure all the stored indecies for position in activeletter reflect removal    
	for(i=0;i<nActiveLetters;i++){
	    ActiveLetterSet[i].activeGrpIndex = i;
	    ActiveLetterSet[i].setLeft(x_next_letter+i*h_spacer);
	    //whenever namually changing tile coordinates, must do this to update drag zone
	    canvas.remove(ActiveLetterSet[i]);
	    canvas.add(ActiveLetterSet[i]);
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


	modifyTileObject(myTile,"flipped");

    },


    //send a candidate word to the server
    SubmitWord: function(){
	
	var myWord_tileIndeces = [];

	for(i=0; i<nActiveLetters; i++){
	    //take the tile's actual ID
	    myTile = ActiveLetterSet[i];
	    myWord_tileIndeces[i] = myTile.tileID;
	    //this tile is no longer in the active group
	    myTile.activeGrpIndex=undefined;
	    myTile.off('moving');
	    //graphically remove tile

	    modifyTileObject(myTile,"flipped");//do we need this here?
	    //I think if we just rerender the screen, its incorrect...
	}

	
	//finally, reset plotters back the the original values (TODO: is this necessary, they will be immediately changed back if word is accepted)
	x_next_letter = x_first_letter;
	y_next_letter = y_first_letter;
	ActiveLetterSet = [];
	nActiveLetters = 0;
	active =false;
	prev_DT_rdNt = 0;//previous Drag Tile's shift in tile position...
	
	PLAYER_SUBMITS_WORD(JSON.stringify(myWord_tileIndeces));

    },

    //cancel word
    CancelWord: function(){
	
	var myWord_tileIndeces = [];

	for(i=0; i<nActiveLetters; i++){
	    myTile = ActiveLetterSet[i];
	    //logically remove tile
	    myTile.activeGrpIndex=undefined;
	    myTile.off('moving');
	    //graphically remove tile
	    myTile.set({
		left: myTile.x_availableSpace,
		top: myTile.y_availableSpace
	    });
	    canvas.remove(myTile);
	    canvas.add(myTile);
	    modifyTileObject(myTile,"flipped");//do we need this here?
	}

	//reset the data objects of the WordCreate class.
	x_next_letter = x_first_letter;
	y_next_letter = y_first_letter;
	ActiveLetterSet = [];
	nActiveLetters = 0;
	active =false;
	prev_DT_rdNt = 0;//previous Drag Tile's shift in tile position...
	
    },


    //server accepted the candidate word, mutate the client side data and display...
    wordAccepted: function(){
	active = false;
    }
};
