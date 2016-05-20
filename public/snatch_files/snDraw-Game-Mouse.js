snDraw.Game.Mouse = {

    //these variables are supposedly the class members...
    x_pickup: undefined,
    y_pickup: undefined,

    mDown: function (e) {

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
	    if(control_index !== undefined){ //implies the click landed on a button...
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

		//Clicks releases over real tiles...
		if(my_tile_index >= 0){
		    this.spellAddLetter_noDoubleClick(targetObj);
		}
	    }

	    //Handle click releases over a word...
	    var word_owner = targetObj.OwnerPlayer;
	    if(word_owner !== undefined){//mouse down on a word 
		
		//clicks released over a word that had previously been clicked on (i.e. picked up)
		if(this.x_pickup !== undefined){
		    snDraw.moveSwitchable(targetObj, true, snDraw.ani.sty_Anag,{
			left: this.x_pickup,
			top: this.y_pickup
		    });
		}
		//This is to trigger an "add letter to speller" for mouse-up upon a word...
		//determine the letter...
		var myHitTileObj = this.getTile_fromMouseOnWord(e);
		this.spellAddLetter_noDoubleClick(myHitTileObj);
	    }
	    
	    //Handle click releases over a Game Control
	    var control_index = targetObj.gameButtonID;
	    if(control_index !== undefined){ //implies the click landed on a button...
		snDraw.Game.Controls.buttonRecolor(targetObj,"normal");		
	    }
	}
    },

    mOver: function (e) {

	//Handle mouse pointer passing onto objects...
	var targetObj = e.target;
	if(targetObj !== undefined){

	    //Handle mouse pointer passing onto a Game Control
	    var control_index = targetObj.gameButtonID;
	    if(control_index !== undefined){ 
		snDraw.Game.Controls.buttonRecolor(targetObj,"hover");
	    }
	}
    },

    mOut: function (e) {

	//Handle mouse pointer moving off objects...
	var targetObj = e.target;
	if(targetObj !== undefined){

	    //Handle mouse pointer moving off a Game Control
	    var control_index = targetObj.gameButtonID;
	    if(control_index !== undefined){ 
		snDraw.Game.Controls.buttonRecolor(targetObj,"normal");
	    }
	}
    },

    getTile_fromMouseOnWord: function (mouse_event) {
	var pointer = canvas.getPointer(mouse_event.e);
	var wordObj = mouse_event.target;
	var x_extent = pointer.x - wordObj.getLeft();
	var index = Math.floor(x_extent/snDraw.Game.tileSize);
	var index_upper = wordObj._objects.length;
	index = Math.min(index, index_upper-1);
	return wordObj.item(index);
    },

    spellAddLetter_noDoubleClick: function (myTile) {
	//only allow the addition of the letter if it wasn't recently clicked...
	if (myTile.recentClick != true){
	    snDraw.Game.Spell.addLetter(myTile.letter);
	    myTile.recentClick = true;
	    setTimeout(function(){myTile.recentClick = false;}, 500);
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
	    snDraw.Game.Popup.createPlayersListWindow();
	}
	if(control_index == 4){
	    // Actions for "Reset Game" Button click
	    snDraw.Game.Popup.create_GameSettings_Window();
	}
    }
};
