var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


//the following 11 lines of code taken from http://expressjs.com/en/advanced/developing-template-engines.html
var fs = require('fs'); // this engine requires the fs module
app.engine('ntl', function (filePath, options, callback) { // define the template engine
  fs.readFile(filePath, function (err, content) {
    if (err) return callback(new Error(err));
    // this is an extremely simple template engine
    var rendered = content.toString().replace('#identity-html#', options.identity_html);
    return callback(null, rendered);
  });
});
app.set('views', './views'); // specify the views directory
app.set('view engine', 'ntl'); // register the template engine


//serve all public files as static webserver functionality...
app.use(express.static('public'));

var qty_tiles = 100;

// import the "snatch-server" module
var snatchSvr_factory = require('./snatch-server.js');

// Import the "word definition auto-searcher" module
var SDC_factory = require('./scrape_definition_client.js');
var my_SDC = SDC_factory();

// Import the unique vivid-word key generator
var keygen  = require('./vivid_keygen.js')();

// Load the SOWPODS dictionary...
var WDT_factory = require('./word_check.js');
var WordDictionaryTools = WDT_factory('./dictionaries/sowpods.txt');

 
//START OF experimental code secion
// code to enable web-facing testing of the word Definition tool
var prev_result = undefined;
var prev_word = undefined;
var word_dictionary = {};
my_SDC.rEvent.on('searchComplete', function(result){
    prev_result = result;
    // this does not limit definitions to rooms.
    // Work needed for this whole aspect of linking reponse to original asynchronous request
    io.emit('new word definition', {word: prev_word, definition: prev_result});	    
    word_dictionary[prev_word] = prev_result;
});


//route 3 - for testing of the definition scraping...
app.get('/definition/*', function(req, res){
    var frags = req.url.split('/');
    var word = frags[frags.length-1];
    my_SDC.lookup_definition(word);
    res.send('You have just looked up: ' + word + '. <br> Previously, you\
 looked up ' + prev_word + ' and a search result was:<br>' + prev_result);
    prev_word = word;
});

//route 4 - to get random words...
app.get('/sowpods-rsubset/*', function(req, res){
    var frags = req.url.split('/');
    var final_arg = frags[frags.length-1];
    var n_words_req = parseInt(final_arg);
    
    var sowpods_array = WordDictionaryTools.get_word_list();
    var result = "List of "+n_words_req+" words from the SOWPODS dictionary:<br><br>";

    for(var i=0; i < n_words_req; i++){
	var rand_index = Math.floor(Math.random() * sowpods_array.length);
	result += sowpods_array[rand_index] + "<br>";
    }
    res.send(result);

});


//END OF experimental code secion



//route 1 - no path...
app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/snatch_files/home.html');
});


//route 2 - join path...
app.get('/join=*', function (req, res) {
    var frags = req.url.split('=');
    var identity_supplied = frags[frags.length-1];

    var valid_pin = undefined;
    var dash_key = undefined;//i.e. pink-elephant
    var space_key = undefined;//i.e. pink elephant

    // this code leads to setting of 'valid_pin' and 'dash_key'
    if((!isNaN(identity_supplied)) && (identity_supplied.length==4)){// first test: is it a 4 digit numeric string?
	if(rooms_table[identity_supplied] !== undefined){// is it a PIN of an existant game?
	    var valid_pin = identity_supplied;
	    var dash_key = rooms_table[valid_pin].room_key.replace(" ","-");
	}
    }else if(/^[a-zA-Z-]+$/.test(identity_supplied)){//second test: is it a string composed only of letters and '-'?
	space_key = identity_supplied.replace("-"," ");
	valid_pin = keygen.getPINfromWORDKEY(space_key);
	if (valid_pin != undefined){
	    dash_key = rooms_table[valid_pin].room_key.replace(" ","-");//conversion back-forth may fix capitalisation
	}
    }

    if(valid_pin != undefined){
	var my_html = '<div id="pin">' + valid_pin + '</div>\n<div id="key">'+ dash_key +'</div>\n';
	res.render('snatch', {identity_html: my_html});
	access_room(valid_pin);//extend time out due to link usage.
    }else{
	console.log(identity_supplied + ' was not detected as a valid game identity. Homepage served instead');
	res.sendFile(__dirname + '/public/snatch_files/home.html');
    }
});

// a hash table, note how it is global for all connection. It contains details for a particular room, they are:
/*
  {
  status: str,
  room_key: str,
  closeTimeoutID: int,
  timeStarted: Date,
  timeAccessed: Date,
  GameInstance: Obj
  }
*/

