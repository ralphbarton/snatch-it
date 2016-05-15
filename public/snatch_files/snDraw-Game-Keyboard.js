snDraw.Game.Keyboard = {
    
    secretCode: "99FROGS99",
    codeCounter: 0,

    secretCode2: "99FROGS88",
    codeCounter2: 0,

    kDown: function (e) {
	var myKeycode = e.keyCode;
	var keyPressed = String.fromCharCode(myKeycode);//note that this is non-case sensitive.

	//this design only handles one code but could easily be modified for more.
	if(keyPressed == this.secretCode[this.codeCounter]){
	    this.codeCounter++;
	    if(this.codeCounter == this.secretCode.length){
		//the whole code was entered!!
		alert("TOAST: You typed the secret code to enter developement mode\nEnjoy the faster tile flips for you only!\nDev mode " + (!dev ? "ON" : "OFF"));
		dev = !dev;
		this.codeCounter = 0;
	    }
	}else{
	    this.codeCounter = 0;
	}


	//this design only handles one code but could easily be modified for more.
	//note how the easy modification used here has been the copying and pasting of code.
	//TODO. if any more codes are to be used, do it a bit better than this, please...
	if(keyPressed == this.secretCode2[this.codeCounter2]){
	    this.codeCounter2++;
	    if(this.codeCounter2 == this.secretCode2.length){
		//the whole code was entered!!
		snDraw.Game.Toast.showToast("Secret code entered shall now flip 25 tiles");
		TURN_MANY_TILES(25);
		this.codeCounter2 = 0;
	    }
	}else{
	    this.codeCounter2 = 0;
	}



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

	    if(keyPressed == '8'){
		// no action, but keep in reserve for testing...
	    }

	    if(keyPressed == '7'){
		// no action, but keep in reserve for testing...
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
