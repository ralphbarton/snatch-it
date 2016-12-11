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


    showDefinitionToast: function (word_str, via_kb) {
	/*  {
	    word_queried: <string>
	    word_defined: <string>
	    n_definitions: <int>
	    DefnList: <Array>
	    properties: {
	       popularity: <string>
	       source: <string-url>
	    }
	    }*/
	var DefnObj = snCore.DefineWord.word_dictionary[word_str];
	var invalid_defn = DefnObj == undefined;
	if(!invalid_defn){
	    var w_change = DefnObj.word_defined.toLowerCase() != DefnObj.word_queried.toLowerCase();
	    var no_defns_found = DefnObj.DefnList.length == 0;
	}

	var Def_Frag = $('<div/>');

	//generate the innerHTML
	if (invalid_defn){
	    Def_Frag.text("Undefined: ").append(
		$('<span/>').addClass("defn-main-word").html(word_str)
	    );
	}else if (no_defns_found){
	    var HR = DefnObj.properties.source + DefnObj.word_queried.toLowerCase();
	    Def_Frag.text("No definitions were retrieved for ").append(
		$('<a/>').attr("href", HR).addClass("defn-main-word").text(DefnObj.word_queried.toUpperCase())
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
	//clear any existing definitions toast before raising the new definitions toast.
	snCore.Toast.clear_all_definitions();
	return snCore.Toast.showToast("(text str)",{
	    HTML_frag: Def_Frag,
	    holdable: true,
	    via_KB: via_kb,
	    ToastType: 'defn',
	    defn_source: invalid_defn ? "(valid dictionary data not recieved)" : DefnObj.properties.source
	});
    },


    delayedDefinitionToast: function (WordGrp, mouse_is_down) {
	clearTimeout(this.my_toast_callback);
	var id = this.get_WI_PI(WordGrp);
	var word_str = snCore.Tile.TileIDArray_to_LettersString(players[id.PI].words[id.WI]);

	var confirmation_time = 600;
	this.my_toast_callback = setTimeout(function(){
	    //at point of (potentially) displaying the toast, check that mouse coordinates are not changed...
	    if( !snCore.Mouse.is_movedSincePickup(WordGrp) ){

		//This is the code that actually calls the Toast...
		snCore.DefineWord.showDefinitionToast(word_str, false);

		if(mouse_is_down){
		    snCore.Mouse.defn_toast_shown_since_mouse_down = true;
		}
	    }
	}, confirmation_time);
	
    },

    cancelDelayedDefinitionToast: function (WordGrp) {
	clearTimeout(this.my_toast_callback);
    },

    kb_WI_selected: undefined, 
    kb_ZI_selected: undefined, 
    four_square_Fabs: [[],[]], 
    do_select_callback: undefined,
    recent_defn_toast_key: false,
    KPicker_isPresent: function (action) {return this.kb_ZI_selected != undefined},

    KPicker_cycler: function (action) {

	//shopping list...
	var x1 = snCore.Tile.dims.ts;
	var x2 = snCore.Tile.dims.tslg;
	var x3 = x1/6;// little square size
	var x4 = x3/2.5;// border thickness

	function lil_square(){
	    return new fabric.Rect({
		fill: 'black',
		stroke: 'white',
		strokeWidth: x4,
		width: x3,
		height: x3,
	    });
	};

	function extend_timout(){
	    clearTimeout(snCore.DefineWord.do_select_callback);
	    snCore.DefineWord.do_select_callback = setTimeout(function(){snCore.DefineWord.KPicker_cycler('select');},600);
	};

	function create_highlight(){
	    for (var i = 0; i < 2; i++){	    
		for (var j = 0; j < 2; j++){	    
		    snCore.DefineWord.four_square_Fabs[i][j] = lil_square();
		    canvas.add(snCore.DefineWord.four_square_Fabs[i][j]);
		}
	    }
	};

	function invert_highlight(){
	    for (var i = 0; i < 2; i++){	    
		for (var j = 0; j < 2; j++){	    
		    snCore.DefineWord.four_square_Fabs[i][j].fill = 'white';
		    snCore.DefineWord.four_square_Fabs[i][j].stroke = 'black';
		}
	    }
	    snCore.Basic.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
	};

	function destroy_highlight(){
	    for (var i = 0; i < 2; i++){	    
		for (var j = 0; j < 2; j++){	    
		    canvas.remove(snCore.DefineWord.four_square_Fabs[i][j]);
		}
	    }
	    clearTimeout(snCore.DefineWord.do_select_callback);
	    snCore.DefineWord.four_square_Fabs = [[],[]];
	    snCore.DefineWord.kb_ZI_selected = undefined;
	    snCore.DefineWord.kb_WI_selected = undefined;
	    snCore.Basic.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
	};

	function highlight_word(pi, wi){
	    var W_left = snCore.Words.TileGroupsArray[pi][wi].getLeft();
	    var W_top = snCore.Words.TileGroupsArray[pi][wi].getTop();
	    var W_len = snCore.Words.TileGroupsArray[pi][wi]._objects.length;

	    var LL = [W_left, (W_left + (W_len-1)*x2 + x1 - x3 )];
	    var TT = [W_top, (W_top + x1 - x3)];
		
	    for (var i = 0; i < 2; i++){	    
		for (var j = 0; j < 2; j++){	    
		    snCore.DefineWord.four_square_Fabs[i][j].left = LL[j];
		    snCore.DefineWord.four_square_Fabs[i][j].top = TT[i];
		}
	    }
	    snCore.Basic.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
	};


	if(this.recent_defn_toast_key){
	    snCore.Toast.holdToast(this.recent_defn_toast_key, true);	    

	}else if(action == 'select'){
	    extend_timout();
	    var on_plr = snCore.Zones.PlayerZone[this.kb_ZI_selected].player.index;


	    if(this.kb_WI_selected == undefined){
		// implies we're still in the phase of cycling zones. So now, enter that zone.
		var final_p_wi = players[on_plr].words.length-1;
		this.kb_WI_selected = final_p_wi;
		invert_highlight();
	    }else{
		// we were already in a zone. So now, define a word.
		var word_str = snCore.Tile.TileIDArray_to_LettersString(players[on_plr].words[this.kb_WI_selected]);
		destroy_highlight();

		setTimeout(function(){
		    snCore.DefineWord.recent_defn_toast_key = false;
		}, 1200);

		this.recent_defn_toast_key = this.showDefinitionToast(word_str, true);
	    }

	}else if(action == 'cycle'){
	    extend_timout();
	    if(!this.KPicker_isPresent()){
		create_highlight();
		//if the client player has zero words, cycle to next zone...
		this.kb_ZI_selected = snCore.Zones.PlayerZone[0].player.words.length > 0 ? 0 : 1;
	    }else{

		// implies we're still in the phase of cycling zones...
		if(this.kb_WI_selected == undefined){
		    this.kb_ZI_selected++;
		    // handle overflow
		    if(this.kb_ZI_selected >= snCore.Zones.PlayerZone.length){
			//if the client player has zero words, cycle to next zone...
			this.kb_ZI_selected = snCore.Zones.PlayerZone[0].player.words.length > 0 ? 0 : 1;
		    }
		}else{// implies we're cycling words within some chosen zone...

		    //get the highest word index for the zone we're cycling within...		    
		    var ZIs_max_word_i = snCore.Zones.PlayerZone[this.kb_ZI_selected].player.words.length-1;

		    if(ZIs_max_word_i==0){//shortcut to 'select' effect if 6 pressed for 1 word only in zone

			//use a deferred (5ms) call to prevent issues with reference (i.e. 'this' vs. 'snCore.DefineWord')
			setTimeout(function(){snCore.DefineWord.KPicker_cycler('select');},5);

		    }else{//otherwise, cycle as normal.
			this.kb_WI_selected--;
			// underflow management
			if(this.kb_WI_selected < 0){
			    this.kb_WI_selected = ZIs_max_word_i;
			}
		    }
		}
	    }

	    var on_plr = snCore.Zones.PlayerZone[this.kb_ZI_selected].player.index;
	    var final_p_wi = players[on_plr].words.length-1;
	    var use_wi = this.kb_WI_selected == undefined ? final_p_wi : this.kb_WI_selected;
	    highlight_word(on_plr, use_wi);


	}else if(action == 'clear'){
	    destroy_highlight();
	}


    }
};
