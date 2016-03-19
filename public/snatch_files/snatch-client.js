//establish the websocket connection with the server
var socket = io();

var tileset = [];//global reference - for server data...
var players = [];//global reference - for server data...
var tilestats = {};//global reference - for server data...

var client_player_index = undefined;

//initialise the Canvas

socket.emit('player joining game', 0);

socket.on('player color choices', function(colorSet){
    snDraw.initialiseCanvas();
    //probably need to decode colorSet here... ToDO - wtf does this comment mean?
    snDraw.Splash.identityPrompt(colorSet);
});



///upon arrival, process the transmitted game state from the server
socket.on('full game state transmission', function(gameState){

    /*
      For now, receipt of the first ever game state message (compared with others) is detected
      by looking at the global tileset, which is initially [].

      In any case, there should only ever be one transmission of this message, so the check should not be necessary.
    */

    //RECIEVE THE MESSAGE FOR THE FIRST time - in this case need to add the listeners...
    if(tileset.length<1){
	snDraw.Game.addListeners_kb_mouse();
    }else{//clear old data ready for the new...
	snDraw.Game.TileArray = [];
    }

    //the message is sent on the following events:
    // (1) a player has just joined the game (they just chose a color)
    // (2) a player has requested reset and they are the only player
    // (3) a player has agreed to a reset request, and now everyone agrees...

    players = gameState.playerSet;
    tileset = gameState.turned_tiles;
    console.log("TILESET RECIEVED LENGTH = " + tileset.length);
    tilestats = gameState.tile_stats;

    for(i=0; i<players.length; i++){
	players[i].index = i;
	snDraw.Game.TileGroupsArray[i] = [];//correctly create empty container
    }

    //draws the entire game state on the canvas from the data supplied
    snDraw.Game.initialDrawEntireGame();

});//end of function to load game data

socket.on('player has joined game', function(newPlayer){
    
    newPlayer.index = players.length;//take the length prior to pushing incorporates -1

    //DO NOT FORGET, upon addition of a new player, to modify their data structure accordingly.
    snDraw.Game.TileGroupsArray[newPlayer.index]=[];//correctly create empty container
    players.push(newPlayer);

    //Don't need to redraw screen here. New player won't actually have any words (makes no visible difference)
    console.log("TOAST: " + newPlayer.name + " has joined the game");

});



//when a new tile is sent from the server...
socket.on('new turned tile', function(newTile_info){

    var PI = newTile_info.flipping_player;
    var TI = newTile_info.tile_index;
    var LET = newTile_info.tile_letter;

    var player_name = players[PI].name;
    console.log("TOAST: " + player_name + " flipped a tile...");
    tileset[TI] = {
	letter: LET,
	status: "turned"
    };
    snDraw.Game.addNewTurnedTile(TI);
    snDraw.Game.shiftTilesUpGrid();//function call is extravagant (inefficient) as it will never cause a shift. We're just using it to correctly set playersZoneTopPx
    snDraw.Game.Controls.updateTurnLetter_number();
    snDraw.Game.Zones.updateAllZoneSizes();//unconditional function call is extravagant (inefficient) as shift will only be in a minority of cases...
});

socket.on('player wants reset', function(player_index){
    var player_name = players[player_index].name;
    var resetAssent = confirm(player_name + " has requested to reset the game. Do you want to reset the game?");
    socket.emit('agree to reset', resetAssent);	
});


socket.on('player disconnected', function(player_index){
    var player_name = players[player_index].name;
    console.log("TOAST: " + player_name + " disconnected");
    console.log("this message needs to be replace with additional code to handle this event...");
});

//this is message to Tell me that Alex has said "Reset" - inform of another players decision
socket.on('player response to reset request', function(responseObj){
    var p_name = players[responseObj.player_index].name;
    var p_a = responseObj.response;
    console.log("TOAST: " + p_name + " responded to reset request with the answer: " + p_a);
});

socket.on('give client their player index', function(myIndex){
    console.log("player index of " + myIndex + " recieved");
    client_player_index = myIndex;
    
});



socket.on('snatch assert', function(SnatchUpdateMsg){

    //Process the incoming data: 
    var tile_indices = SnatchUpdateMsg.tile_id_array
    var PI = SnatchUpdateMsg.player_index;
    var word_usage = SnatchUpdateMsg.words_consumed;
    var snatching_player = players[PI];
    var client_is_snatcher = client_player_index == PI;

    //a toast
    console.log("TOAST: " + snatching_player.name + " has snatched a word, tile indices are:", tile_indices);    
    console.log("word usage : " + JSON.stringify(word_usage));

    //clear the spell only if client is snatcher
    if(client_is_snatcher){snDraw.Game.Spell.CancelWord();}

    //record how many words
    var n_words_prior2S = snatching_player.words.length;

    //update the players data structure:
    snDraw.Game.removeWordsAndUngroup(word_usage);
    snatching_player.words.push(tile_indices);

    //mark the locations of any snatched tiles on grid as empty
    snDraw.Game.shiftTilesUpGrid(tile_indices);

    //most of the Zone reshaping work happens here
    snDraw.Game.Zones.ZoneHandlingUponSnatch(snatching_player,n_words_prior2S);
    
    //update the tiles data structure:
    for(i=0; i<tile_indices.length; i++){
	var TID = tile_indices[i];
	tileset[TID].status = 'inword';
    }
    
    //draw the new word into the player zone...
    //the final parameter of this function call determines if animation is required (which we always have)
    snDraw.Game.drawSingleCapturedWord(snatching_player,snatching_player.words.length - 1, true);
    snDraw.Game.Spell.repositionSkeletal();

});



socket.on('snatch rejected', function(rejection_reason){
    
    //a toast here
    snDraw.Game.Spell.CancelWord();
    console.log("The snatch was rejected by the server for the following reason: " + rejection_reason);
});

function PLAYER_SUBMITS_WORD(p)       {socket.emit('player submits word', p);}
function RESET_REQUEST()              {socket.emit('reset request', 0);}
function TILE_TURN_REQUEST()          {socket.emit('tile turn request', 0);}
function PLAYER_JOINED_WITH_DETAILS(p){socket.emit('player joined with details', p);}



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