// note that the keys of this associative array are values taken by room_pin e.g. "1234"
var rooms_table = {};


function close_room(room_pin){
    console.log("Closing room [" + rooms_table[room_pin].room_key + "] / [" + room_pin + "] due to inactivity");
    keygen.freePIN(room_pin);
    delete rooms_table[room_pin];
    io.to(room_pin).emit('room closed', 0);//probably no one gets this message anyhow.
}

function access_room(room_pin){
    var R = rooms_table[room_pin];

    //clear the old timeout by reference...
    if(R.closeTimeoutID !== undefined){
	clearTimeout(R.closeTimeoutID);
    }

    //Add a new timeout. Retain the reference.
    R.closeTimeoutID = setTimeout(function(){
	close_room(room_pin);
    }, 1000 * 60 * 60 * 3);//3 hours persistence
//    }, 1000 * 60 * 10);// 10 minues persistence
    console.log("["+room_pin+"] - timout extended...");

    //Add
    R.timeLastAccessed = new Date;

}


// todo introduce IP based logging.
var ip_history = {};

io.on('connection', function(socket){

    //basic logging
    var client_ip = socket.handshake.headers['x-real-ip'];
    var client_ua = parse_user_agent(socket.handshake.headers['user-agent']);

    console.log('A user at ip = ' + client_ip + ' connected with socket.id: ' + socket.id);

    socket.on('disconnect', function(){

	if(socket.room_pin){
	    var myGame = rooms_table[socket.room_pin].GameInstance;
	}
	if(myGame){
	    var dis_pl_i = myGame.playerIndexFromSocket(socket.id);
	}

	// only if (1) the socket is assigned a .room_pin property (2) a game exist there (should always be true...)
	// (3) the client at the socket actually entered the game and became a player.
	if(dis_pl_i !== undefined){
	    var dis_pl_i = myGame.playerIndexFromSocket(socket.id);
	    socket.broadcast.to(socket.room_pin).emit('player disconnected',dis_pl_i);
	    var dis_pl_name = myGame.getPlayerObject(socket.id).name;
	    myGame.removePlayer(socket.id);
	    console.log('Player ' + dis_pl_i + ' (' + dis_pl_name + ') disconnected (socket.id = ' + socket.id + ')');
	}else{
	    console.log('Connection closed (socket.id = ' + socket.id + ') - no player associated...');
	}
    });

    //the server pongs back the heartbeat message to the specific client that sent.
    socket.on('client heartbeat', function(){
    	socket.emit('heartbeat server ack', 0);
    });


    socket.on('request to init room', function (data){

	// create a new unique tag... the form will be {key: "word word", pin: 1234}
	var key_deets = keygen.getPIN();
	//todo use 
	var room_pin = key_deets.pin;

	// 2. Now create a new room instance, referenced by the room_pin
	rooms_table[room_pin] = {
	    status: "new",
	    room_key: key_deets.key,
	    closeTimeoutID: undefined,
	    timeStarted: (new Date),
	    timeAccessed: undefined,
	    GameInstance: snatchSvr_factory(qty_tiles, WordDictionaryTools.in_dictionary)
	};
	access_room(room_pin);//this perhaps ought to be part of constructor. Needed to put timeout in place.

	console.log("New game created: ", key_deets);
    	socket.emit('new game pin and key', key_deets);
    });




    socket.on('request rooms list', function (no_data){

	//convert the hash table into a list for the client to display...
	var rooms_data_array = [];
	for (var room_pin in rooms_table) {
	    if (rooms_table.hasOwnProperty(room_pin)) {

		var R = rooms_table[room_pin];
		var gameObj = R.GameInstance.getGameObject();

		rooms_data_array.push({
		    room_key: R.room_key,
		    room_pin: room_pin,
		    n_players: (gameObj.playerSet.length),
		    duration: (new Date - R.timeStarted)/1000,
		    n_tiles_turned: (gameObj.tile_stats.n_turned)
		});
	    }
	}

    	socket.emit('rooms list', rooms_data_array);
	console.log("Rooms list sent to an anonymouse client...");
    });




    socket.on('join room and start', function (room_pin){

	//respond by providing a set of colours to choose between
	console.log("'join room and start' message recieved. Room = " + room_pin);
	var myRoom = rooms_table[room_pin];

	if(myRoom !== undefined){

	    //note this is only for non-undefined room
	    access_room(room_pin);
	    
	    //just add a custom property to the socket object.
	    socket.room_pin = room_pin;
	    //this causes the socket to be subscribed to room-specific broadcasts...
	    socket.join(room_pin);
	    myRoom.status = "joined";

	    var myGame = myRoom.GameInstance;
	    var gameObj = myGame.getGameObject();
	    var colorChoices = myGame.provideColorChoice(socket.id)
	    var msg_obj = {color_choice: colorChoices,
			   players_t: gameObj.playerSet	    
			  };

	    //this data structure needs to be generated by the myGame object...
	    socket.emit('player color choices', msg_obj);

	}else{
	    console.log("somehow, the client requested an non-existant room");
	}

    });



    //client provides player details, which is also a request for the full game state
    socket.on('player joined with details', function (details_obj){
	access_room(socket.room_pin); // log that the game was accessed

	//this newly joined player can be added to the game...
	console.log('player joined with details : ' + JSON.stringify(details_obj));
	var myGame = rooms_table[socket.room_pin].GameInstance;
	myGame.addPlayer(details_obj, socket.id);

	//index to the new joiner
	var pl_i = myGame.playerIndexFromSocket(socket.id);
	socket.emit('give client their player index', pl_i);

	//gamestate to the new joiner
	var gameObj = myGame.getGameObject();
	socket.emit('full game state transmission', gameObj);//now just transmit to the new player
	socket.emit('word definitions dictionary', word_dictionary);
	
	//new joiner to the rest of the players
	var rPID = details_obj.reclaiming_player_index;
	var player_join_details = {
	    rejoin_PID: rPID,
	    device_type: device_intepret(client_ua)
	};

	if(rPID == undefined){
	    player_join_details["player_object"] = myGame.getPlayerObject(socket.id);
	}

	socket.broadcast.to(socket.room_pin).emit('player has joined game', player_join_details);
    });



    socket.on('player submits word', function(tile_id_array){
	access_room(socket.room_pin); // log that the game was accessed

	console.log("["+socket.room_pin+"]: Snatch submission with letters: ",tile_id_array);
	var myGame = rooms_table[socket.room_pin].GameInstance;
	var SnatchResponse = myGame.playerSnatches(tile_id_array, socket.id)

	if(SnatchResponse.val_check == 'accepted'){
	    io.to(socket.room_pin).emit('snatch assert', SnatchResponse.SnatchUpdateMsg);	    
	    
	    // also, we now take the chance to look up the accepted work in the real dictionary (web-scrape a website)
	    // response of the scrape-script with trigger further (anonymous) actions
	    var word_str = myGame.TileIDArray_to_LettersString(tile_id_array);
	    my_SDC.lookup_definition(word_str);
	    console.log("Web-scraping defintion of word " + word_str);
	    prev_word = word_str;

	}else{
	    // where client snatch request is rejected because it is duplicate & invalid, don't even respond
	    if(SnatchResponse.val_check != 'duplicate'){
		socket.emit('snatch rejected', SnatchResponse.val_check);
	    }
	}
    });




    //client requests to turn over a tile
    socket.on('tile turn request', function(blank_msg){
	access_room(socket.room_pin); // log that the game was accessed
	var myGame = rooms_table[socket.room_pin].GameInstance;
	var newTile_info = myGame.flipNextTile(socket.id);
	io.to(socket.room_pin).emit('new turned tile', newTile_info);
	if(newTile_info){
	    console.log("["+socket.room_pin+"]: PI=" + newTile_info.flipping_player + " flips tileID=" + newTile_info.tile_index + " (" + newTile_info.tile_letter + ")");
	}else{
	    console.log("All tiles turned - flip message recieved...");
	}
    });


    //client requests to turn over a tile
    socket.on('many_tile_turn_hack', function(n_tiles){

	var myGame = rooms_table[socket.room_pin].GameInstance;

	var letters = [];
	var tileID_first = undefined;
	var tileID_final = undefined;
	var fl_player = undefined;
	var period = 100;

	var R1 = function(i){
	    var newTile_info = myGame.flipNextTile(socket.id);
	    if(newTile_info){
		io.to(socket.room_pin).emit('new turned tile', newTile_info);
		letters.push(newTile_info.tile_letter);
		tileID_final = newTile_info.tile_index
		fl_player = newTile_info.flipping_player;
		if(i==0){tileID_first = newTile_info.tile_index;}
		if(i < n_tiles){setTimeout(function(){R1(i+1);},period);}//here is the recursive call achieving simple looping...
	    }
	    if(i >= n_tiles){
		if(tileID_final !== undefined){
		    console.log("PI=" + fl_player + " has turned multiple tiles at once, from\
tileID=" + tileID_first + " to tileID=" + tileID_final + ". The letters are: " + letters);
		}else{
		    console.log("All tiles turned");
		}

	    }
	};
	R1(0);

    });


});

