var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/snatch_files/snatch.html');
});





app.use(express.static('public'));

var qty_tiles = 100;
var snatchSvr_factory = require('./snatch-server.js');

var SDC_factory = require('./scrape_definition_client.js');
var my_SDC = SDC_factory();
    
var prev_result = undefined;
var prev_word = undefined;
my_SDC.rEvent.on('searchComplete', function(result){
    prev_result = result;

});

app.get('/definition/*', function(req, res){
    var frags = req.url.split('/');
    var word = frags[frags.length-1];
    my_SDC.lookup_definition(word);
    res.send('You have just looked up: ' + word + '. <br> Previously, you\
 looked up ' + prev_word + ' and a search result was:<br>' + prev_result);
    prev_word = word;
});

///This is an incomplete fragment...
app.get('/join/*', function(req, res){
    var frags = req.url.split('/');
    var tag = frags[frags.length-1];
});

//a hash table...
//note how it is global for all connection...
var RoomTable = {};


function close_room(room_key){
    console.log("Closing room ["+room_key+"] due to inactivity");
    delete RoomTable[room_key];
    io.to(room_key).emit('room closed', 0);
}

function access_room(room_key){
    var R = RoomTable[room_key];

    //clear the old timeout by reference...
    if(R.closeTimeoutID !== undefined){
	clearTimeout(R.closeTimeoutID);
    }

    //Add a new timeout. Retain the reference.
    R.closeTimeoutID = setTimeout(function(){
	close_room(room_key);
//    }, 1000 * 60 * 60 * 3);//3 hours persistence
    }, 1000 * 60 * 3);// 10 minues persistence
    console.log("["+room_key+"] - timout extended...");

    //Add
    R.timeLastAccessed = new Date;

}

