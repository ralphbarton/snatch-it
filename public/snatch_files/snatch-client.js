//establish the websocket connection with the server
var socket = io();

var tileset = [];//global reference - for server data...
var players = [];//global reference - for server data...
var tilestats = {};//global reference - for server data...

var client_player_index = undefined;

var dev = true;

//initialise the Canvas

socket.emit('client page load', 0);

socket.on('player color choices', function(msg_obj){
    snDraw.initialiseCanvas();
    snDraw.makeCanvasFitWholeWindow();

    //the colour set is an array with objects <fabric color>, length 5
    var colorSet = msg_obj.color_choice;
    var players_t = msg_obj.players_t;
    snDraw.Splash.triggerPromptScreen(colorSet, players_t);
});



///upon arrival, process the transmitted game state from the server
socket.on('full game state transmission', function(gameState){
    //the message is sent on the following events:
    // (1) a player has just joined the game (they just chose a color)
    // (2) a player has requested reset and they are the only player
    // (3) a player has agreed to a reset request, and now everyone agrees...

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
    snDraw.Game.Event.DrawAll();

});//end of function to load game data

//player joins game
socket.on('player has joined game', function(player_object){
    snDraw.Game.Event.Connection(player_object);
});


//when a new tile is sent from the server...
socket.on('new turned tile', function(newTile_info){

    var player_index = newTile_info.flipping_player;
    var tile_index = newTile_info.tile_index;
    var letter = newTile_info.tile_letter;

    snDraw.Game.Event.TileTurn(player_index, tile_index, letter);

});


socket.on('snatch assert', function(SnatchUpdateMsg){

    //Process the incoming data: 
    var player_index = SnatchUpdateMsg.player_index;
    var tile_indices = SnatchUpdateMsg.tile_id_array
    var word_usage = SnatchUpdateMsg.words_consumed;

    snDraw.Game.Event.SnatchEvent(player_index, tile_indices, word_usage);

});




socket.on('player wants reset', function(player_index){
    var player_name = players[player_index].name;
    var resetAssent = confirm(player_name + " has requested to reset the game. Do you want to reset the game?");
    socket.emit('agree to reset', resetAssent);	
});

socket.on('player disconnected', function(player_index){
    snDraw.Game.Event.Disconnection(player_index);
});

//this is message to Tell me that Alex has said "Reset" - inform of another players decision
socket.on('player response to reset request', function(responseObj){
    var p_name = players[responseObj.player_index].name;
    var p_a = responseObj.response;
    console.log("TOAST: " + p_name + " responded to reset request with the answer: " + p_a);
});

socket.on('give client their player index', function(myIndex){
    client_player_index = myIndex;
});






socket.on('snatch rejected', function(rejection_reason){
    
    //a toast here
    //issue 114 - we decided: Don't clear word upon a failed snatch...
    //snDraw.Game.Spell.CancelWord();
    snDraw.Game.Toast.showToast("Move invalid: " + rejection_reason);
});

function PLAYER_SUBMITS_WORD(p)       {socket.emit('player submits word', p);}
function RESET_REQUEST()              {socket.emit('reset request', 0);}
function TILE_TURN_REQUEST()          {socket.emit('tile turn request', 0);}
function PLAYER_JOINED_WITH_DETAILS(p){socket.emit('player joined with details', p);}

function TURN_MANY_TILES(p)           {socket.emit('many_tile_turn_hack', p);}



window.onresize = function(){
    snDraw.Game.Event.WindowResize();
};



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
