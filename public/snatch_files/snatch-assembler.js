var Assembler = {

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

    synthesiseSnatch: function(letters_array){
	var tileID_array = [];

	this.regenerateAllWordTallies();
	this.subsetWordListOf(letters_array);
	this.regenerateFreeLettersTally();

	//here is the big recursive function call:
	var snatch_tally = this.wordTally(letters_array);
	this.Assemblies = [];
	this.ASSEMBLE([],snatch_tally,this.SubsetWordList);


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

    freeLettersTally: {},
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

