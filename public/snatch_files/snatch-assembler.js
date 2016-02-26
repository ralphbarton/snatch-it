var Assembler = {

    Assemblies: [],
    ASSEMBLE: function(made, to_make, subset_words){
	//function calls upon global data structures assumed to be up to date:
	if(subset_words.length==0){//implies there are no words left to demand attempted inclusion of.
	    var A = this.freeLettersTally;
	    var B = to_make;
	    if(isSubset_Tally(A,B)){// [CASE 1] implies the target word can be created by including some of the free letters
		 this.Assemblies.push(XXXXXXX);//determine the letter indices of etc.
	    }else{// [CASE 2] implies the word cannot be finished off using the free letters
		//
	    }
	}else{// must attempt to include at least one word in creating the target word
	    var next_subset_words = subset_words.slice(1);
	    var A = to_make;
	    var B = subset_words[0];
	    if(isSubset_Tally(A,B)){// implies inclusion of this word can generate the target word
		    var next_made = made.slice(0);
		    next_made.push(B);

		if(isEqual_Tally(A,B)){// [CASE 3] implies inclusion of this word completes the target word
		    this.Assemblies.push({words_used:next_made});

		}else{// [CASE 4] implies that after inclusion of this word, more letters still needed to complete the target word
		    var next_to_make = subractWordTallies(A,B);
		    this.ASSEMBLE(next_made, next_to_make, next_subset_words);
		}
	    }else{// [CASE 5] implies inclusion of this word can't generate the target word. Skip it.
		this.ASSEMBLE(made, to_make, next_subset_words);
	    }
	}
    },

    synthesiseSnatch: function(letters_array){
	var tileID_array = [];

	this.regenerateAllWordTallies();
	this.subsetWordListOf(letters_array);


	console.log("WordData",this.WordData);
	console.log("SubsetWordList",this.SubsetWordList);


	//this code is simple and only assembles the SNATCH out of the free letters. To be updated.
	for (var i=0; i<letters_array.length; i++){//work through the word from the beginning
	    for (var j=tileset.length-1; j>=0; j--){//work through the unused tiles from the end
		if ((tileset[j].status == 'turned')&&(tileset[j].letter==letters_array[i])){
		    if(!contains(tileID_array,j)){
			tileID_array.push(j);
			j=-1;//this is to break the inner loop
		    }
		} 
	    }
	}

	return tileID_array;
    },


    //Maybe work on the more complex case of continuous maintainance later...
    /*
    addWordAsTally_from_tileIDs: function(tile_ids){
	

    },*/

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

    freeLettersTally: [],
    regenerateFreeLettersTally: function(){
	var free_letters_array = [];
	//determine how many instances of 'letter' are in play (i.e. visible, whether in word or free)
	for (var i=0; i<tileset.length; i++){
	    if (tileset[i].status == 'turned'){
		free_letters_array.push(tileset[i].letter);
	    } 
	}
	this.freeLettersTally = this.wordTally(free_letters_array);
    },


    wordTally: function(letter_array){
	var word_tally = this.blankLetterTally();
	for (var i=0; i<letter_array.length; i++){//for every letter in the supplied word
	    word_tally[letter_array[i]]++;
	}
	return word_tally;
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

    isSubset_Tally: function(A,B){//tests if B letter group is a subset of A letter group
	for (key in A){
	    if(B[key] > A[key]){return false;}
	}
	return true;//if none were not equal
    }

};

