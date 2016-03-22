//this is a container for functions and data for Word creation (the generally yellow bit)...
snDraw.Game.Spell = {

    // data
    SkeletalLetters: [],
    SpellUsageCounter: {},
    n_letters_unwrap: undefined,

    // methods
    addLetter: function(letter){
	if(this.allowLetter(letter)){
	    var NewSkeletal = snDraw.Game.generateTileObject({letter:letter, status:"skeletal"}, -100 + this.SkeletalLetters.length);
	    this.SkeletalLetters.push(NewSkeletal);
	    var spell_len = this.SkeletalLetters.length;
	    var B_wrap = this.n_letters_unwrap != undefined;
	    var CP = players[client_player_index];
	    var x_loco = (B_wrap ? snDraw.Game.x_plotter_R : CP.x_next_word) + (spell_len-1) * snDraw.Game.h_spacer;
	    var y_loco = (B_wrap ? snDraw.Game.v_spacer : 0) + CP.y_next_word;

	    NewSkeletal.set({
		left: x_loco,
		top: y_loco
	    });

	    canvas.add(NewSkeletal);

	    // detect if adding this letter triggers wrap
	    //note that "snDraw.Game.h_spacer" is the horizontal pixel separation of adjacent tiles in words 1.04 * tileSize
	    if((!B_wrap) && snDraw.Game.xCoordExceedsWrapThreshold(x_loco + snDraw.Game.h_spacer)){
		//this means the word is wrapped, and records how short it needs to become to unwrap...
		this.n_letters_unwrap = spell_len-2;
		//now move all those letter tiles
		for (var i=0; i<this.SkeletalLetters.length; i++){
		    snDraw.moveSwitchable(this.SkeletalLetters[i], true, snDraw.ani.sty_Sing,{
			left: (snDraw.Game.x_plotter_R + i * snDraw.Game.h_spacer),// always the line below
			top: CP.y_next_word + snDraw.Game.v_spacer// always the line below
		    });
		}
	    }
	    snDraw.more_animation_frames_at_least(1);//as an alternative to canvas.renderAll()
	}
    },

    repositionSkeletal: function(){
	//determine if wrap is required using the new coordinates...
	var CP = players[client_player_index];
	var spell_len = this.SkeletalLetters.length;
	var B_wrap = snDraw.Game.xCoordExceedsWrapThreshold(CP.x_next_word + spell_len * snDraw.Game.h_spacer);
	
	//now unconditionally move (with animation) all letters...
	var x_start = B_wrap ? snDraw.Game.x_plotter_R : CP.x_next_word;
	var y_word = (B_wrap ? snDraw.Game.v_spacer : 0) + CP.y_next_word;
	for (var i=0; i<this.SkeletalLetters.length; i++){
	    snDraw.moveSwitchable(this.SkeletalLetters[i], true, snDraw.ani.sty_Resize,{
		left: (x_start + i * snDraw.Game.h_spacer),
		top: y_word
	    });
	}

	if(B_wrap){
	    //this is somewhat crude, but the effect is to disable unwrap in the (fairly rare) case of wrap after an opponent snatch.
	    this.n_letters_unwrap = 0;
	}else{
	    this.n_letters_unwrap = undefined;
	}


    },

    removeLetter: function(spell_index){
	var RemSkeletal;
	if(spell_index!==undefined){
	    RemSkeletal = this.SkeletalLetters.splice(spell_index,1)[0];
	}else{
	    RemSkeletal = this.SkeletalLetters.pop();
	}
	if(RemSkeletal){
	    //handle removal of the letter
	    canvas.remove(RemSkeletal);
	    var letter = RemSkeletal.letter;
	    this.SpellUsageCounter[letter]--;
	    this.recolourAll(this.ListAllVisibleTilesOf(letter));

	    var B_wrap = this.n_letters_unwrap != undefined;
	    var CP = players[client_player_index];
	    // it is reduction of length that must trigger this
	    var B_unwrap_now = this.n_letters_unwrap >= this.SkeletalLetters.length;

	    if (B_unwrap_now){
		for (var i=0; i<this.SkeletalLetters.length; i++){
		    snDraw.moveSwitchable(this.SkeletalLetters[i], true, snDraw.ani.sty_Sing,{
			left: (CP.x_next_word + i * snDraw.Game.h_spacer),// always the original line
			top: CP.y_next_word// always the original line
		    });
		}
		//reset the counter
		this.n_letters_unwrap = undefined;
	    }else{//work with existing (either wrapped or unwrapped)

		//handle shifting of other letters...
		var rem_i = RemSkeletal.tileID + 100;
		for (var i=rem_i; i<this.SkeletalLetters.length; i++){
		    var ShiftMeSkeletal = this.SkeletalLetters[i];
		    ShiftMeSkeletal.tileID = i - 100;
		    var x_loco = (B_wrap ? snDraw.Game.x_plotter_R : CP.x_next_word) + i * snDraw.Game.h_spacer;
		    snDraw.moveSwitchable(ShiftMeSkeletal, true, snDraw.ani.sty_Sing,{
			left: x_loco
		    });
		}
	    }
	    snDraw.more_animation_frames_at_least(1);//as an alternative to canvas.renderAll()
	}
    },


    allowLetter: function(letter){
	var MyLetters = this.ListAllVisibleTilesOf(letter);
	//data struture maintenance only
	if(this.SpellUsageCounter[letter]==undefined){
	    this.SpellUsageCounter[letter]=0;
	}
	//use Strictly greater than, implies that there an additional letter that can be added to the spell
	var allow = MyLetters.length > this.SpellUsageCounter[letter];
	if(allow){
	    this.SpellUsageCounter[letter]++;
	    this.recolourAll(MyLetters);
	}
	return allow;
    },

    //cancel word
    CancelWord: function(){
	this.SpellUsageCounter = {};//clear the tally - important to do this before the recolor
	for (var i=0; i<this.SkeletalLetters.length; i++){
	    var RemSkeletal = this.SkeletalLetters[i];
	    var letter = RemSkeletal.letter;
	    canvas.remove(RemSkeletal);
	    this.recolourAll(this.ListAllVisibleTilesOf(letter));//to ensure all the letter types that were involved get restored in colour.
	}
	this.SkeletalLetters = [];//clear the array (lose the references to the Fabric objects. Hope they get deleted
	this.n_letters_unwrap = undefined;
	snDraw.more_animation_frames_at_least(1);//as an alternative to canvas.renderAll()
    },

    ListAllVisibleTilesOf: function(letter){
	var Objs_letter = [];
	//determine how many instances of 'letter' are in play (i.e. visible, whether in word or free)
	for (var i=0; i<tileset.length; i++){
	    if ((tileset[i].status != 'unturned')&&(tileset[i].letter==letter)){
		Objs_letter.push(snDraw.Game.TileArray[i]);
	    } 
	}
	return Objs_letter;
    },

    recolourAll: function(MyLetters){
	var n_letter_in_spell = this.SpellUsageCounter[MyLetters[0].letter];
	var visual = (MyLetters.length > n_letter_in_spell) ? "partial" : "shadow";
	if((n_letter_in_spell==0)||(n_letter_in_spell==undefined)){visual = "flipped";}
	for (var i=0; i<MyLetters.length; i++){
	    snDraw.Game.modifyTileObject(MyLetters[i],visual);    
	}
    },


    //send a candidate word to the server
    SubmitWord: function(){
	var letters_array = [];
	if(this.SkeletalLetters.length>0){//construct the letters array using the skeletal letters.
	    for(var i=0; i < this.SkeletalLetters.length; i++){
		letters_array.push(this.SkeletalLetters[i].letter);
	    }
	}else{//construct the letters array from user prompt...
	    var snatch_string = prompt("Enter Word:");
	    snatch_string = snatch_string.toUpperCase();
	    for(var i=0; i < snatch_string.length; i++){
		letters_array.push(snatch_string[i]);
	    }
	}

	var word_by_tile_indeces = Assembler.synthesiseSnatch(letters_array);
	if(false){//what happens for a unsuitable word??
	    alert("Free letters are not available to make the word \""+snatch_string+"\".");
	}
	
	console.log("Sending...",word_by_tile_indeces);
	PLAYER_SUBMITS_WORD(word_by_tile_indeces);
    }
};
