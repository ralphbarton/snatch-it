module.exports = function (nTiles){

    //generate un unshuffled array using letter frequencies
    var tileSet = generateNewRandomTileSet(nTiles);//don't cut down number of tiles
    var playerSet = [];//this would be an emply player set for game start
//    var playerSet = provideDemoPlayerSet();//this is some demo data
    var player_index_from_socketKey_lkup = [];
    color_palette = shuffle(color_palette);//Temporary - until restart working
    emergency_colors=color_palette.slice(0);
    emergency_colors=shuffle(emergency_colors);
    bound_palette = [[]];

//    tileSet = modifyTileSetForTurned(tileSet);

    var disconnectedPlayerRefs = [];

    console.log("created snatch game instance on server");

    //this is the collection of externally callable functions
    return{
	addPlayer: function(playerDetailsStr,socket_key) {//todo implement this
	    var receivedPlayerObj = JSON.parse(playerDetailsStr); 
	    var nm = receivedPlayerObj.name;
	    var ci = receivedPlayerObj.color_index;
	    var col = bound_palette[socket_key][ci];
	    
	    //return the unused colours to the list...
	    for(i=0;i<5;i++){
		if(i==ci){continue;}
		color_palette.push(bound_palette[socket_key][i]);
	    }

	    delete bound_palette[socket_key];

	    var newPlayer = {
		name : nm,
		color : col,
		words : [],
		agrees_to_reset: false,
		socket_key: socket_key
	    };
	    playerSet.push(newPlayer);
	    player_index_from_socketKey_lkup[socket_key] = playerSet.length-1;
	},
	removePlayer: function(socket_key) {
	    var PI = player_index_from_socketKey_lkup[socket_key];
	    playerSet[PI].socket_key = false;//never use this key again...
	  
	    disconnectedPlayerRefs.push(PI);
	    delete player_index_from_socketKey_lkup[socket_key];
	},

	getGameObjectAsStr: function() {
	    var gameObject = {tileSet:tileSet, playerSet:playerSet}; 
	    
	    var gameObj_clone = JSON.parse(JSON.stringify(gameObject));
	    var cc_plr = gameObj_clone.playerSet
	    
	    //remove some server-side only attributes of the player objects before transmission...
	    for (i=0; i < cc_plr.length; i++){
		delete cc_plr[i].agrees_to_reset;
		delete cc_plr[i].socket_key;
	    }
	    return JSON.stringify(gameObj_clone);
	},
	getPlayerObjectAsStr: function(socket_key) {
	    var PI = player_index_from_socketKey_lkup[socket_key];
	    return JSON.stringify(playerSet[PI]);
	},
	playerWithSocketExists: function(socket_key) {
	    return player_index_from_socketKey_lkup[socket_key] != undefined;
	},
	getPlayerNameBySocket: function(socket_key) {
	    var PI = player_index_from_socketKey_lkup[socket_key];
	    return playerSet[PI].name;
	},
	flipLetter: function(tileID) {
	    tileSet[tileID].status="turned";
	},
	resetGame: function(nTiles) {
	    tileSet = generateNewRandomTileSet(nTiles);
	    color_palette = shuffle(color_palette);

	    //remove all words from all players
	    for (i=0; i<playerSet.length; i++){
		playerSet[i].words = [];//empty...
	    }

	    //resetore all players to not yet agreeing to the next reset request
	    for (i=0;i<playerSet.length;i++){
		playerSet[i].agrees_to_reset = false;
	    }

	},
	playerIndexFromSocket: function(socket_key) {
	    return player_index_from_socketKey_lkup[socket_key];
	},
	playerAgreesToReset: function(socket_key) {
	    // this function takes as input the socket_key of a player who wishes to reset.
	    // it returns true iff every player is willing to reset.
	    var PI = player_index_from_socketKey_lkup[socket_key];
	    playerSet[PI].agrees_to_reset = true;
	    var lets_reset = true;
	    for (i=0;i<playerSet.length;i++){
		lets_reset = lets_reset && playerSet[i].agrees_to_reset;
	    }
	    console.log(playerSet.length,lets_reset);
	    return lets_reset;
	},
	snatchWordValidation: function(tile_id_array){
	    // the most basic check is that it is over 3 letters
	    if(tile_id_array.length < 3){
		return 'insufficient length';
	    }
	    // also check that it is made of letters which are available among the free letters on-server
	    // issues here may arise due to latency of the free letters due to one client's snatch not reaching the other client fast enough
	    
	    //TODO this check needs modification (loosening) so that it handles valid snatches of other peoples words, where status will be 'inword'
	    //for now, let it only handle fully new snatches.
	    for(i=0; i<tile_id_array.length; i++){
		var TID = tile_id_array[i]
		if(tileSet[TID].status!='turned'){
		    console.log("a letter had status" + tileSet[TID].status);
		    return 'letters unavailable';
		}
	    }

	    // also check is it a valid word
	    //dictionary comparison, still TODO!!
	    return 'accepted';

	},
	playerSnatches: function(letterArrayStr,socket_key) {
	    var PI = player_index_from_socketKey_lkup[socket_key];
	    var tile_id_array = JSON.parse(letterArrayStr);
	    var Response = {};
	    Response.val_check = this.snatchWordValidation(tile_id_array);

	    //check the snatch is valid:
	    if( Response.val_check == 'accepted'){// snatch accepted
	    	    console.log("Player " + PI + " SNATCH accepted.");

		//update all letters so that they cannot be claimed again as status 'turned' single letters
		for(i=0; i<tile_id_array.length; i++){
		    tileSet[i].status = 'inword';
		}
		//BUSINESS LOGIC: puts the snatched word into the server's data structure
		playerSet[PI].words.push(tile_id_array);
		
		Response.SnatchUpdateMsg = {
		    player_index: PI,
		    tile_id_array: tile_id_array
		}


	    }else{ // snatch rejected
	    	    console.log("Player " + PI + " SNATCH rejected : " + Response.val_check);

	    }

	    console.log("Word set now: " + playerSet[PI].words);
	    return Response;
	},
	//we could make this an embedded class and be snazzy! Is there time??
	provideColorChoiceAsStr: function(socket_key) {

	    var mySet = [];
	    if(color_palette.length>=5){
		for(i=0;i<5;i++){
		    mySet.push({index: i, color: color_palette[i]});
		}
		bound_palette[socket_key] = color_palette.splice(0,5);//remove 5 colours from the palette
		}
	    else{
		for(i=0;i<5;i++){
		    mySet.push({index: i, color: emergency_colors[i]});
		}
		emergency_colors = emergency_colors.concat(emergency_colors.splice(0,5));
	    }
	    strColors = JSON.stringify(mySet);
	    return strColors;
	},
	randomfunc: function(){
	    //add 4 back to available
	}

    };//return a collection of functions

}



