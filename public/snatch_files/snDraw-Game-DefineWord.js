snDraw.Game.DefineWord = {

    word_dictionary: {},
    my_toast_callback: undefined, // only need to have one item in the "definitions pipeline" ever

    get_WI_PI: function (WordGrp) {
	var player = WordGrp.OwnerPlayer;
	var zTID = WordGrp.getObjects()[0].tileID;//tile IDs are unique, a fingerprint for the word. Log TID of letter 0
	var WI = 0;
	for (var i = 0; i < player.words.length; i++){
	    if(player.words[i][0] == zTID){
		WI = i;
		break;
	    }
	}
	return {PI: player.index, WI:WI};
    },

    delayedDefinitionToast: function (WordGrp, mouse_is_down) {
	clearTimeout(this.my_toast_callback);
	var id = this.get_WI_PI(WordGrp);
	var word_str = snDraw.Game.Tile.TileIDArray_to_LettersString(players[id.PI].words[id.WI]);

	var confirmation_time = 600;
	this.my_toast_callback = setTimeout(function(){
	    //at point of (potentially) displaying the toast, check coordinates are not changed...
	    if( !snDraw.Game.Mouse.is_movedSincePickup(WordGrp) ){
		snDraw.Game.Toast.showToast(word_str + ": " + snDraw.Game.DefineWord.word_dictionary[word_str]);
		if(mouse_is_down){
		    snDraw.Game.Mouse.defn_toast_shown_since_mouse_down = true;
		}
	    }
	}, confirmation_time);
	
    },

    cancelDelayedDefinitionToast: function (WordGrp) {
	clearTimeout(this.my_toast_callback);
    }
};
