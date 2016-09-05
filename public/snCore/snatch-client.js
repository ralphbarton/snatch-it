//establish the websocket connection with the server
var socket = io();

var snCore = {};

var ip_comments = undefined;//global reference - for server data...
var tileset = [];//global reference - for server data...
var players = [];//global reference - for server data...
var tilestats = {};//global reference - for server data...

var client_player_index = undefined;

var dev = false; // select whether development more is active or not

var graphing_stats = undefined;

/// TO DO: REORGANISE THIS...
// in the case where the pin is populated in the page that has just downloaded, this means the client must send a message to
// the server...
var room_pin = undefined;
var room_key = undefined;
var db_uID = undefined

// global references
var flkty_rules = undefined;
var flkty_stats = undefined;
var canvas = undefined;
window.onload = function() {

    // Initialise the fabric canvas
    canvas = new fabric.Canvas('c');

    canvas.selection = false; // we don't want to select a group of objects with the mouse
    canvas.renderOnAddRemove = false; //speedup?
    canvas.stateful = false; //speedup?

    room_pin = $("#pin").html();
    room_key = $("#key").html();
    if((!isNaN(room_pin)) && (room_pin.length==4)){//test it is a 4 digit numeric string...
	socket.emit('join room and start', room_pin);
    }
    flkty_rules = new Flickity('.rules-container', {
	// options
	accessibility: false // this is to disable inbuilt kb arrow handling, because I'm doing arrow handling.
	//Reason: because the inbuild arrow-key handlers only apply when the flicity object is the "focus", which
	// users will generally experience as a bug.
    });

};

//Provides data to allow player to reclaim name, make new name AND choose their color 
socket.on('player color choices', function(msg_obj){

    //code to hide any other 'pages' and show the Canvas that is the snatch game...
    snCore.Basic.makeCanvasFitWholeWindow();

    //the colour set is an array with objects <fabric color>, length 5
    var colors_remaining = msg_obj.colors_remaining;
    var players_t = msg_obj.players_t;
    snCore.Splash.triggerPromptScreen(colors_remaining, players_t);
});



///upon arrival, process the transmitted game state from the server
socket.on('full game state transmission', function(gameState){
    // According to the latest Design, this event only occurs once per client session
    // there is no reset etc causing retransmission of the game state.

    players = gameState.playerSet;
    tileset = gameState.turned_tiles;
    tilestats = gameState.tile_stats;
    cum_MSG_hash = gameState.state_hash;

    db_uID = gameState.db_uID;

    // update to the option-set on server...
    var u_opt = gameState.user_options;
    snCore.Popup.recieveSettingChange(u_opt);    

    for(var i = 0; i < players.length; i++){
	players[i].index = i;
	snCore.Words.TileGroupsArray[i] = [];//correctly create empty container
    }

    //draws the entire game state on the canvas from the data supplied
    snCore.Tile.setTileRatSizeFromNTiles(tilestats.n_turned);// set starting size for tiles (due to existing game progress)
    snCore.Event.FirstGameRender(); // main effect is to add keyboard & mouse listeners
    snCore.Event.DrawAll();
    if(gameState.game_finished){
	snCore.Event.EndGame();
    }

    snCore.Toast.join_message(); //show a welcome toast
    
    if(typeof Chart == "undefined"){
	snCore.Toast.showToast("Charting library has not been loaded from CDN, and charts will not work");
    }

    emit_heartbeat(); //start the hearbeat process now.

});//end of function to load game data


//player joins game
socket.on('player has joined game', function(player_join_details){

    if(client_player_index !== undefined){//Game rendered and in-progress
	snCore.Event.Connection(player_join_details);

    }else{ // Still at the Splash stage.
	//remove the joined player's color from the choices...
	snCore.Splash.colorChoiceConsumed(player_join_details.player_object.color);
    }
});



function emit_heartbeat(){
    snCore.Latency.LogTransmit("hb");
    socket.emit('client heartbeat', 0);
}

socket.on('heartbeat server ack', function(){
    snCore.Latency.LogAck("hb");
    setTimeout(emit_heartbeat, 1000 * 10);// 10 seconds after the ACK of the heartbeat, send another...
});





//when a new tile is sent from the server...
socket.on('new turned tile', function(newTile_info){
    snCore.Latency.LogAck("turn");
    var player_index = newTile_info.flipping_player;
    var tile_index = newTile_info.tile_index;
    var letter = newTile_info.tile_letter;

    //hash the incoming in data and check hash validity
    build_MSG_hash(letter, newTile_info.HH);

    // for response of client-side data model and view
    snCore.Event.TileTurn(player_index, tile_index, letter);
});