//helper functions (private) are listed below:


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


///////LETTER FREQUENCIES
var letter_frequencies = {
    "A":5,
    "B":2,
    "C":4,
    "D":4,
    "E":12,
    "F":4,
    "G":2,
    "H":5,
    "I":5,
    "J":1,
    "K":1,
    "L":5,
    "M":4,
    "N":5,
    "O":6,
    "P":3,
    "Q":1,
    "R":5,
    "S":5,
    "T":7,
    "U":4,
    "V":2,
    "W":3,
    "X":1,
    "Y":3,
    "Z":1
};


////A colour palette - works well on WHITE
var color_palette = [
    '#09C',
    '#09F',
    '#00C',
    '#33F',
    '#60F',
    '#99F',
    '#C6F',
    '#C0F',
    '#F6F',
    '#909',
    '#F9C',
    '#F06',
    '#F96',
    '#900',
    '#F30',
    '#F90',
    '#C90',
    '#963',
    '#996',
    '#CC0',
    '#9C0',
    '#690',
    '#093',
    '#0C0',
    '#0C9'];


function generateNewRandomTileSet(nTiles){
    var tileset = [];
    for (i=0; i<26; i++){
	var myCharCode = "A".charCodeAt(0) + i;
	var theletter = String.fromCharCode(myCharCode);
	var N_myLetter = letter_frequencies[theletter];

	for(j=0; j<N_myLetter; j++){
	    tileset.push({
		letter:theletter,
		status:'unturned'// alternative enum values: 'turned', 'inword'
	    });
	}

    }

    //now shuffle this array:
    tileset = shuffle(tileset);
    //cut down the number of tiles:
    tileset.splice(nTiles,100);

    return(tileset);
}


function provideDemoPlayerSet(){

    X = [{
	name : "Michael",
	color : "#D00",
	words : [[23,14,11]]
    },{
	name : "Toby",
	color : "#F70",
	words : []
    },{
	name : "Alex",
	color : "#08D",
	words : [[44,12,13,19,4],[33,34,35],[24,25,26,27,28,29,30,31],[32,36,37]]
    }
	];

    return X;
}

function modifyTileSetForTurned(ts){
    //this is only partial...
    ts[23].status='inword';
    ts[14].status='inword';
    ts[11].status='inword';
    ts[44].status='inword';
    ts[12].status='inword';
    ts[13].status='inword';
    ts[19].status='inword';
    ts[4].status='inword';
    ts[33].status='inword';
    ts[34].status='inword';
    ts[35].status='inword';
    ts[24].status='inword';
    ts[25].status='inword';
    ts[26].status='inword';
    ts[27].status='inword';
    
    //
    ts[1].status='turned'
    ts[2].status='turned'
    return ts;
}
