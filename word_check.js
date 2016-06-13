module.exports = function (d_path){//todo change to d_path ARRAY

    var Dictionary = {};
    var WordsArray = [];
    var t_start = new Date();
    fs = require('fs');
    fs.readFile(d_path, 'utf8', function (err,data) {

	if (err) {
	    return console.log(err);
	}

	//code to run when the file has been read into memory

	var lines = data.split("\n");
	var start_line = 2;
	
	var n_words = lines.length;
	
	for(var i=start_line; i < n_words; i++){
	    var myWord = lines[i].toUpperCase();
	    
	    if (Dictionary[myWord] == undefined){
		Dictionary[myWord] = true;
	    }
	    WordsArray.push(myWord);

	}

	var t_finish = new Date();
	var dur = t_finish.getTime() - t_start.getTime(); 
	console.log(n_words + " words loaded into memory for rapid checking in " + dur + " milliseconds");
    });

    return {
	in_dictionary: function(word) {
	    return Dictionary[word.toUpperCase()] !== undefined;
	},
	
	get_word_list: function() {return WordsArray;}
    };
}
