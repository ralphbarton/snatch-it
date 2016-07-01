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
		var invalid_defn = DefnObj == undefined;
		var w_change = DefnObj.word_defined.toLowerCase() != DefnObj.word_queried.toLowerCase();
		var no_defns_found = DefnObj.DefnList.length == 0;

		var Def_Frag = $('<div/>');

		//generate the innerHTML
		if (invalid_defn){
		    Def_Frag.text("Undefined: ").append(
			$('<span/>').addClass("defn-main-word").html(DefnObj.word_queried)
		    );
		}else if (no_defns_found){
		    Def_Frag.text("No definitions were retrieved for ").append(
			$('<span/>').addClass("defn-main-word").html(DefnObj.word_queried)
		    );
		}else{
		    // 1. Generate the "Top Line"
		    var TopLine_Frag = $('<div/>');
		    var HR = DefnObj.properties.source + DefnObj.word_defined.toLowerCase();
		    if(w_change){ // 1.1 word was transformed
			TopLine_Frag.append(
			    $('<a/>').attr("href", HR).addClass("defn-queried").text(DefnObj.word_queried.toUpperCase())
			).append(
			    $('<span/>').addClass("defn-showing").append(
				"  (results for "
			    ).append(
				$('<span/>').addClass("defn-showing-word").text(DefnObj.word_defined.toUpperCase())
			    ).append(
				")"
			    )
			);
		    }else{ // 1.1 word verbatim
			TopLine_Frag.append(
			    $('<a/>').attr("href", HR).addClass("defn-main-word").text(DefnObj.word_queried.toUpperCase())
			);
		    }
		    Def_Frag.append(TopLine_Frag);

		    // 2. Inject further content...
		    var Max_Ds = 2;
		    for (var i = 0; (i < DefnObj.DefnList.length) && (i < Max_Ds); i++){//cap qty defns @ 2
			Def_Frag.append(
			    $('<div/>').addClass("defn-text").html(DefnObj.DefnList[i]) // this this the definition
			);
		    }
		}


		snCore.Toast.showToast("(text str)",{HTML_frag: Def_Frag});

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
