snCore.Assembler = {

    Assemblies: [],
    ASSEMBLE: function(words_consumed, target_tally, words_for_consumption){
	//function calls upon global data structures assumed to be up to date:
	if(words_for_consumption.length==0){//there are no words left to try including...
	    var A = this.freeLettersTally;
	    var B = target_tally;
	    if(this.isSubset_Tally(A,B)){// [CASE 1] implies the target word can be created by including some of the free letters
		this.Assemblies.push({
		    words_used:words_consumed,
		    free_letters:target_tally//determine the letter indices of etc. - this to be done later
		});
	    }else{// [CASE 2] implies the word cannot be finished off using the free letters
		//this was a dead end of search. no data logged.
	    }
	}else{// there are words left. Try both not including and including the next word in the overall creation
	    var next_words_for_consumption = words_for_consumption.slice(1);
	    //FIRST recursive call, which attempts to exclude the next word along
	    this.ASSEMBLE(words_consumed.slice(0), target_tally, next_words_for_consumption);
	    
	    //inclusion of the next word along...
	    var A = target_tally;
	    var B = words_for_consumption[0].tally;
	    if(this.isSubset_Tally(A,B)){// implies inclusion of this word can generate the target word
		var next_words_consumed = words_consumed.slice(0);//shallow copy the data
		next_words_consumed.push(words_for_consumption[0]);//add the extra element...
		var next_target_tally = this.subractWordTallies(A,B);
		this.ASSEMBLE(next_words_consumed, next_target_tally, next_words_for_consumption);
	    }
	    //if inclusion can't generate the target word, then no recusive call => no entry into data structure i.e. Terminate
	}
    },

    synthesiseSnatch: function(letter_array, full_ret){
	var tileID_array = [];

	this.regenerateAllWordTallies();
	this.subsetWordListOf(letter_array);
	this.regenerateFreeLettersTally();

	//here is the big recursive function call:
	var snatch_tally = this.wordTally(letter_array);
	this.Assemblies = [];
	this.ASSEMBLE([],snatch_tally,this.SubsetWordList);
	this.stripAnagramOnlyOptionsfrom_Assemblies();

	//determine which assembly is best play (from PoV of scoring)...
	var max_score = -100;
	var max_score_index = undefined;
	var value_weight_opponent_letter_consumed = 1.1;
	var value_weight_own_letter_consumed = -0.7;
	for(var i=0; i < this.Assemblies.length; i++){//loop through all Assemblies
	    var score_i = 0;
	    var Ass_i = this.Assemblies[i];	    
	    //determine the value of this option
	    for(var j=0; j < Ass_i.words_used.length; j++){//loop through all words in this assembly
		var PI = Ass_i.words_used[j].player;
		var WI = Ass_i.words_used[j].word;
		var N_letters = players[PI].words[WI].length;
		var my_weight = client_player_index == PI ? value_weight_own_letter_consumed : value_weight_opponent_letter_consumed;
		score_i += N_letters * my_weight;
	    }
	    if(score_i > max_score){
		max_score = score_i;
		max_score_index = i;
	    }
	}

	if(full_ret){
	    return {ASM: this.Assemblies, best_i: max_score_index};
	}else{
	    var AnArbitraryAssembly = this.Assemblies[max_score_index];
	    if(AnArbitraryAssembly){//if there is no valid assembley, null is returns to indiate so...
		var word_tileID_array = this.Assembly_to_TileSequence(letter_array, AnArbitraryAssembly);
	    }
	    return word_tileID_array;
	}
    },

    stripAnagramOnlyOptionsfrom_Assemblies: function(){
	//strip out any assemblies here which use exactly one stolen word only (they are not valid moves)
	for(var i=0; i < this.Assemblies.length; i++){//loop through the different Assemblies
	    var Ass_i = this.Assemblies[i];
	    if(this.isZero_Tally(Ass_i.free_letters)){//no new letters are included in the word
		if(Ass_i.words_used.length <= 1){// and only one word is used...
		    //this means this assembly is just an anagram of someone's pre-existing word, and not valid:
		    this.Assemblies.splice(i,1);
		    i--;//everything beyond what had been i will be shifted back one...
		}
	    }
	}
    },

    WordData: [],
    regenerateAllWordTallies: function(){
	this.WordData = [];//clear the old data.
	for (var i=0; i<players.length; i++){
	    for (var j=0; j<players[i].words.length; j++){
		var word_ij_letters = this.tileIDs_to_letters(players[i].words[j]);
		var word_ij_tally = this.wordTally(word_ij_letters);
		//for every word 'j' of every player 'i'
		this.WordData.push({
		    player: i,
		    word: j,
		    tally: word_ij_tally
		});	
	    }
	}
    },

    SubsetWordList: [],//this is all words (represented as their letter tally objects - these include the back references)
    //whose letters are wholely contained within the candidate word.
    subsetWordListOf: function(letter_array){
	this.SubsetWordList = [];//clear the old data.
	var my_word_tally = this.wordTally(letter_array);
	for (var i=0; i<this.WordData.length; i++){
	    var subset = this.isSubset_Tally(my_word_tally, this.WordData[i].tally);
	    if(subset){
		this.SubsetWordList.push(this.WordData[i]);
	    }
	}
    },

    blankLetterTally: function(){
	return {"A":0, "B":0, "C":0, "D":0, "E":0, "F":0, "G":0, "H":0, "I":0, "J":0, "K":0, "L":0, "M":0,
		"N":0, "O":0, "P":0, "Q":0, "R":0, "S":0, "T":0, "U":0, "V":0, "W":0, "X":0, "Y":0, "Z":0};
    },

    freeLettersTally: {},
    regenerateFreeLettersTally: function(){
	var free_letter_array = [];
	//determine how many instances of 'letter' are in play (i.e. visible, whether in word or free)
	for (var i=0; i<tileset.length; i++){
	    if (tileset[i].status == 'turned'){
		if(snCore.Tile.TileArray[i].visual != "animating_in"){
		    free_letter_array.push(tileset[i].letter);
		}	    
	    }
	}
	this.freeLettersTally = this.wordTally(free_letter_array);
    },


    wordTally: function(letter_array){
	var word_tally = this.blankLetterTally();
	for (var i=0; i<letter_array.length; i++){//for every letter in the supplied word
	    word_tally[letter_array[i]]++;
	}
	return word_tally;
    },

    /*
      The form of the overall Assembly data structure is
      Array [ {free_letters: X, words_used: Y}, {etc...}]

      (note in the specific function below, we take one element of such an array)

      The form of free_letters is 
      {A:0, B:0, ...} i.e. it is a Tally

      The form of words_used is
      Array [ {player:0, word: 0, tally: {}}, {etc...}]

     */
    //this will destroy the assembly object...
    Assembly_to_TileSequence: function(letter_array, MyAssembly){
	var word_tileID_array = [];
	var free_letter_usage_tally = this.blankLetterTally();
	//for each letter in the letter array, determine a tile...
	talliedLettersUsedFromWord = [];
	for (var i=0; i<letter_array.length; i++){
	    var LETR = letter_array[i];
	    var j; //word index within the constituent words provided by the assembly object
	    var donor_word_found = false;
	    get_donor_word:
	    for (j=0; j<MyAssembly.words_used.length; j++){
		if (MyAssembly.words_used[j].tally[LETR] > 0){//this check determines if some of the required letter is present
		    donor_word_found = true;
		    break get_donor_word;
		}
	    }

	    if(talliedLettersUsedFromWord[j]==undefined){
		talliedLettersUsedFromWord[j] = this.blankLetterTally();
	    }
	    
	    if(donor_word_found){//extracting the desired tile from a word... Bear in mind the possiblity of duplicate tiles of the same letter within a word
		var player_index = MyAssembly.words_used[j].player;
		var word_index   = MyAssembly.words_used[j].word;
		var word_tally   = MyAssembly.words_used[j].tally;

		//we now use the tally as a counter, and decrement from its keys...
		word_tally[LETR]--;

		//now find the tile with the required letter in this word
		var MyWordsTiles = snCore.Words.TileGroupsArray[player_index][word_index]._objects;
		var k; //index of tile within word
		var skip_count=0;
		get_correct_letter_tile_from_word:
		for (k = 0; k<MyWordsTiles.length; k++){
		    if(MyWordsTiles[k].letter==LETR){
			if(skip_count == talliedLettersUsedFromWord[j][LETR]){
			    talliedLettersUsedFromWord[j][LETR]++;
			    break get_correct_letter_tile_from_word;
			}else{
			    skip_count++;
			}
		    }
		}
		word_tileID_array.push(MyWordsTiles[k].tileID);
	    }else{//extracting the desired tile from the pool of turned tiles. This needs not to include duplicates.
		var n_skip = free_letter_usage_tally[LETR];
		word_tileID_array.push(this.seachForTurnedTileOfLetter(LETR,n_skip));
		free_letter_usage_tally[LETR]++;
	    }
	}

	return word_tileID_array;
    },

    tileIDs_to_letters: function(word_tileID_array){
	var letter_array = [];
	for (var k=0; k<word_tileID_array.length; k++){//for every letter in the supplied word
	    letter_array.push(tileset[word_tileID_array[k]].letter);
	}
	return letter_array;
    },

    addWordTallies: function(A,B){
	var C = this.blankLetterTally();
	for (key in C){
	    C[key] = A[key] + B[key];
	}
	return C;
    },

    subractWordTallies: function(A,B){//letters of 'A' minus letters of 'B'
	var C = this.blankLetterTally();
	for (key in C){
	    C[key] = A[key] - B[key];
	}
	return C;
    },


    isEqual_Tally: function(A,B){
	for (var key in A){
	    if(A[key] != B[key]){return false;}
	}
	return true;//if none were not equal
    },

    isZero_Tally: function(A){
	for (var key in A){
	    if(A[key] != 0){return false;}
	}
	return true;//if none were not equal
    },

    isSubset_Tally: function(A,B){//tests if B letter group is a subset of A letter group
	for (key in A){
	    if(B[key] > A[key]){return false;}
	}
	return true;//if none were not equal
    },

    seachForTurnedTileOfLetter: function(myletter,n_skips){
	var tile_index_matching_letter = undefined;
	find_tile_index:
	for (var i = tileset.length-1; i>=0; i--){
	    if ((tileset[i].status == 'turned')&&(tileset[i].letter == myletter)){
		if(snCore.Tile.TileArray[i].visual != "animating_in"){
		    if(n_skips == 0){
			tile_index_matching_letter = i;
			break find_tile_index;
		    }else{
			n_skips--;
		    }
		}
	    } 
	}
	return tile_index_matching_letter;
    }

};