socket.on('snatch assert', function(SnatchUpdateMsg){
    snCore.Latency.LogAck("snatch");

    //Process the incoming data: 
    var player_index = SnatchUpdateMsg.player_index;
    var tile_indices = SnatchUpdateMsg.tile_id_array;
    var word_usage = SnatchUpdateMsg.words_consumed;

    //hash the incoming in data and check hash validity
    build_MSG_hash(tile_indices, SnatchUpdateMsg.HH);

    // for response of client-side data model and view
    snCore.Event.SnatchEvent(player_index, tile_indices, word_usage);

    //the snatch message may include some extra tiles...
    if(SnatchUpdateMsg.ExtraTiles != undefined){
	for (var i = 0; i < SnatchUpdateMsg.ExtraTiles.length; i++){
	    var ET = SnatchUpdateMsg.ExtraTiles[i];
	    if(ET != null){
		snCore.Event.TileTurn(null, ET.tile_index, ET.tile_letter);
	    }
	}
    }
    snCore.Controls.updateSnatchButtonStatus("reactivate button");

});


socket.on('player disconnected', function(player_index){
    //the player disconnection handling is only relevant once the game is rendered.
    if(client_player_index !== undefined){
	snCore.Event.Disconnection(player_index);
    }
});


socket.on('give client their player index', function(obj){
    client_player_index = obj.player_index;
    ip_comments = obj.ip_details;
});


socket.on('snatch rejected', function(rejection_reason){
    snCore.Latency.LogAck("snatch");
    snCore.Toast.showToast("Move invalid: " + rejection_reason);
    snCore.Controls.updateSnatchButtonStatus("reactivate button");
});


//overwrite entire dictionary with server copy (will happen only on game load)
socket.on('word definitions dictionary', function(word_dictionary){
    snCore.DefineWord.word_dictionary = word_dictionary;
});

//add an extra word to the client side copy of the dictionary
socket.on('new word definition', function(W_DEF){
    var word = W_DEF.word_queried;
    snCore.DefineWord.word_dictionary[word] = W_DEF;
});


socket.on('game settings download', function(obj){
    var changed_settings = snCore.Popup.recieveSettingChange(obj.settings_obj);
    if(snCore.Popup.popup_in_foreground == false){
	var nam = players[obj.changer_player_index].name;
	snCore.Toast.showToast(nam + " changed some game settings.");
    }
});


socket.on('all players declared finished', function(no_data){
    snCore.Event.EndGame();
});


socket.on('player declared finished', function(player_index){
    players[player_index].is_finished = true;
    snCore.Toast.partial_completion_toast(player_index);
});


socket.on('game graphing stats data', function(data){
    graphing_stats = data;
    
    var scores_data = {
	datasets: []
    };

    for(var i = 0; i < players.length; i++){
	var g_dat = graphing_stats.Scores_Timeseries[i];
	if(g_dat != undefined){
	    scores_data.datasets.push({
		label: players[i].name,
		borderColor: players[i].color,
		fill: false,
		steppedLine: true,
		data: g_dat
	    });
	}
    }    

    snCore.Popup.setChart(scores_data);
});

function PLAYER_SUBMITS_WORD(p)       {
    snCore.Latency.LogTransmit("snatch");
    snCore.Controls.updateSnatchButtonStatus("checking");
    socket.emit('player submits word', p);
}
function TILE_TURN_REQUEST()          {
    if(tilestats.n_tiles>tileset.length){snCore.Latency.LogTransmit("turn");}
    socket.emit('tile turn request', 0);}//only expect a like response if NOT all tiles are already turned

function PLAYER_JOINED_WITH_DETAILS(p){socket.emit('player joined with details', p);}
function GAME_SETTINGS_CHANGE(p)      {socket.emit('game settings upload', p);}
function GAME_GRAPHING_STATS_REQUEST(){socket.emit('game graphing stats request', 0);}

function TURN_MANY_TILES(p)           {socket.emit('many_tile_turn_hack', p);}




///Todo what uses this function? Can it be placed elsewhere in the code?
// Answer: used within snCore.Spell.shuffleAnagramRelease
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

//add hashing capability
String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length === 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

var cum_MSG_hash = 0;
function build_MSG_hash(obj, expected_hash){
    var hash_me = JSON.stringify(obj) + cum_MSG_hash.toString();
    cum_MSG_hash = Math.abs(hash_me.hashCode() % 100000); // 5 digit hash

    //this is the client-side only bit, which checks...
    if(expected_hash != cum_MSG_hash){
	
	snCore.Toast.showToast("Game is out-of-sync with the server. Refresh page for up-to-date view.");
    }else{
	//console.log("Hurrah, hashes match...("+expected_hash+")");
    }
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
