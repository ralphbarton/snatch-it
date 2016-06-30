//this is a container for functions and data for Word creation (the generally yellow bit)...
snCore.Spell = {

    // data
    SkeletalLetters: [],
    SpellUsageCounter: {},
    SpellTopPx: undefined,
    SpellLeftPx: undefined,

    // methods
    addLetter: function(letter){

	if(snCore.Event.game_ended){
	    snCore.Toast.game_fin();
	}else{
	    var x_loco_now = this.SpellLeftPx + this.SkeletalLetters.length * snCore.Tile.dims.tslg;
	    var x_loco_max = snCore.Basic.canv_W - snCore.Tile.dims.tslg;
	    //prevents spelling a word that goes off (this user's screen). This does impose a max snatch length.
	    if(x_loco_now < x_loco_max){// replaces "wrap threshold" func. May be inexact. seems quite good.

		if(this.allowLetter(letter)){

		    var NewSkeletal = snCore.Tile.generateTileObject({letter:letter, status:"skeletal"}, -100 + this.SkeletalLetters.length);
		    this.SkeletalLetters.push(NewSkeletal);
		    var spell_len = this.SkeletalLetters.length;
		    var x_loco = this.SpellLeftPx + (spell_len-1) * snCore.Tile.dims.tslg;


		    var y_loco = this.SpellTopPx;

		    NewSkeletal.set({
			left: x_loco,
			top: y_loco
		    });
		    canvas.add(NewSkeletal);
		    snCore.Basic.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()

		    //'logical validity' of the word in the spell may have changed. Recolour button accordingly
		    this.indicateN_validMoves_onButton();

		    //Adding letter to spell is a user-active eveny. Clear Persistent Toasts
		    snCore.Toast.clear_all_persistent();

		    return true;
		}
	    }
	}

	//indicates whether a letter was actually added...
	return false;
    },

    //for when tile size is changed.
    redrawResizedSpell: function(){

	var letters_array = snCore.Tile.TileArray_to_LettersArray(this.SkeletalLetters);

	//remove all existing letters
	for(var i=0; i < letters_array.length; i++){
	    this.removeLetter();
	}

	//add letters back again.
	for(var i=0; i < letters_array.length; i++){
	    this.addLetter(letters_array[i]);
	}
    },

    //function formerly repositionSkeletal (with no parameters)
    setSpellPosition: function(newLeftPx, newTopPx, ani_oC, ani_sty){

	if(newLeftPx !== null){this.SpellLeftPx = newLeftPx;}
	if(newTopPx !== null){this.SpellTopPx = newTopPx;}

	for (var i=0; i<this.SkeletalLetters.length; i++){
	    snCore.Basic.moveSwitchable(this.SkeletalLetters[i], ani_oC, ani_sty,{
		top: (this.SpellTopPx)
	    });
	}
    },

    //note that the single argument for this function, 'removeLetter' is optional, and the last letter is removed if
    //no parameter is provided.
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
		var x_loco = this.SpellLeftPx + i * snCore.Tile.dims.tslg;
		snCore.Basic.moveSwitchable(ShiftMeSkeletal, true, snCore.Basic.ani.sty_Sing,{
		    left: x_loco
		});
	    }

	    //'logical validity' of the word in the spell may have changed. Recolour button accordingly
	    this.indicateN_validMoves_onButton();

	    snCore.Basic.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
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
	this.indicateN_validMoves_onButton();//cancelling word always has the effect of disabling "SNATCH-IT"
	snCore.Basic.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
    },

    ListAllVisibleTilesOf: function(letter){
	var Objs_letter = [];
	//determine how many instances of 'letter' are in play (i.e. visible, whether in word or free)
	for (var i=0; i<tileset.length; i++){
	    if ((tileset[i].status != 'unturned')&&(tileset[i].letter==letter)){
		Objs_letter.push(snCore.Tile.TileArray[i]);
	    } 
	}
	return Objs_letter;
    },

    recolourAll: function(MyLetters){
	var n_letter_in_spell = this.SpellUsageCounter[MyLetters[0].letter];
	var visual = (MyLetters.length > n_letter_in_spell) ? "partial" : "shadow";
	if((n_letter_in_spell==0)||(n_letter_in_spell==undefined)){visual = "flipped";}
	for (var i=0; i<MyLetters.length; i++){
	    snCore.Tile.modifyTileObject(MyLetters[i],visual);    
	}
    },


    indicateN_validMoves_onButton: function(){

	var N_valid_moves = undefined;
	    var DotSet = [];
	if(this.SkeletalLetters.length<3){
	    N_valid_moves = 0;//no valid moves involves fewer than 3 letters
	}else{
	    var letters_array = snCore.Tile.TileArray_to_LettersArray(this.SkeletalLetters);
	    var AssemblyData = snCore.Assembler.synthesiseSnatch(letters_array,true);
	    var best_i_in_ASM = AssemblyData ? AssemblyData.best_i : undefined;

	    var AssemblySet = AssemblyData.ASM;
	    for(var i=0; i < AssemblySet.length; i++){//loop through the different Assemblies
		DotSet[i] = [];
		for(var j=0; j < AssemblySet[i].words_used.length; j++){//loop through words used in each Assembly
		    DotSet[i].push(AssemblySet[i].words_used[j].player);
		}
	    }
	    N_valid_moves = AssemblySet.length;
	}
	snCore.Controls.modifySNATCHbuttonBar(DotSet, best_i_in_ASM);
	snCore.Controls.setButtonDisabled(2, N_valid_moves == 0);
    },

    //send a candidate word to the server
    SubmitWord: function(){
	var letters_array = [];
	if(snCore.Event.game_ended){
	    snCore.Toast.game_fin();
	    return null;
	}
	if(this.SkeletalLetters.length>0){//construct the letters array using the skeletal letters.
	    if(this.SkeletalLetters.length<3){
		snCore.Toast.showToast("Words must be 3 letters or more");
		return null;
	    }
	    var letters_array = snCore.Tile.TileArray_to_LettersArray(this.SkeletalLetters);

	}else{//construct the letters array from user prompt...
	    var snatch_string = prompt("Enter Word:");
	    if((snatch_string == null)||(snatch_string.length < 3)){
		snCore.Toast.showToast("Words must be 3 letters or more");
		return null;
	    }
	    snatch_string = snatch_string.toUpperCase();
	    for(var i=0; i < snatch_string.length; i++){
		var some_char = snatch_string.charCodeAt(i);
		if( (some_char >= 65) && (some_char <= 90) ){//any letter key
		    letters_array.push(snatch_string[i]);//numerical checks on Charcode but push the actual "A" string
		}
	    }
	}

	var word_by_tile_indeces = snCore.Assembler.synthesiseSnatch(letters_array);
	if(word_by_tile_indeces == undefined){
	    snCore.Toast.showToast("The letters " + letters_array + " are not a valid move");
	}else{
	    console.log("Sending...",word_by_tile_indeces);
	    PLAYER_SUBMITS_WORD(word_by_tile_indeces);
	}
    }
};
