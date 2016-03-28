snDraw.Game.Mouse = {
    //global variables
    significant_drag: false,

    //TODO: (n.b. given that there's only one mouse but the recorded coordinates here too...
    
    mDown: function (e) {
	my_tile_index = e.target.tileID;
	if(my_tile_index !== undefined){//for when a click landed on a tile...
	    if(my_tile_index < 0){//this means that the click landed on a skeletal tile!
		snDraw.Game.Spell.removeLetter(100 + my_tile_index);
	    }

	    else if(tileset[my_tile_index].status=="turned"){//click on a turned tile. Log coords of start of drag
		this.recordDragStartCoords(e.target);
		//Actually upon pickup of an active tile, add the event listener to potentially move other tiles around beneath...
		// this is really only for the fresh word create case?
		if(e.target.visual=="ACTIVE"){
		    this.significant_drag = false;
		    var count = 0;
		    e.target.on('moving',function (o){
			snDraw.Game.Spell.shuffleAnagramDrag(e.target);
			//the next few lines of code used in determining if significant movement has occured between pickup and drop
			count++;
			if (count % 5 == 0){//an attempted efficiency boost
			    var pointer = canvas.getPointer(e.e);
			    snDraw.Game.Mouse.significant_drag = snDraw.Game.Mouse.significant_drag || snDraw.Game.Mouse.significantMovement(e.target,pointer);
			}
		    });
		}
	    }
	}
	//it's important this comes before the button handlers, or the window will get drawn then removed.
	if(snDraw.Game.Controls.playersListWindowVisible){
	    snDraw.Game.Controls.removePlayersListWindow();
	}


	//for handling mouse down on the row of buttons accross the top.
	GCindex = e.target.gameButtonID;
	if(GCindex!==undefined){ //implies the click landed on a button...
	    snDraw.Game.Controls.buttonRecolor(e.target,"press"); // visual
	    if(GCindex == 0){
		// Actions for "Cancel Word" Button click
		snDraw.Game.Spell.CancelWord();
	    }
	    if(GCindex == 1){
		// Actions for "Turn Letter" Button click
		snDraw.Game.Controls.turnLetterClickHandler();
	    }	    
	    if(GCindex == 2){
		// Actions for "SNATCH IT" Button click
		snDraw.Game.Spell.SubmitWord();
	    }	    
	    if(GCindex == 3){
		// Actions for "View Scores" Button click
		snDraw.Game.Controls.createPlayersListWindow();
	    }
	    if(GCindex == 4){
		// Actions for "Reset Game" Button click
		var really = confirm("Do you really want to reset this game?");
		if(really){RESET_REQUEST();}
	    }
	}

	var word_owner = e.target.OwnerPlayer;
	if(word_owner!==undefined){//mouse down on a word 
	    this.recordDragStartCoords(e.target);
	}
    },

    mUp: function (e) {
	var my_tile_index = e.target.tileID;
	if(my_tile_index !== undefined){//for when a mouse up landed on a tile...

	    //this is for RELEASES that land on a blue tile in the free tiles area
	    if(tileset[my_tile_index].status=="turned"){
		if((e.target.visual=="flipped")||(e.target.visual=="partial")||(e.target.visual=="shadow")){

		    //for certain types of drag, add the letter...
		    if((!this.significantMovement(e.target))||(this.draggedIntoPlayZone(e.target))){
			

			//only all the addition of the letter if it wasn't recently clicked...
			if (e.target.recentClick != true){
			    snDraw.Game.Spell.addLetter(e.target.letter);
			    snDraw.Game.TileArray[my_tile_index].recentClick = true;
			    setTimeout(function(){snDraw.Game.TileArray[my_tile_index].recentClick = false;}, 500);
			}
		    }
		}
	    }
	}

	//for handling "mouse:up" on the row of buttons accross the top.
	var GCindex = e.target.gameButtonID;
	if(GCindex!==undefined){
	    snDraw.Game.Controls.buttonRecolor(e.target,"normal");
	}

	var word_owner = e.target.OwnerPlayer;
	if(word_owner!==undefined){//mouse up on a word 
	    if(e.target.xPickup!==undefined){//coordinates were stored for the object (exludes the case of moving mouse onto word then lifting, for what that's worth).
		snDraw.moveSwitchable(e.target, true, snDraw.ani.sty_Anag,{
		    left: e.target.xPickup,
		    top: e.target.yPickup
		});
	    }
	    //This is to trigger an "add letter to speller" for mouse-up upon a word...
	    //determine the letter...
	    var pointer = canvas.getPointer(e.e);
	    var x_extent = pointer.x - e.target.getLeft();
	    var index = Math.floor(x_extent/snDraw.Game.tileSize);
	    var index_upper = e.target._objects.length;
	    index = Math.min(index, index_upper-1);
	    var hit_letter = e.target.item(index).letter;
	    var hit_tileID = e.target.item(index).tileID;
	    //this ought to be conditional upon the word not having been dragged - TODO!
	    if (snDraw.Game.TileArray[hit_tileID].recentClick != true){
	    	snDraw.Game.Spell.addLetter(hit_letter);
	    	snDraw.Game.TileArray[hit_tileID].recentClick = true;
	    	setTimeout(function(){snDraw.Game.TileArray[hit_tileID].recentClick = false;}, 500);
	    }
	}
    },

	    mOver: function (e) {

	//for handling "mouse:over" on the row of buttons accross the top.
	GCindex = e.target.gameButtonID;
	if(GCindex!==undefined){
	    snDraw.Game.Controls.buttonRecolor(e.target,"hover");
	}

    },

    mOut: function (e) {

	//for handling "mouse:out" on the row of buttons accross the top.
	GCindex = e.target.gameButtonID;
	if(GCindex!==undefined){
	    snDraw.Game.Controls.buttonRecolor(e.target,"normal");
	}

    },


    significantMovement: function(MyTile, options){
	var final_x = undefined;
	var final_y = undefined;
	
	if(options){
	    final_x = options.x;
	    final_y = options.y;
	}else{
	    final_x = MyTile.getLeft();
	    final_y = MyTile.getTop();
	}
	var adx = Math.abs(MyTile.xPickup - final_x);
	var ady = Math.abs(MyTile.yPickup - final_y); 
	var threshold = snDraw.Game.tileSize * 0.1;
	return (adx>threshold) || (ady>threshold);
    },

    verticalMovement: function(MyTile){

	//getTop is the final position, and an a reduced Y coord (i.e. positive dy) implies upwards
	var ady = Math.abs(MyTile.yPickup - MyTile.getTop());
	var threshold = snDraw.Game.tileSize * 1.2;
	return ady>threshold;

    },

    recordDragStartCoords: function(MyFabricObj){
	//assigning new attributes...
	MyFabricObj.xPickup = MyFabricObj.getLeft();
	MyFabricObj.yPickup = MyFabricObj.getTop();
	//log its old board coordinates in case it is to be returned
	if(MyFabricObj.visual=="flipped"){
	    MyFabricObj.x_availableSpace = MyFabricObj.getLeft();
	    MyFabricObj.y_availableSpace = MyFabricObj.getTop();
	}
    },

    draggedIntoPlayZone: function(MyTile){
	return MyTile.getTop() > snDraw.Game.Zones.playersZoneTopPx - (snDraw.Game.tileSize * 0.9);
    }
};












