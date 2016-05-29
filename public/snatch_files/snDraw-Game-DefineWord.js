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

    delayedDefinitionToast: function (WordGrp) {
	clearTimeout(this.my_toast_callback);
	var id = this.get_WI_PI(WordGrp);
	var word_str = snDraw.Game.TileIDArray_to_LettersString(players[id.PI].words[id.WI]);

	var confirmation_time = 800;
	this.my_toast_callback = setTimeout(function(){
	    snDraw.Game.Toast.showToast(word_str + ": " + snDraw.Game.DefineWord.word_dictionary[word_str]);
	}, confirmation_time);
	
    },

    clearDefinitionToast: function (WordGrp) {
	clearTimeout(this.my_toast_callback);
    }
};
