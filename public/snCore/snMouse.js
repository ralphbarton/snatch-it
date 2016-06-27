snCore.Mouse = {

    //these variables are supposedly the class members...
    x_pickup: undefined,
    y_pickup: undefined,
    anti_controls_dblclick: [],

    defn_toast_shown_since_mouse_down: false,
    mDown: function (e) {

	this.defn_toast_shown_since_mouse_down = false;

	//Handle clicks landing on objects...
	var targetObj = e.target;

	if(targetObj !== undefined){

	    //Handle clicks landing on tiles...
	    var my_tile_index = targetObj.tileID;
	    if(my_tile_index !== undefined){
		
		//Clicks that land on Skeletal tiles...
		if(my_tile_index < 0){
		    snCore.Spell.removeLetter(100 + my_tile_index);
		}
	    }

	    //Handle clicks that land on a word...
	    var word_owner = targetObj.OwnerPlayer;
	    if(word_owner!==undefined){//mouse down on a word 
		snCore.DefineWord.delayedDefinitionToast(targetObj, true);
		this.x_pickup = targetObj.getLeft();
		this.y_pickup = targetObj.getTop();
	    }

	    //Handle clicks that land on a Game Control
	    var control_index = targetObj.gameButtonID;
	    if(control_index !== undefined){ //implies the click landed on a button...
		snCore.Controls.buttonRecolor(targetObj,"press"); // visual

		//bulked up with anti double click code...
		if(this.anti_controls_dblclick[control_index] !== true){
		    this.callGameControlHandler(control_index);
		}
		this.anti_controls_dblclick[control_index] = true;
		setTimeout(function(){snCore.Mouse.anti_controls_dblclick[control_index] = false;}, 500);
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
	    if(word_owner !== undefined){//mouse up on a word 
		snCore.DefineWord.cancelDelayedDefinitionToast(targetObj);
		//clicks released over a word that had previously been clicked on (i.e. picked up)
		if(this.x_pickup !== undefined){
		    snCore.Basic.moveSwitchable(targetObj, true, snCore.Basic.ani.sty_Anag,{
			left: this.x_pickup,
			top: this.y_pickup
		    });
		}
		//This is to trigger an "add letter to speller" for mouse-up upon a word...
		//this is not required if a definition toast has already been shown for the word OR if word has moved
		if( (!this.defn_toast_shown_since_mouse_down) && (!this.is_movedSincePickup(targetObj))){

		    //determine the letter...
		    var myHitTile_deets = this.getTile_fromMouseOnWord(e);
		    this.spellAddLetter_noDoubleClick(myHitTile_deets.TileObj, myHitTile_deets.TileCoords);

		}
		//don't store this stale information after a click release.
		//(Important as it may be used to determine if drag is in progress...)
		// also important - do this in the final section of mouse-up-on-word
		this.x_pickup = undefined;
		this.y_pickup = undefined;

	    }
	    
	    //Handle click releases over a Game Control
	    var control_index = targetObj.gameButtonID;
	    if(control_index !== undefined){ //implies the click landed on a button...
		snCore.Controls.buttonRecolor(targetObj,"normal");		
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
		snCore.Controls.buttonRecolor(targetObj,"hover");
	    }

	    //Handle mouse pointer passing onto a word...
	    var word_owner = targetObj.OwnerPlayer;
	    if(word_owner !== undefined){//mouse over a word 
		snCore.DefineWord.delayedDefinitionToast(targetObj, false);
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
		snCore.Controls.buttonRecolor(targetObj,"normal");
	    }

	    //Handle mouse pointer moving off a word...
	    var word_owner = targetObj.OwnerPlayer;
	    if(word_owner !== undefined){//mouse moving off a word 
		snCore.DefineWord.cancelDelayedDefinitionToast(targetObj);
	    }

	}
    },

    getTile_fromMouseOnWord: function (mouse_event) {
	var pointer = canvas.getPointer(mouse_event.e);
	var wordObj = mouse_event.target;
	var x_extent = pointer.x - wordObj.getLeft();
	var index = Math.floor(x_extent/snCore.Tile.dims.tslg);
	var index_upper = wordObj._objects.length;
	index = Math.min(index, index_upper-1);
	return {
	    TileObj: wordObj.item(index),
	    TileCoords: {
		x: (wordObj.getLeft() + index * snCore.Tile.dims.tslg),
		y: wordObj.getTop()
	    }
	};
    },

    spellAddLetter_noDoubleClick: function (myTile, WRDtile_coords) {
	//only allow the addition of the letter if it wasn't recently clicked...
	if (myTile.recentClick != true){
	    var spl_add = snCore.Spell.addLetter(myTile.letter);
	    myTile.recentClick = true;
	    var rem_spot = this.showSpotOnTile(myTile, WRDtile_coords, spl_add);

	    setTimeout(function(){
		myTile.recentClick = false;
		rem_spot();
	    }, 250);
	}
    },

    //returns a function at will, when called, remove this spot.
    showSpotOnTile: function (myTile, WRDtile_coords, spl_add) {
	//draw a little spot...
	var rzz = snCore.Tile.dims.ts * 0.2;
	var rad = rzz * (spl_add ? 1.0 : 0.6);
	var dot_fill = spl_add ? players[client_player_index].color : '#999';

	if(WRDtile_coords){
	    var spot_left = WRDtile_coords.x;
	    var spot_top = WRDtile_coords.y;
	}else{
	    var spot_left = myTile.getLeft();
	    var spot_top = myTile.getTop();
	}
	spot_left += rzz/2;
	spot_top += rzz/2;

	var mySpark = new fabric.Circle({
	    radius: rad,
	    fill: dot_fill,
	    left: spot_left,
	    top: spot_top,
	    stroke: '#000',
	    strokeWidth: 1,
	    hasControls: false,
	    hasBorders: false,
	    selectable: false
	});
	canvas.add(mySpark);
	snCore.Basic.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()

	return function(){
	    //delete that little spot...
	    canvas.remove(mySpark);
	    snCore.Basic.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
	};
    },

    //also returns false if the object is not picked up...
    is_movedSincePickup: function (my_obj) {

	function cartesian_distance(x,y){
	    return Math.round(Math.sqrt(x*x + y*y),0);
	}

	var movement_in_drag = false;
	if(snCore.Mouse.x_pickup !== undefined){ // implies drag even it progress.

	    var dx = this.x_pickup - my_obj.getLeft();
	    var dy = this.y_pickup - my_obj.getTop();
	    movement_in_drag = cartesian_distance(dx,dy) > 0.3 * snCore.Tile.dims.ts;
	}
	return movement_in_drag;
    },

    callGameControlHandler: function (control_index) {
	if(control_index == 0){
	    // Actions for "Cancel Word" Button click
	    snCore.Spell.CancelWord();
	}
	if(control_index == 1){
	    // Actions for "Turn Letter" Button click
	    snCore.Controls.turnLetterClickHandler();
	}	    
	if(control_index == 2){
	    // Actions for "SNATCH IT" Button click
	    snCore.Spell.SubmitWord();
	}	    
	if(control_index == 3){
	    // Actions for "View Scores" Button click
	    snCore.Popup.openModal("scores");
	}
	if(control_index == 4){
	    // Actions for "options" Button click
	    snCore.Popup.openModal("options");
	}
    }
};
