//this is a container for functions and data for Word creation (the generally yellow bit)...
snDraw.Game.Spell = {

    // data
    SkeletalLetters: [],
    SpellUsageCounter: {},
    SpellBottomPx: undefined,
    SpellLeftPx: undefined,

    // methods
    addLetter: function(letter){

	var x_loco_now = this.SpellLeftPx + this.SkeletalLetters.length * snDraw.Game.h_spacer;
	//prevents spelling a word that goes off (this user's screen). For a 2:1 H:W aspect, this means 10 letters long
	//note that "snDraw.Game.h_spacer" is the horizontal pixel separation of adjacent tiles in words 1.04 * tileSize
	if(!snDraw.Game.Words.xCoordExceedsWrapThreshold(x_loco_now + snDraw.Game.h_spacer)){

	    if(this.allowLetter(letter)){

		var NewSkeletal = snDraw.Game.generateTileObject({letter:letter, status:"skeletal"}, -100 + this.SkeletalLetters.length);
		this.SkeletalLetters.push(NewSkeletal);
		var spell_len = this.SkeletalLetters.length;
		var x_loco = this.SpellLeftPx + (spell_len-1) * snDraw.Game.h_spacer;


		var y_loco = this.SpellBottomPx - snDraw.Game.v_spacer;

		NewSkeletal.set({
		    left: x_loco,
		    top: y_loco
		});
		canvas.add(NewSkeletal);
		snDraw.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
	    }
	}
    },

    repositionSkeletal: function(){

	var y_loco = this.SpellBottomPx - snDraw.Game.v_spacer;

	for (var i=0; i<this.SkeletalLetters.length; i++){
	    snDraw.moveSwitchable(this.SkeletalLetters[i], true, snDraw.ani.sty_Resize,{
		top: y_loco
	    });
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
		var x_loco = this.SpellLeftPx + i * snDraw.Game.h_spacer;
		snDraw.moveSwitchable(ShiftMeSkeletal, true, snDraw.ani.sty_Sing,{
		    left: x_loco
		});
	    }
	    snDraw.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
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
	snDraw.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
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
		var some_char = snatch_string.charCodeAt(i);
		if( (some_char >= 65) && (some_char <= 90) ){//any letter key
		    letters_array.push(snatch_string[i]);//numerical checks on Charcode but push the actual "A" string
		}
	    }
	}

	var word_by_tile_indeces = Assembler.synthesiseSnatch(letters_array);
	if(false){//what happens for a unsuitable word??
	    alert("Free letters are not available to make the word \""+snatch_string+"\".");
	}

	if(word_by_tile_indeces == undefined){
	    console.log("Toast: the algorithm did not find that these letters could be used in a valid SNATCH");
	}else{
	    console.log("Sending...",word_by_tile_indeces);
	    PLAYER_SUBMITS_WORD(word_by_tile_indeces);
	}
    }
};
