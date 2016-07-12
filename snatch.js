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
    var rendered = content.toString().replace('#identity-html#', options.identity_html).replace('#html-1#', options.html1).replace(/#FF#/g, options.fileset);
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
var WordDictionaryTools = WDT_factory('./dictionaries/sowpods.txt', './dictionaries/COCA_top5000_word_frequencies.txt');

 
//START OF experimental code secion
// code to enable web-facing testing of the word Definition tool
var word_dictionary = {};
var prev_word = undefined;
var prev_result = undefined;
my_SDC.rEvent.on('searchComplete', function(result){
    var BSres = JSON.parse(result);
/*  {
	word_queried: <string>
	word_defined: <string>
	n_definitions: <int>
	DefnList: <Array>
    }*/
    prev_word = BSres.word_queried;
    
    prev_result = BSres.DefnList.length>0 ? BSres.DefnList[0] : "No entry in dictionary.com";
    //prev_result = JSON.stringify(BSres.DefnList);

    // this does not limit definitions to rooms.
    // Work needed for this whole aspect of linking reponse to original asynchronous request
    console.log("BS search completed for word : " + prev_word);
    io.emit('new word definition', BSres);	    
    word_dictionary[prev_word] = BSres;
});


//route 3 - for testing of the definition scraping...
app.get('/definition/*', function(req, res){
    var frags = req.url.split('/');
    var word = frags[frags.length-1];
    my_SDC.lookup_definition(word);
    res.send('You have just looked up: ' + word + '. <br> Previously, you\
 looked up ' + prev_word + ' and a search result was:<br>' + prev_result);
});

//route 4 - to get random words...
app.get('/random-defns/*', function(req, res){
    var frags = req.url.split('/');
    var final_path = frags[frags.length-1];

    var req_frags = final_path.split('&');

    var n_words_req = parseInt(req_frags[0]);
    var chosen_wl_tag = req_frags[1] || 'top5000';


    var N_WORDS_MAX = 350
    n_words_req = Math.min(n_words_req, N_WORDS_MAX);

    var chosen_word_list = WordDictionaryTools.get_word_list();
    if(chosen_wl_tag == 'top5000'){
	chosen_word_list = WordDictionaryTools.get_top5000_list();
    }

    var HTM = '<div class="table-title">\
<h3>List of '+n_words_req+' words from the ' + chosen_wl_tag + ' dictionary:</h3>\
</div>\n';

    HTM += '<table class="table-fill">\
<thead>\
<tr>\
<th class="text-left">Word</th>\
<th class="text-left">Web-scraped definition...</th>\
</tr>\
</thead>\
<tbody class="table-hover">';

    var RandWordList = []

    for(var i=0; i < n_words_req; i++){
	var rand_index = Math.floor(Math.random() * chosen_word_list.length);
	var rand_word = chosen_word_list[rand_index];

	RandWordList.push(rand_word);

	HTM += '\n<tr>\
\n\t<td class="text-left">'+rand_word+'</td>\
\n\t<td class="text-left"><span id="defn-'+rand_word.toUpperCase()+'">no definition recieved</span></td>\
\n</tr>\n';
    }

    // only perform lookup later...
    // I think this might prevent failures of words being recieved because it's too fast for socket.io
    setTimeout(function(){
	for(var i=0; i < RandWordList.length; i++){
	    my_SDC.lookup_definition(RandWordList[i]);
	}
    },1000);

    HTM += '</tbody>\
</table>';

    res.render('dictionary-tester', {html1: HTM});
});


//END OF experimental code secion



//route 1 - no path...
app.get('/', function(req, res){
    res.render('home', {identity_html: "<home-page-was-requested>"});
});


//route 2 - join path...
app.get('/join=*', function (req, res) {
    var frags = req.url.split('=');
    var identity_supplied = frags[frags.length-1];

    var id_frags = identity_supplied.split('&');
    var identity_supplied = id_frags[0];
    var fileset_tag = id_frags[1] || '';

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
	res.render('snatch', {identity_html: my_html, fileset: fileset_tag});
	access_room(valid_pin);//extend time out due to link usage.
    }else{
	console.log(identity_supplied + ' was not detected as a valid game identity. Homepage served instead');
	res.render('home', {identity_html: "<invalid-game-join-identity>"});
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

// the keys for this array are IP addresses
var ip_table = {};

function close_room(room_pin){
    console.log("Closing room [" + rooms_table[room_pin].room_key + "] / [" + room_pin + "] due to inactivity");
    keygen.freePIN(room_pin);
    delete rooms_table[room_pin];
    io.to(room_pin).emit('room closed', 0);//probably no one gets this message anyhow.
}

function access_room(room_pin){
    var R = rooms_table[room_pin];

    if(R !== undefined){
	//clear the old timeout by reference...
	//suppose this the first access of an existant room. Nothing to clear
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
	return true;
    }else{
	console.log("message recieved for non-existant room ["+room_pin+"]... no action taken");
	return false;
    }
}

io.on('connection', function(socket){

    //basic logging
    var client_ip = socket.handshake.headers['x-real-ip'];
    if (client_ip == undefined){client_ip = "no-real-ip";}
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
	    // record the disconnection in the backend, and also broadcast to the room...
	    var dis_pl_i = myGame.playerIndexFromSocket(socket.id);
	    socket.broadcast.to(socket.room_pin).emit('player disconnected', dis_pl_i);

	    // 'disconnecting' when all tiles are turned is equivalent to clicking finish
	    // this preserves the possibility that the 'fin' message will show even with an unclean departure.
	    if(myGame.areAllTilesTurned()){
		var all_fin = myGame.PlayerFinishedGame(socket.id);
		if(all_fin){
		    io.to(socket.room_pin).emit('all players declared finished', 0);
		}
	    }
  
	    // make the log message
	    var dis_pl_name = myGame.getPlayerObject(socket.id).name;
	    console.log('Player ' + dis_pl_i + ' (' + dis_pl_name + ') disconnected (socket.id = ' + socket.id + ')');

	    //this function call must be last, and not be before other member functions of 'myGame'...
	    myGame.removePlayer(socket.id);

	}else{
	    console.log('Connection closed (socket.id = ' + socket.id + ') - no player associated...');
	}
    });


    //the server pongs back the heartbeat message to the specific client that sent.
    socket.on('client heartbeat', function(){
	if(!access_room(socket.room_pin)){return;}; // log that the game was accessed. 
    	socket.emit('heartbeat server ack', 0);
    });


    //this is not used by the actual snatch game because lookup is tied to snatching
    socket.on('look up definition', function(word){
	my_SDC.lookup_definition(word);
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

	//count the join by the IP
	if(ip_table[client_ip] == undefined){
	    ip_table[client_ip] = {
		ip: client_ip,
		n_joins: 1,
		rooms_accessed_list: [socket.room_pin]
	    };
	}else{
	    if(ip_table[client_ip].rooms_accessed_list.indexOf(socket.room_pin) == -1){
		ip_table[client_ip].rooms_accessed_list.push(socket.room_pin);
	    }
	    ip_table[client_ip].n_joins++;
	}

	//index to the new joiner
	var pl_i = myGame.playerIndexFromSocket(socket.id);
	socket.emit('give client their player index', {player_index: pl_i, ip_details: ip_table[client_ip]});

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
	if(!access_room(socket.room_pin)){return;}; // log that the game was accessed. Terminate if invalid

	console.log("["+socket.room_pin+"]: Snatch submission with letters: ",tile_id_array);
	var myGame = rooms_table[socket.room_pin].GameInstance;
	var SnatchResponse = myGame.playerSnatches(tile_id_array, socket.id)

	if(SnatchResponse.val_check == 'accepted'){

	    // HASHING - keep the next 3 lines of code together
	    var SnatchMsg = SnatchResponse.SnatchUpdateMsg;
	    var current_hash = myGame.build_hash(SnatchMsg.tile_id_array);
	    SnatchMsg.HH = current_hash;

	    //Here, we append to the message potentially two tiles, depending on rule state...
	    if(myGame.get_uOpt().uOpt_flippy){
		SnatchMsg.ExtraTiles = [];
		// do it twice
		SnatchMsg.ExtraTiles.push(myGame.flipNextTile(socket.id));
		SnatchMsg.ExtraTiles.push(myGame.flipNextTile(socket.id));
	    }

	    io.to(socket.room_pin).emit('snatch assert', SnatchMsg);   
	    
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


    socket.on('game settings upload', function(settings_obj){
	if(!access_room(socket.room_pin)){return;}; // log that the game was accessed. Terminate if invalid


	var myGame = rooms_table[socket.room_pin].GameInstance;
	var old_settings = myGame.get_uOpt();
	myGame.update_uOpt(settings_obj);//update server copy of data (for sending to players yet to join...)

	var details_obj = {
	    settings_obj: settings_obj,
	    changer_player_index: myGame.playerIndexFromSocket(socket.id)
	};

	//TODO: please change this! Embodying a setting like this by testing for string equality is terrible!!!
	var op5 = "5 second letter spew";
	var op10 = "10 second letter spew";

	var rm_pin = socket.room_pin;
	var myGame = rooms_table[rm_pin].GameInstance;

	//TODO: code growth management: is this the right place for all this stuff. This file is pretty bloated now!

	//detect "op5" switched OFF
	if((old_settings.uOpt_turns == op5)&&(settings_obj.uOpt_turns != op5)){
	    console.log("["+rm_pin+"]: Deactivated: " + op5);
	    clearTimeout(letter_spew_timout_ID);
	    letter_spew_timout_ID = undefined;
	}

	//detect "op10" switched OFF
	if((old_settings.uOpt_turns == op10)&&(settings_obj.uOpt_turns != op10)){
	    console.log("["+rm_pin+"]: Deactivated: " + op10);
	    clearTimeout(letter_spew_timout_ID);
	    letter_spew_timout_ID = undefined;
	}

	//detect "op5" switched ON
	if((old_settings.uOpt_turns != op5)&&(settings_obj.uOpt_turns == op5)){
	    console.log("["+rm_pin+"]: Activated: " + op5);
	    letter_spew_timout_ID = setTimeout(function(){Letter_Spew(myGame, rm_pin, 5000)}, 3000);
	}

	//detect "op10" switched ON
	if((old_settings.uOpt_turns != op10)&&(settings_obj.uOpt_turns == op10)){
	    console.log("["+rm_pin+"]: Activated: " + op10);
	    letter_spew_timout_ID = setTimeout(function(){Letter_Spew(myGame, rm_pin, 10000)}, 3000);
	}

	socket.broadcast.to(socket.room_pin).emit('game settings download', details_obj);
    });


    var letter_spew_timout_ID = undefined;
    function Letter_Spew (Game, rm_pin, t_period){
	var nt_info = TRANSMIT_new_turned_tile(Game, rm_pin, null);
	if(nt_info){//continue the chain if tiles are left...
	    letter_spew_timout_ID = setTimeout(function(){Letter_Spew(Game, rm_pin, t_period)}, t_period);
	}
    };

    
    function TRANSMIT_new_turned_tile(Game, rm_pin, sID){
	var newTile_info = Game.flipNextTile(sID);
	if(newTile_info){//this means that it was not a request with no tiles left...
	    // HASHING - keep the next 3 lines of code together
	    var current_hash = Game.build_hash(newTile_info.tile_letter);
	    newTile_info.HH = current_hash;
	    io.to(rm_pin).emit('new turned tile', newTile_info);
	}
	return newTile_info;
    };


    //client requests to turn over a tile
    socket.on('tile turn request', function(blank_msg){
	// This will terminate function if the room no longer exists
	if(!access_room(socket.room_pin)){return;}; // log that the game was accessed. 

	if(letter_spew_timout_ID != undefined){
	    console.log("There is a problem. User turn should be disabled during timed auto-turn...");
	}

	var myGame = rooms_table[socket.room_pin].GameInstance;
	var nt_info = TRANSMIT_new_turned_tile(myGame, socket.room_pin, socket.id);

	if(nt_info){
	    var txt_m = " flips tileID=" + nt_info.tile_index + " (" + nt_info.tile_letter + ")";
	    console.log("["+socket.room_pin+"]: PI=" + nt_info.flipping_player + txt_m);
	}else{//this means no tiles left....
	    console.log("A 'flip' message was recieved when all tiles were already turned");
	    var all_fin = myGame.PlayerFinishedGame(socket.id);
	    if(all_fin){
		console.log("Active players agree: this game is finished");
		io.to(socket.room_pin).emit('all players declared finished', 0);
	    }else{
		var PI = myGame.playerIndexFromSocket(socket.id);
		io.to(socket.room_pin).emit('player declared finished', PI);
	    }
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

	    var nt_info = TRANSMIT_new_turned_tile(myGame, socket.room_pin, socket.id);

	    if(nt_info){
		letters.push(nt_info.tile_letter);
		tileID_final = nt_info.tile_index
		fl_player = nt_info.flipping_player;
		if(i == 0){tileID_first = nt_info.tile_index;}
		if(i < n_tiles){setTimeout(function(){R1(i+1);},period);}//here is the recursive call achieving simple looping...
	    }
	    if(i >= n_tiles){
		if(tileID_final !== undefined){
		    var pt_2 = tileID_first + " to tileID=" + tileID_final + ". The letters are: " + letters;
		    console.log("PI=" + fl_player + " has turned multiple tiles at once, from tileID=" + pt_2);
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
