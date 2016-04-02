snDraw.Game.Mouse = {

    //these variables are supposedly the class members...
    x_pickup: undefined,
    y_pickup: undefined,

    mDown: function (e) {

	//for any click anywhere:
	if(snDraw.Game.Controls.playersListWindowVisible){
	    snDraw.Game.Controls.removePlayersListWindow();	//it's important this comes before the button handlers, or the window will get drawn then removed.
	}

	//Handle clicks landing on objects...
	var targetObj = e.target;
	if(targetObj !== undefined){

	    //Handle clicks landing on tiles...
	    var my_tile_index = targetObj.tileID;
	    if(my_tile_index !== undefined){
		
		//Clicks that land on Skeletal tiles...
		if(my_tile_index < 0){
		    snDraw.Game.Spell.removeLetter(100 + my_tile_index);
		}
	    }

	    //Handle clicks that land on a word...
	    var word_owner = targetObj.OwnerPlayer;
	    if(word_owner!==undefined){//mouse down on a word 
		this.x_pickup = targetObj.getLeft();
		this.y_pickup = targetObj.getTop();
	    }

	    //Handle clicks that land on a Game Control
	    var control_index = targetObj.gameButtonID;
	    if(control_index!==undefined){ //implies the click landed on a button...
		snDraw.Game.Controls.buttonRecolor(targetObj,"press"); // visual
		this.callGameControlHandler(control_index);
	    }
	}
    },

    mUp: function (e) {

	//Handle click releases over objects...
	var targetObj = e.target;
	if(targetObj !== undefined){

	    //Handle click releases over tiles...
	    var my_tile_index = targetObj.tileID;
	    if(my_tile_index !== undefined){

		//Clicks that land on real tiles...
		if(my_tile_index >= 0){

		    //only allow the addition of the letter if it wasn't recently clicked...
		    if (targetObj.recentClick != true){
			snDraw.Game.Spell.addLetter(targetObj.letter);
			snDraw.Game.TileArray[my_tile_index].recentClick = true;
			setTimeout(function(){snDraw.Game.TileArray[my_tile_index].recentClick = false;}, 500);
		    }
		}
	    }

	    //Handle click releases over a word...
	    var word_owner = targetObj.OwnerPlayer;
	    if(word_owner!==undefined){//mouse down on a word 

	    }

	    //Handle click releases over a Game Control
	    var control_index = targetObj.gameButtonID;
	    if(control_index!==undefined){ //implies the click landed on a button...

	    }


	}
    },

    callGameControlHandler: function (control_index) {
	if(control_index == 0){
	    // Actions for "Cancel Word" Button click
	    snDraw.Game.Spell.CancelWord();
	}
	if(control_index == 1){
	    // Actions for "Turn Letter" Button click
	    snDraw.Game.Controls.turnLetterClickHandler();
	}	    
	if(control_index == 2){
	    // Actions for "SNATCH IT" Button click
	    snDraw.Game.Spell.SubmitWord();
	}	    
	if(control_index == 3){
	    // Actions for "View Scores" Button click
	    snDraw.Game.Controls.createPlayersListWindow();
	}
	if(control_index == 4){
	    // Actions for "Reset Game" Button click
	    var really = confirm("Do you really want to reset this game?");
	    if(really){RESET_REQUEST();}
	}
    }
    
};







snDraw.Game.KB = {
    
    secretCode: "99FROGS99",
    codeCounter: 0,

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
