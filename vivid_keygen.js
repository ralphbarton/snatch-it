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

    console.log("Vivid keygen instance created")

    return function(){
	var N1 = randomIndex = Math.floor(Math.random() * 100);//from 0 to 99
	var N2 = randomIndex = Math.floor(Math.random() * 100);//from 0 to 99
	return {
	    pin: (100*N1 + N2),
	    key: (words1[N1] + " " + words2[N2])
	};
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
