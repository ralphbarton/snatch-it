//establish the websocket connection with the server
var socket = io();

var tileset = [];//global reference - for server data...
var players = [];//global reference - for server data...
var tilestats = {};//global reference - for server data...

var client_player_index = undefined;

var dev = false; // select whether development more is active or not

/// TO DO: REORGANISE THIS...
// in the case where the pin is populated in the page that has just downloaded, this means the client must send a message to
// the server...
var room_pin = undefined;
var room_key = undefined;
window.onload = function() {
    room_pin = $("#pin").html();
    room_key = $("#key").html();
    if((!isNaN(room_pin)) && (room_pin.length==4)){//test it is a 4 digit numeric string...
	socket.emit('join room and start', room_pin);
    }
};

//Provides data to allow player to reclaim name, make new name AND choose their color 
socket.on('player color choices', function(msg_obj){

    //code to hide any other 'pages' and show the Canvas that is the snatch game...
    snDraw.initialiseCanvas();
    snDraw.makeCanvasFitWholeWindow();

    //the colour set is an array with objects <fabric color>, length 5
    var colorSet = msg_obj.color_choice;
    var players_t = msg_obj.players_t;
    snDraw.Splash.triggerPromptScreen(colorSet, players_t);
});



///upon arrival, process the transmitted game state from the server
socket.on('full game state transmission', function(gameState){
    // According to the latest Design, this event only occurs once per client session
    // there is no reset etc causing retransmission of the game state.

    //this will clear the message "waiting for the server..."
    snDraw.Game.TileArray = [];
    canvas.clear();	    

    //RECIEVE THE MESSAGE FOR THE FIRST time - in this case need to add the listeners...
    if(tileset.length<1){
	snDraw.Game.addListeners_kb_mouse();
    }

    players = gameState.playerSet;
    tileset = gameState.turned_tiles;
    tilestats = gameState.tile_stats;

    for(var i = 0; i < players.length; i++){
	players[i].index = i;
	snDraw.Game.Words.TileGroupsArray[i] = [];//correctly create empty container
    }

    //draws the entire game state on the canvas from the data supplied
    snDraw.Game.setTileRatSizeFromNTiles(tilestats.n_turned);// set starting size for tiles (due to existing game progress)
    snDraw.Game.Event.DrawAll();

    //I hope this can't add the callback twice...
    window.onresize = function(){
	snDraw.Game.Event.WindowResize();
    };

    //start the hearbeat process now.
    emit_heartbeat();

});//end of function to load game data

//player joins game
socket.on('player has joined game', function(player_join_details){
    snDraw.Game.Event.Connection(player_join_details);
});



function emit_heartbeat(){
    log_message_transmit("hb");
    socket.emit('client heartbeat', 0);
}

socket.on('heartbeat server ack', function(){
    log_message_ack("hb");
    setTimeout(emit_heartbeat, 1000 * 10);
});





//when a new tile is sent from the server...
socket.on('new turned tile', function(newTile_info){
    log_message_ack("turn");
    var player_index = newTile_info.flipping_player;
    var tile_index = newTile_info.tile_index;
    var letter = newTile_info.tile_letter;

    snDraw.Game.Event.TileTurn(player_index, tile_index, letter);

});


socket.on('snatch assert', function(SnatchUpdateMsg){
    log_message_ack("snatch");
    //Process the incoming data: 
    var player_index = SnatchUpdateMsg.player_index;
    var tile_indices = SnatchUpdateMsg.tile_id_array
    var word_usage = SnatchUpdateMsg.words_consumed;

    snDraw.Game.Event.SnatchEvent(player_index, tile_indices, word_usage);

});


socket.on('player disconnected', function(player_index){
    snDraw.Game.Event.Disconnection(player_index);
});


socket.on('give client their player index', function(myIndex){
    client_player_index = myIndex;
});


socket.on('snatch rejected', function(rejection_reason){
    log_message_ack("snatch");
    snDraw.Game.Toast.showToast("Move invalid: " + rejection_reason);
});


//overwrite entire dictionary with server copy (will happen only on game load)
socket.on('word definitions dictionary', function(word_dictionary){
    snDraw.Game.DefineWord.word_dictionary = word_dictionary;
});

//add an extra word to the client side copy of the dictionary
socket.on('new word definition', function(w_def){
    snDraw.Game.DefineWord.word_dictionary[w_def.word] = w_def.definition;
});

function PLAYER_SUBMITS_WORD(p)       {log_message_transmit("snatch"); socket.emit('player submits word', p);}
function TILE_TURN_REQUEST()          {log_message_transmit("turn");   socket.emit('tile turn request', 0);}
function PLAYER_JOINED_WITH_DETAILS(p){socket.emit('player joined with details', p);}

function TURN_MANY_TILES(p)           {socket.emit('many_tile_turn_hack', p);}




///Todo what uses this function? Can it be placed elsewhere in the code?
// Answer: used within snDraw.Game.Spell.shuffleAnagramRelease
Array.prototype.move = function (old_index, new_index) { 
    if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
};


//What uses this function?
//Answer: used by removeWordsAndRewrap to prevent changing indices during clearing...
Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {         
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};


function contains(a, obj) {
    for (var i = 0; i < a.length; i++) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
}

function commonElements(arr1, arr2){
    var clone1 = arr1.slice(0);
    var clone2 = arr2.slice(0);
    
    var ret = [];
    clone1.sort();
    clone2.sort();
    for(var i = 0; i < clone1.length; i += 1) {
        if(clone2.indexOf( clone1[i] ) > -1){
            ret.push( clone1[i] );
        }
    }
    return ret;
}

//integer between upper and lower bounds...
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}


// Prevent the backspace key from navigating back.
$(document).unbind('keydown').bind('keydown', function (event) {
    var doPrevent = false;
    if (event.keyCode === 8) {
        var d = event.srcElement || event.target;
        if ((d.tagName.toUpperCase() === 'INPUT' && 
             (
                 d.type.toUpperCase() === 'TEXT' ||
                 d.type.toUpperCase() === 'PASSWORD' || 
                 d.type.toUpperCase() === 'FILE' || 
                 d.type.toUpperCase() === 'SEARCH' || 
                 d.type.toUpperCase() === 'EMAIL' || 
                 d.type.toUpperCase() === 'NUMBER' || 
                 d.type.toUpperCase() === 'DATE' )
             ) || 
             d.tagName.toUpperCase() === 'TEXTAREA') {
            doPrevent = d.readOnly || d.disabled;
        }
        else {
            doPrevent = true;
        }
    }

    if (doPrevent) {
        event.preventDefault();
    }
});