snDraw.Game.KB = {

    kDown: function (e) {
	var myKeycode = e.keyCode;
	var keyPressed = String.fromCharCode(myKeycode);//note that this is non-case sensitive.

	if(snDraw.Game.Controls.playersListWindowVisible){
	    snDraw.Game.Controls.removePlayersListWindow();	    
	}else{
	    if( (myKeycode >= 65) && (myKeycode <= 90) ){//any letter key
		
		snDraw.Game.Spell.addLetter(keyPressed); 
		//this is the old CODE TODO:delete
		/*
		  var grabit_tile_index = this.seachForTurnedTileOfLetter(keyPressed);
		  if (grabit_tile_index !== undefined){
		  //
		  var TargetTile = snDraw.Game.TileArray[grabit_tile_index];
		  //note that in the case of mouse, the two function calls below are not coincident in time.
		  //coordinates recorded on mouse-down, letter added on mouse-up.
		  snDraw.Game.Mouse.recordDragStartCoords(TargetTile);
		  snDraw.Game.Spell.addLetter(TargetTile); 
		  }
		  else{
		  //take action if the user hits a letter and its not available.
		  
		  //TODO concider the detail and graphics for various scenarious of subsets of letters from word sources... (i.e. other peoples' words)
		  }*/
	    }

	    if(myKeycode == 32){//space bar
		snDraw.Game.Controls.turnLetterClickHandler();
	    }

	    if((myKeycode == 8)||(keyPressed == '5')){//delete key
		// let this be remove the final letter of the spell (if present)
		snDraw.Game.Spell.removeLetter();
	    }

	    if((myKeycode == 13)||(keyPressed == '3')){//enter key
		// let this be submit word
		snDraw.Game.Spell.SubmitWord();
	    }

	    if((myKeycode == 27)||(keyPressed == '1')){//escape key or number 1
		// let this be cancel word
		snDraw.Game.Spell.CancelWord();
	    }

	    if(keyPressed == '2'){
		snDraw.Game.Controls.turnLetterClickHandler();
	    }

	    if(keyPressed == '4'){
		snDraw.Game.Controls.createPlayersListWindow();
	    }
	    /*
	      if(myKeycode == 16){//shift key
	      
	      }

	      if(myKeycode == 17){//control key
	      
	      }
	    */
	}
    }
};