io.on('connection', function(socket){

    //basic logging
    console.log('a user connected, with ID: '+socket.id);

    socket.on('disconnect', function(){

	if(socket.room_key){
	    var myGame = RoomTable[socket.room_key].GameInstance;
	}
	if(myGame){
	    var dis_pl_i = myGame.playerIndexFromSocket(socket.id);
	}

	// only if (1) the socket is assigned a .room_key property (2) a game exist there (should always be true...)
	// (3) the client at the socket actually entered the game and became a player.
	if(dis_pl_i !== undefined){
	    var dis_pl_i = myGame.playerIndexFromSocket(socket.id);
	    socket.broadcast.to(socket.room_key).emit('player disconnected',dis_pl_i);
	    var dis_pl_name = myGame.getPlayerObject(socket.id).name;
	    myGame.removePlayer(socket.id);
	    console.log('Player ' + dis_pl_i + ' (' + dis_pl_name + ') disconnected (socket.id = ' + socket.id + ')');
	}else{
	    console.log('Connection closed (socket.id = ' + socket.id + ') - no player associated...');
	}
    });



    socket.on('request to init room', function (data){

	// 1. Here is some quick and dirty code to generate a tag.
	var code = randomIndex = Math.floor(Math.random() * 1000);//from 0 to 999
	var c1 = randomIndex = Math.floor(Math.random() * 5);//from 0 to 4
	function pad(num, size) {
	    var s = "000000000" + num;
	    return s.substr(s.length-size);
	}
	var pcode = pad(code,3);
	var v_words = ["purple","orange","green","golden","black"];
	var room_key = v_words[c1] + " " + pcode; 

	// 2. Now create a new room instance, referenced by the tag
	RoomTable[room_key] = {
	    status: "new",
	    closeTimeoutID: undefined,
	    timeStarted: (new Date),
	    timeAccessed: undefined,
	    GameInstance: snatchSvr_factory(qty_tiles)
	};
	access_room(room_key);//this perhaps ought to be part of constructor. Needed to put timeout in place.

	console.log("New game created, tag: [" + room_key + "]");
    	socket.emit('your room tag', room_key);
    });




    socket.on('request rooms list', function (no_data){

	//convert the hash table into a list for the client to display...
	var rooms_data_array = [];
	for (var room_key in RoomTable) {
	    if (RoomTable.hasOwnProperty(room_key)) {

		var R = RoomTable[room_key];
		var gameObj = R.GameInstance.getGameObject();

		rooms_data_array.push({
		    room_key: room_key,
		    n_players: (gameObj.playerSet.length),
		    duration: (new Date - R.timeStarted)/1000,
		    n_tiles_turned: (gameObj.tile_stats.n_turned)
		});
	    }
	}

    	socket.emit('rooms list', rooms_data_array);
	console.log("Rooms list sent to an anonymouse client...");
    });




    socket.on('join room and start', function (room_key){

	//respond by providing a set of colours to choose between
	console.log("'join room and start' message recieved. Room = " + room_key);
	var myRoom = RoomTable[room_key];

	if(myRoom !== undefined){
	    
	    //just add a custom property to the socket object.
	    socket.room_key = room_key;
	    //this causes the socket to be subscribed to room-specific broadcasts...
	    socket.join(room_key);
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
	access_room(socket.room_key);
    });



    //client provides player details, which is also a request for the full game state
    socket.on('player joined with details', function (details_obj){
	access_room(socket.room_key); // log that the game was accessed

	//this newly joined player can be added to the game...
	console.log('player joined with details : ' + JSON.stringify(details_obj));
	var myGame = RoomTable[socket.room_key].GameInstance;
	myGame.addPlayer(details_obj, socket.id);

	//index to the new joiner
	var pl_i = myGame.playerIndexFromSocket(socket.id);
	socket.emit('give client their player index', pl_i);

	//gamestate to the new joiner
	var gameObj = myGame.getGameObject();
	socket.emit('full game state transmission', gameObj);//now just transmit to the new player
	
	//new joiner to the rest of the players
	var rPID = details_obj.reclaiming_player_index;
	if(rPID !== undefined){
	    var player_join_details = {rejoin_PID: rPID};
	}else{
	    var player_join_details = {player_object: myGame.getPlayerObject(socket.id), rejoin_PID: undefined};
	}
	socket.broadcast.to(socket.room_key).emit('player has joined game', player_join_details);
    });

    socket.on('reset request', function (blank_msg){
	var myGame = RoomTable[socket.room_key].GameInstance;
	var all_one_agree = myGame.playerAgreesToReset(socket.id);//the return value indicates whether all players agree to the reset
	if (all_one_agree){
	    myGame.resetGame(qty_tiles);
	    //now sent out the new game object:
	    var gameObj = myGame.getGameObject();
	    io.to(socket.room_key).emit('full game state transmission', gameObj);
	}
	else{//in the case where there are other players...
	    var pl_i = myGame.playerIndexFromSocket(socket.id);
	    socket.broadcast.to(socket.room_key).emit('player wants reset', pl_i);
	}
    });



    //client requests to turn over a tile
    socket.on('agree to reset', function(agrees){
	var myGame = RoomTable[socket.room_key].GameInstance;
	var pl_i = myGame.playerIndexFromSocket(socket.id);
	socket.broadcast.to(socket.room_key).emit('player response to reset request', {player_index: pl_i, response: agrees});
	if(agrees){
	    var reset_agreement = myGame.playerAgreesToReset(socket.id);//the return value indicates whether all players agree to the reset
	    if (reset_agreement){
		myGame.resetGame(qty_tiles);
		//now sent out the new game object:
		var gameObj = myGame.getGameObject();
		io.to(socket.room_key).emit('full game state transmission', gameObj);
	    }
	}
    });



    socket.on('player submits word', function(tile_id_array){
	access_room(socket.room_key); // log that the game was accessed

	console.log("["+socket.room_key+"]: Snatch submission with letters: ",tile_id_array);
	var myGame = RoomTable[socket.room_key].GameInstance;
	var SnatchResponse = myGame.playerSnatches(tile_id_array, socket.id)

	if(SnatchResponse.val_check == 'accepted'){
	    io.to(socket.room_key).emit('snatch assert', SnatchResponse.SnatchUpdateMsg);	    
	}else{
	    socket.emit('snatch rejected', SnatchResponse.val_check);
	}
    });




    //client requests to turn over a tile
    socket.on('tile turn request', function(blank_msg){
	access_room(socket.room_key); // log that the game was accessed
	var myGame = RoomTable[socket.room_key].GameInstance;
	var newTile_info = myGame.flipNextTile(socket.id);
	io.to(socket.room_key).emit('new turned tile', newTile_info);
	if(newTile_info){
	    console.log("["+socket.room_key+"]: PI=" + newTile_info.flipping_player + " flips tileID=" + newTile_info.tile_index + " (" + newTile_info.tile_letter + ")");
	}else{
	    console.log("All tiles turned - flip message recieved...");
	}
    });


    //client requests to turn over a tile
    socket.on('many_tile_turn_hack', function(n_tiles){

	var myGame = RoomTable[socket.room_key].GameInstance;

	var letters = [];
	var tileID_first = undefined;
	var tileID_final = undefined;
	var fl_player = undefined;
	var period = 100;

	var R1 = function(i){
	    var newTile_info = myGame.flipNextTile(socket.id);
	    if(newTile_info){
		io.to(socket.room_key).emit('new turned tile', newTile_info);
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
