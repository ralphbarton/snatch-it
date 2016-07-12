module.exports = function (d_path1, d_path2){//todo change to d_path ARRAY

    var Sowpods_Dictionary = {};
    var Sowpods_Array = [];
    var Top5000_Dictionary = {};
    var Top5000_Array = [];

    var t_start = new Date();
    fs = require('fs');

    //Path 1... (supplied)
    fs.readFile(d_path1, 'utf8', function (err,data) {

	if (err) {return console.log(err);}

	//code to run when the file has been read into memory
	var lines = data.split("\n");
	var start_line = 2;
	
	var n_words = lines.length;
	
	for(var i=start_line; i < n_words; i++){
	    var myWord = lines[i].toUpperCase();
	    
	    if (Sowpods_Dictionary[myWord] == undefined){
		Sowpods_Dictionary[myWord] = true;
	    }
	    Sowpods_Array.push(myWord);

	}

	var t_finish = new Date();
	var dur = t_finish.getTime() - t_start.getTime(); 
	console.log(n_words + " words loaded into memory for rapid checking in " + dur + " milliseconds");
    });

    //Also... load the top 5000
    fs.readFile(d_path2, 'utf8', function (err,data) {

	if (err) {return console.log(err);}

	//code to run when the file has been read into memory
	var lines = data.split("\n");
	var start_line = 2;
	
	var n_words = lines.length;
	
	for(var i = start_line; i < n_words; i++){

	    var line_items = lines[i].split(',');

	    if(line_items.length == 5){
		var myWord = line_items[1].toUpperCase().trim();
		var w_rank = parseInt(line_items[0]);
		
		if (Top5000_Dictionary[myWord] == undefined){
		    Top5000_Dictionary[myWord] = w_rank;
		}

		if(i==5){
		    console.log(Top5000_Dictionary);
		}
		Top5000_Array.push(myWord);
	    }

	}
	console.log("Also loaded words from COCA top 5000");
    });


    return {
	in_dictionary: function(word) {
	    return Sowpods_Dictionary[word.toUpperCase()] !== undefined;
	},
	
	get_word_list: function() {return Sowpods_Array;},

	get_top5000_list: function() {return Top5000_Array;}
    };
}
