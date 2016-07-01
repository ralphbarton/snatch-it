snCore.DefineWord = {

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
	var word_str = snCore.Tile.TileIDArray_to_LettersString(players[id.PI].words[id.WI]);

	var confirmation_time = 600;
	this.my_toast_callback = setTimeout(function(){
	    //at point of (potentially) displaying the toast, check coordinates are not changed...
	    if( !snCore.Mouse.is_movedSincePickup(WordGrp) ){

		/*  {
		    word_queried: <string>
		    word_defined: <string>
		    n_definitions: <int>
		    DefnList: <Array>
		    }*/
		var DefnObj = snCore.DefineWord.word_dictionary[word_str];
		var w_change = DefnObj.word_defined.toLowerCase() != DefnObj.word_queried.toLowerCase();
		var no_defns_found = DefnObj.DefnList.length == 0;

		var Def_Frag = $('<div/>');

		if (no_defns_found){
		    Def_Frag.text("No definitions found for ").append(
			$('<span/>').addClass("defn-main-word").html(DefnObj.word_queried)
		    );
		}else{

		    // 1. Generate the "Top Line"
		    var TopLine_Frag = $('<div/>');
		    if(w_change){ // 1.1 word was transformed
			TopLine_Frag.append(
			    $('<span/>').addClass("defn-queried").html(DefnObj.word_queried)
			).append(
			    $('<span/>').addClass("defn-showing").html(
				'(results for <span class="defn-showing-word">'+DefnObj.word_defined+'</span>)'
			    )
			);
		    }else{ // 1.1 word verbatim
			TopLine_Frag.append(
			    $('<span/>').addClass("defn-main-word").html(DefnObj.word_queried)
			);
		    }


		    Def_Frag.append(
			$('<div/>').append(//to achieve line break

			)
		    );

		    );

text("No definitions found for ").append(
			$('<span/>').addClass("defn-main-word").html(DefnObj.word_queried)
		    );
		}
		

// definition = W_DEF.DefnList[0];

		if(w_change){
		    var Toast_HTML =  '<div><span class="defn-queried">'+DefnObj.word_queried+'</span>';
		    var Toast_HTML += '<span class="defn-showing">(results shown for '+DefnObj.word_defined+')</span></div>';
		}else{

		}

		snCore.Toast.showToast(word_str + ": " + );



		if(mouse_is_down){
		    snCore.Mouse.defn_toast_shown_since_mouse_down = true;
		}
	    }
	}, confirmation_time);
	
    },

    cancelDelayedDefinitionToast: function (WordGrp) {
	clearTimeout(this.my_toast_callback);
    }
};