http.listen(3008,'127.0.0.1');
console.log('Snatch server, listening on 127.0.0.1:3008');


function parse_user_agent(ua){
    //bit of code taken from https://jsfiddle.net/oriadam/ncb4n882/
    //it cannot distinguish my Android tablet from my Android phone, but it'll do...
    var
    browser = /Edge\/\d+/.test(ua) ? 'ed' : /MSIE 9/.test(ua) ? 'ie9' : /MSIE 10/.test(ua) ? 'ie10' : /MSIE 11/.test(ua) ? 'ie11' : /MSIE\s\d/.test(ua) ? 'ie?' : /rv\:11/.test(ua) ? 'ie11' : /Firefox\W\d/.test(ua) ? 'ff' : /Chrome\W\d/.test(ua) ? 'gc' : /Chromium\W\d/.test(ua) ? 'oc' : /\bSafari\W\d/.test(ua) ? 'sa' : /\bOpera\W\d/.test(ua) ? 'op' : /\bOPR\W\d/i.test(ua) ? 'op' : typeof MSPointerEvent !== 'undefined' ? 'ie?' : '',
    os = /Windows NT 10/.test(ua) ? "win10" : /Windows NT 6\.0/.test(ua) ? "winvista" : /Windows NT 6\.1/.test(ua) ? "win7" : /Windows NT 6\.\d/.test(ua) ? "win8" : /Windows NT 5\.1/.test(ua) ? "winxp" : /Windows NT [1-5]\./.test(ua) ? "winnt" : /Mac/.test(ua) ? "mac" : /Linux/.test(ua) ? "linux" : /X11/.test(ua) ? "nix" : "",
    mobile = /IEMobile|Windows Phone|Lumia/i.test(ua) ? 'w' : /iPhone|iP[oa]d/.test(ua) ? 'i' : /Android/.test(ua) ? 'a' : /BlackBerry|PlayBook|BB10/.test(ua) ? 'b' : /Mobile Safari/.test(ua) ? 's' : /webOS|Mobile|Tablet|Opera Mini|\bCrMo\/|Opera Mobi/i.test(ua) ? 1 : 0,
    tablet = /Tablet|iPad/i.test(ua);

    // create a JS object from the parsed userAgent string...
    return {
	browser: browser,
	os: os,
	mobile: mobile,
	tablet: tablet
    };
}

