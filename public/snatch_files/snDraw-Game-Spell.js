//this is a container for functions and data for Word creation (the generally yellow bit)...
snDraw.Game.Spell = {

    //Advanced_Speller - data
    SkeletalLetters: [],
    SpellUsageCounter: {},
    n_letters_unwrap: undefined,

    //Advanced_Speller - method
    addLetter: function(letter){
	if(this.allowLetter(letter)){
	    var NewSkeletal = snDraw.Game.generateTileObject({letter:letter, status:"skeletal"}, -100 + this.SkeletalLetters.length);
	    this.SkeletalLetters.push(NewSkeletal);
	    var spell_len = this.SkeletalLetters.length;
	    var B_wrap = this.n_letters_unwrap == undefined;
	    var CP = players[client_player_index];
	    var x_loco = (B_wrap ? snDraw.Game.x_plotter_R : CP.x_next_word) + (spell_len-1) * snDraw.Game.h_spacer;
	    var y_loco = (B_wrap ? snDraw.Game.v_spacer : 0) + CP.y_next_word;

	    //TODO: add wrap condition...

	    NewSkeletal.set({
		left: x_loco,
		top: y_loco
	    });

	    canvas.add(NewSkeletal);

	    if((B_wrap) && snDraw.Game.xCoordExceedsWrapThreshold(x_loco)){ // adding this letter has trigged wrap
		//this means the word is wrapped, and records how short it needs to become to unwrap...
		this.n_letters_unwrap = spell_len-2;
		//now move all those letter tiles
		for (var i=0; i<this.SkeletalLetters.length; i++){

		    snDraw.moveSwitchable(this.SkeletalLetters[i], true, snDraw.ani.sty_Sing,{
			left: (snDraw.Game.x_plotter_R + i * snDraw.Game.h_spacer),
			top: CP.y_next_word + snDraw.Game.v_spacer
		    });

		}
	    }

	    snDraw.setFrameRenderingTimeout (100);//as an alternative to canvas.renderAll()
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
	snDraw.setFrameRenderingTimeout(100);//as an alternative to canvas.renderAll()
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
	    //handle shifting of other letters...
	    var rem_i = RemSkeletal.tileID + 100;
	    for (var i=rem_i; i<this.SkeletalLetters.length; i++){
		var ShiftMeSkeletal = this.SkeletalLetters[i];
		ShiftMeSkeletal.tileID = i - 100;


		//TODO unwraping here......



		var x_loco = players[client_player_index].x_next_word + i * snDraw.Game.h_spacer;
		snDraw.moveSwitchable(ShiftMeSkeletal, true, snDraw.ani.sty_Sing,{
		    left: x_loco
		});
	    }
	    snDraw.setFrameRenderingTimeout(100);//as an alternative to canvas.renderAll()
	}
    },

    dialogueWordEntry: function(){
	var snatch_string = prompt("Enter Word:");
	snatch_string = snatch_string.toUpperCase();

	//For each letter in the user's string, find it (starting at final) in the tile set
	//At this stage, only consider unused tiles as includable

	var snatch_tile_ids = [];

	for(var i=0; i<snatch_string.length; i++){
	    //use a crude method for ensuring double letters in the word get matched to double letters (or more) present amoung the tiles:
	    //this is: for each new tile ID included, ensure that it is not already included
	    for(var j=tileset.length-1; j>=0; j--){
		if((tileset[j].letter == snatch_string[i])&&(tileset[j].status == "turned")){
		    // matching letter found among tiles
		    var used_already = false;
		    for(var k=0; k<snatch_tile_ids.length; k++){
			used_already = (used_already || (snatch_tile_ids[k] == j));
		    }
		    if(!used_already){
			snatch_tile_ids[i] = j;
			j=-1;//break out of the tile search string;
		    }
		    
		}//loop k
	    }//loop j
	}//loop i
	if(snatch_tile_ids.length!=snatch_string.length){
	    alert("Free letters are not available to make the word \""+snatch_string+"\".");
	}else{
	    PLAYER_SUBMITS_WORD(snatch_tile_ids);
	}
    },

    //send a candidate word to the server
    SubmitWord: function(){
	var letters_array = [];
	for(var i=0; i < this.SkeletalLetters.length; i++){
	    letters_array.push(this.SkeletalLetters[i].letter);
	}
	var word_by_tile_indeces = Assembler.synthesiseSnatch(letters_array);
	console.log("Sending...",word_by_tile_indeces);
	PLAYER_SUBMITS_WORD(word_by_tile_indeces);
    }
};
