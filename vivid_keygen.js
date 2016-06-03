module.exports = function (){

    //just load the two word lists...
    var words1 = [];
    var words2 = [];

    fs = require('fs');

    // list words1
    fs.readFile("./dictionaries/adjectives.txt", 'utf8', function (err,data) {
	if (err) {return console.log(err);}

	//code to run when the file has been read into memory
	var lines = data.split("\n");
	if (lines.length < 100){console.log("There are not enough Adjectives (fewer than 100)");}
	for(var i = 0; i < 100; i++){
	    words1.push(lines[i].toLowerCase());
	}
	shuffle(words1);
    });

    // list words2
    fs.readFile("./dictionaries/nouns.txt", 'utf8', function (err,data) {
	if (err) {return console.log(err);}

	//code to run when the file has been read into memory
	var lines = data.split("\n");
	if (lines.length < 100){console.log("There are not enough Adjectives (fewer than 100)");}
	for(var i = 0; i < 100; i++){
	    words2.push(lines[i].toLowerCase());
	}
	shuffle(words2);
    });

    function pad(num, size) {
        var s = "000000000" + num;
        return s.substr(s.length-size);
    }

    console.log("Vivid keygen instance created")

    var pin_to_word_key = {};
    var word_key_to_pin = {};

    return {
	getPIN: function(){
	    var max_iter = 100000;
	    while(max_iter > 0){//trap until a free pin is found
		var N1 = randomIndex = Math.floor(Math.random() * 100);//from 0 to 99
		var N2 = randomIndex = Math.floor(Math.random() * 100);//from 0 to 99
		
		var num_pin = (100*N1 + N2);
		var pin = pad(num_pin,4);
		var key = (words1[N1] + " " + words2[N2]);

		if(pin_to_word_key[pin] == undefined){
		    pin_to_word_key[pin] = key;
		    word_key_to_pin[key] = pin;
		    break;
		}

		max_iter--;
		if(max_iter < 0){
		    console.log("Failed to generate a unique code. Have 10,000 codes aleady been requested?");
		    return undefined;
		}
	    }
	    return {
		pin: pin,
		key: key
	    };
	},
	getWORDKEYfromPIN: function(pin){return pin_to_word_key[pin];},
	getPINfromWORDKEY: function(key){return word_key_to_pin[key];},
	freePIN: function(pin){
	    if(pin_to_word_key[pin] == undefined){
		console.log("A bug in this code has caused the attempted deletion of a key which doesn't exist: '"+pin+"'");
	    }else{
		var key = pin_to_word_key[pin];
		delete pin_to_word_key[pin];
		delete word_key_to_pin[key];
	    }
	}
    };
};


//ooops this is copy-pasted other serverside code in SNATCH-CLIENT.JS

////SHUFFLE
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

	// Pick a remaining element...
	randomIndex = Math.floor(Math.random() * currentIndex);
	currentIndex -= 1;

	// And swap it with the current element.
	temporaryValue = array[currentIndex];
	array[currentIndex] = array[randomIndex];
	array[randomIndex] = temporaryValue;
    }

    return array;
}