function device_intepret(ua_obj){

    console.log("ua_obj",ua_obj);

    browser_convert = {
	"ed": "Microsoft Edge",
	"ie9": "Explorer 9",
	"ie10": "Explorer 10",
	"ie11": "Explorer 11",
	"ie?": "Explorer of unknown version",
	"ff": "Firefox",
	"gc": "Chrome",
	"oc": "Chromium",
	"sa": "Safari",
	"op": "Opera"
    };
    conv_b = browser_convert[ua_obj.browser];

    os_convert = {
	"win7": "Windows 7",
	"win8": "Windows 8",
	"win9": "Windows 9",
	"win10": "Windows 10",
	"winvista": "Windows Vista",
	"winxp": "Windows XP",
	"winnt": "Windows NT",
	"mac": "Apple",
	"linux": "Linux",
	"nix": "Nix"
    };
    conv_o = os_convert[ua_obj.os];

    mobile_convert = {
	"0": "Not mobile/tablet",
	"w": "Nokia or other Windows Phone",
	"i": "iOS - iPhone or iPad",
	"a": "Android",
	"b": "Blackberry",
	"s": "Safari on non-iphone",
	"1": "Other mobile or undetected"
    };

    //The string returned needs to stand in place of X in the sentence: "Alex connected on X"
    switch (ua_obj.tablet){
    case true:
	return "a tablet";
    case false:
	switch (ua_obj.mobile) {// confusingly, this variable may be type string or integer in the different cases...
	case 0:
	    return "a desktop computer ("+conv_o+" / "+conv_b+")";
	case "w":
	    return "mobile (Windows phone)";
	case "i":
	    return "mobile (iPhone)";
	case "a":
	    return "mobile (Android)";// since it always seems to detect the browser as Chrome on an Andoid, even using
	    //something else, I did not think there was much point in browser detection in the mobile case.
	case "b":
	    return "mobile (Blackberry)";
	case "s":
	    return "mobile (Safari on non-iphone)";
	case 1://I assume this is 1 as an integer...
	    return "mobile";
	}
    }
}
