module.exports = function (nTiles, WordChecker, SaveGameData){

    // By excluding these data from the save-game data, I am making the assumption that there is no point in a saved
    // game including socket level state because by the time it is reloaded all connected players will have left
    // because it is a different run-instance on the VM
    var cum_hash = Math.round(Math.random()*100000);
    var player_previous_snatch_tileIDs = [];
    var player_index_from_socketKey_lkup = [];
    
    //container for "Game Data"
    var GD = {};

    //reload data of saved game
    if(SaveGameData){
	GD = SaveGameData;

	// reset all players starting states to "disconnected" because this is a new program session.
	for (var i=0; i < GD.playerSet.length; i++){
	    GD.playerSet[i].is_disconnected = true;
	    GD.playerSet[i].socket_key = null;
	}

	console.log("Reloaded a snatch game instance on server");

    // populate initial state of a new game
    }else{
	
	var GD = {
	    tileSet: generateNewRandomTileSet(nTiles),	//shuffled array with official distribution
	    playerSet: [], // this would be an empty player set for game start
	    my_color_palette: shuffle(generateDistributedRandomColorSet(12)),

	    tile_ownership: [],
	    next_unturned_tile_i: 0,

	    game_finished: false,

	    user_options: {
		//1.
		uOpt_challenge: false,
		//2.
		uOpt_stem: false,
		//3. <select>
		uOpt_turns: "Pseudo Turns",
		//4.
		uOpt_flippy: false,
		//5. <select>
		uOpt_dictionary: "Sowpods",
		//6.
		uOpt_penalty: false
	    }
	}

	console.log("New snatch game instance created on server");
    }

    //this is the collection of externally callable functions
    return{
	update_uOpt: function(obj){
	    GD.user_options = obj;
	},

	get_uOpt: function(){
	   return GD.user_options;
	},

	get_FullGameData: function(){
	   return GD;
	},

	build_hash: function(obj){
	    var hash_me = JSON.stringify(obj) + cum_hash.toString();
	    cum_hash = Math.abs(hash_me.hashCode() % 100000); // 5 digit hash
	    return cum_hash;
	},

	addPlayer: function(playerDetails,socket_key) {//todo implement this

	    var rPID = playerDetails.reclaiming_player_index;
	    if(rPID === undefined){ // Case 1: completely new player

		var col = playerDetails.color;
		var consumed_i = GD.my_color_palette.indexOf(col);
		if(consumed_i !== undefined){
		    // Remove the colour that this client chose. It is no longer available.
		    GD.my_color_palette.splice(consumed_i, 1);
		    console.log("Color " + col + " was chosen and removed from choices");
		}else{
		    console.log("The client chose the color " + col + " which cannot be found.");
		}

		var nm = playerDetails.name;
		var newPlayer = {
		    name : nm,
		    color : col,//////////////////////////// no good now
		    words : [],
		    is_disconnected: false,
		    is_finished: this.areAllTilesTurned(),// typically false!
		    socket_key: socket_key
		};
		GD.playerSet.push(newPlayer);
		player_index_from_socketKey_lkup[socket_key] = GD.playerSet.length-1;

		
	    }else{ // Case 2: rejoining player
		GD.playerSet[rPID].is_disconnected = false;
		GD.playerSet[rPID].socket_key = socket_key;
		player_index_from_socketKey_lkup[socket_key] = rPID;
	    }
	},

	//we could make this an embedded class and be snazzy! Is there time??
	getRemainingColorsArray: function() {
	    return GD.my_color_palette;
	},


	removePlayer: function(socket_key) {
	    var PI = player_index_from_socketKey_lkup[socket_key];
	    //there is the possibility that the player was never attached to this socket...
	    if(PI != undefined){
		GD.playerSet[PI].is_disconnected = true;
		GD.playerSet[PI].socket_key = true;
	
		delete player_index_from_socketKey_lkup[socket_key];
	    }
	},

	// this function registers that a particular player has finished
	// if all active players have finished returns true
	PlayerFinishedGame: function(socket_key) {
	    var PI = player_index_from_socketKey_lkup[socket_key];
	    GD.playerSet[PI].is_finished = true;
	    for(var i=0; i < GD.playerSet.length; i++){
		// ANY active player unfinished => answer false
		if ((!GD.playerSet[i].is_disconnected) && (!GD.playerSet[i].is_finished)){
		    return false;
		}
	    }
	    // Detect the moment of game completion, and store new property for every player at this point
	    if(GD.game_finished == false){
		for(var i=0; i < GD.playerSet.length; i++){
		    GD.playerSet[i].was_connected_at_completion = !GD.playerSet[i].is_disconnected;
		}
	    }
	    GD.game_finished = true;
	    return true;
	},

	isDisconnectedPlayerOfName: function(name) {
	    for(var i = 0; i < GD.playerSet.length; i++){
		var PLR = GD.playerSet[i]; 
		if((PLR.is_disconnected==true) && (PLR.name.toUpperCase == name.toUpperCase)){
		    return i;
		}
	    }
	    return null;
	},

	rejoinPlayer: function(socket_key, player_index) {
	    GD.playerSet[player_index].is_disconnected = false;
	    GD.playerSet[player_index].socket_key = socket_key;

	    player_index_from_socketKey_lkup[socket_key] = player_index;
	},

	getGameObject: function() {

	    var playerSet_clone = [];
	    for (var i=0; i < GD.playerSet.length; i++){
		playerSet_clone.push(this.getPlayerObject(i));
	    }
	    var turned_tiles = GD.tileSet.slice(0,GD.next_unturned_tile_i);
	    var tile_stats = {n_tiles: GD.tileSet.length, n_turned: GD.next_unturned_tile_i};
	    return {
		playerSet: playerSet_clone,
		turned_tiles: turned_tiles,
		tile_stats: tile_stats,
		state_hash: cum_hash,
		user_options: GD.user_options,
		game_finished: GD.game_finished
	    }; 
	},

	getPlayerObject: function(socket_key) {
	    // if socket key is actually a number (i.e. an array index), use it to index the player directly
	    var PI = typeof(socket_key) == "number" ? socket_key : player_index_from_socketKey_lkup[socket_key];
	    //in this case we are performing a deep copy of data, hence the use of the JSON function
	    var player_clone = JSON.parse(JSON.stringify(GD.playerSet[PI]));
	    delete player_clone.socket_key;
	    return player_clone;
	},

	/*
	getGameStateHistoryPoint: function() {

	    var free_tile_ids = [];
	    for (var i=0; i < GD.tileSet.length; i++){
		if(GD.tileSet[i].status == "turned"){
		    turned_tile_ids.push(i);
		}
	    }

	    var players_words = [];
	    for (var i=0; i < GD.playerSet.length; i++){
		players_words.push(GD.playerSet[i].words);
	    }

	    return {
		free_tile_ids: free_tile_ids,
		players_words: players_words
	    };

	},
	*/

	flipNextTile: function(socket_key) {
	    var TI = GD.next_unturned_tile_i;
	    if(TI < GD.tileSet.length){
		var PI = socket_key ? player_index_from_socketKey_lkup[socket_key] : null;
		GD.next_unturned_tile_i++;
		GD.tileSet[TI].status="turned";
		return {
		    tile_index: TI,
		    tile_letter: GD.tileSet[TI].letter,
		    flipping_player: PI
		};
	    }else{
		return null;
	    }
	},

	areAllTilesTurned: function(){
	    return !(GD.next_unturned_tile_i < GD.tileSet.length);
	},

	playerIndexFromSocket: function(socket_key) {
	    return player_index_from_socketKey_lkup[socket_key];
	},

	playerNameFromSocket: function(socket_key) {
	    var PI = player_index_from_socketKey_lkup[socket_key];
	    return GD.playerSet[PI].name;
	},

	snatchWordValidation: function(player_index, tile_id_array){

	    if(tile_id_array == null){
		return {validity: 'null word sent...'};
	    }

	    // the most basic check is that it is over 3 letters
	    if(tile_id_array.length < 3){
		return {validity: 'insufficient length'};
	    }

	    //the last snatch message from this player was the very same tileset...
	    var duplicate_tilegroup_msg = false;
	    if (player_previous_snatch_tileIDs[player_index] != undefined){//there may not have been a prev snatch for this plr
		if(player_previous_snatch_tileIDs[player_index].equals(tile_id_array)){
		    duplicate_tilegroup_msg = true;
		}
	    }
	    //record the value this tile IDs submission for next time...
	    player_previous_snatch_tileIDs[player_index] = tile_id_array;

	    //Dictionary check... (reconstruct word as string)
	    var STR = "";
	    for(var i=0; i<tile_id_array.length; i++){
		var myTile = GD.tileSet[tile_id_array[i]];
		if(myTile == undefined){
		    return {validity: 'invalid: references to undefined tiles in recieved data'};
		}
		var L = myTile.letter;
		STR = STR.concat(L);//build up the string...
	    }

	    if(!WordChecker(STR)){
		return {validity: (STR + ' was not found in the Sowpods dictionary')};
	    }else{
		console.log(STR + ' is in the Sowpods dictionary');
	    }

	    //another basic check for non-duplicates...
	    var tile_id_array_clone = tile_id_array.slice(0);
	    tile_id_array_clone.sort();//is sorting the most efficient way to search for duplicates?
	    for(var i=1; i<tile_id_array.length; i++){
		if( tile_id_array_clone[i] == tile_id_array_clone[i-1] ){
		    return {validity: 'invalid: multiple instances of same tile usage within a word'};
		}
	    }

	    // also check that it is made of letters which are available among the free letters on-server
	    // issues here may arise due to latency of the free letters due to one client's snatch not reaching the other client fast enough
	    
	    //Run through each letter of the SNATCH submission, and look at its origin.
	    var WordsInvolved = {};
	    var KeysList = [];
	    var WordsInvolvedList = [];
	    for(var i=0; i<tile_id_array.length; i++){
		var TID = tile_id_array[i];

		//letter usage counting within all the words which get used
		if(GD.tileSet[TID].status=='inword'){
		    var old_PI = GD.tile_ownership[TID].player_index;
		    var old_WI = GD.tile_ownership[TID].word_index;
		    var key = 'p' + old_PI + 'w' + old_WI;
		    
		    //count the letter usage within that word
		    if(WordsInvolved[key]==undefined){
			WordsInvolved[key] = {};
			WordsInvolved[key].letter_usage_count = 1;//first occurance.
		    }else{
			WordsInvolved[key].letter_usage_count++;
		    }
		    
		    //add the key to the list if not there already...
		    if(!contains(KeysList,key)){
			KeysList.push(key);
			var WordRef = {
			    PI: old_PI,
			    WI: old_WI			
			};
			WordsInvolved[key].OldUsage = WordRef;
			WordsInvolvedList.push(WordRef);
		    }
		}
	    }

	    //by this point, we have run through all the letters of the word. Here, we look at every word utilised, and determine if it is fully utilised.
	    //keylists will have zero length if the SNATCH is a fresh word...
	    for(var i=0; i<KeysList.length; i++){
		var key_i = KeysList[i];
		var PI_i = WordsInvolved[key_i].OldUsage.PI;
		var WI_i = WordsInvolved[key_i].OldUsage.WI;
		console.log("At key " + key_i + ", we consider player " + PI_i + " word " + WI_i);
		console.log("the word is: " + GD.playerSet[PI_i].words[WI_i]);
		var wordlength_i = GD.playerSet[PI_i].words[WI_i].length;
		if(wordlength_i != WordsInvolved[key_i].letter_usage_count){
		    return {validity: 'invalid letters: partial usage of word ' + key_i};
		}
		//just tagging in this extra check: reject if length is not increased...
		if(wordlength_i == tile_id_array.length){
		    if(!duplicate_tilegroup_msg){
			return {validity: 'invalid: word length unchanged (at ' + wordlength_i + ' letters)'};
		    }else{
			//note that we only raise the duplication error if the duplicate move is not valid. It may be valid
			return {validity: 'duplicate'};
		    }
		}
	    }

	    // also check is it a valid word
	    //dictionary comparison, still TODO!!
	    return {validity: 'accepted', words_consumed: WordsInvolvedList};

	},

	playerSnatches: function(tile_id_array,socket_key) {
	    var PI = player_index_from_socketKey_lkup[socket_key];
	    var Response = {};
	    var validation_results = this.snatchWordValidation(PI, tile_id_array);
	    Response.val_check = validation_results.validity;

	    //check the snatch is valid:
	    if(Response.val_check == 'accepted'){// snatch accepted
	    	console.log("Player " + PI + " SNATCH accepted.");
		var words_consumed = validation_results.words_consumed;
		var words_consumed_orig = JSON.parse(JSON.stringify(words_consumed));

		//BUSINESS LOGIC: UPDATE SERVER-SIDE GAME REPRESENTATION

		//[step 1] remove any consumed words. This also includes updating the GD.tile_ownership[] array, as indexes shift...
		for(var i=0; i<words_consumed.length; i++){
		    var old_PI = words_consumed[i].PI;
		    var old_WI = words_consumed[i].WI;
		    var lost_word = GD.playerSet[old_PI].words.splice(old_WI,1)[0];

		    //maintain validity of words_consumed[i] given word index shift due to splice operation...
		    for(var j=i+1; j<words_consumed.length; j++){
			if(words_consumed[j].PI == old_PI){//other word consumed is from this same player...
			    if(words_consumed[j].WI > old_WI){//this word comsumed is later on in the list...
				words_consumed[j].WI--;//decrement the index...
			    }
			}
		    }

		    //maintain validity of GD.tile_ownership[TID] given word index shift due to splice operation...
		    var PI_wordset = GD.playerSet[old_PI].words;
		    for(var j=old_WI; j<PI_wordset.length; j++){
			for(var k=0; k<PI_wordset[j].length; k++){
			    var TID = PI_wordset[j][k];
			    GD.tile_ownership[TID] = {
				player_index: old_PI,
				word_index: j
			    };
			}
		    }
		    console.log("Player " + old_PI + "'s word (" + JSON.stringify(lost_word) + ") was taken");
		}

		//[step 2] update all letters so that they cannot be claimed again as status 'turned' single letters
		for(var i=0; i<tile_id_array.length; i++){
		    var TID = tile_id_array[i];
		    //update status
		    GD.tileSet[TID].status = 'inword';
		    //hold a back-reference (Tile objects back-references from player/word index)
		    //the length attribute will increment when the new word is added, which happens subsequently, and so it (now) represents its index
		    GD.tile_ownership[TID] = {
			player_index: PI,
			word_index: GD.playerSet[PI].words.length
		    };
		}
	
		//[step 3] - puts the snatched word into the server's data structure
		GD.playerSet[PI].words.push(tile_id_array);
		
		//COMMUNICATION LOGIC: SENDING THE CHANGE TO ALL CLIENTS...

		Response.SnatchUpdateMsg = {
		    player_index: PI,
		    tile_id_array: tile_id_array,
		    words_consumed: words_consumed_orig
		}
	    }else{ // snatch rejected
	    	console.log("Player " + PI + " SNATCH rejected : " + Response.val_check);
	    }

	    //log status at this point...
	    console.log("Words in player are now:");
	    for(var i=0; i<GD.playerSet.length; i++){
		console.log("Player " + i + "  has: " + JSON.stringify(GD.playerSet[i].words));
	    }
	    console.log("--------\n");

	    return Response;
	},

	//this is copy-pasted client side code...
	TileIDArray_to_LettersString: function(TileIDArray){
	    //get the letter set
	    var letters_string = "";
	    for(var i = 0; i < TileIDArray.length; i++){
		var TI = TileIDArray[i];
		var myletter = GD.tileSet[TI].letter;
		letters_string += myletter;
	    }
	    return letters_string;
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


//code taken from http://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c
/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }
	
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return 'rgb(' + Math.round(r * 255,0) + ',' + Math.round(g * 255,0) + ',' + Math.round(b * 255,0) + ')';
}



function generateDistributedRandomColorSet(n_colors){
    var myColSet = [];

    var M = [{sat_m: 0.9, sat_s: 0.1, lum_m: 0.40, lum_s: 0.15},
	     {sat_m: 0.9, sat_s: 0.1, lum_m: 0.70, lum_s: 0.15},
	     {sat_m: 0.6, sat_s: 0.3, lum_m: 0.50, lum_s: 0.10}];

    var h_rot = 3 * Math.random() / n_colors;

    for (var i = 0; i < n_colors; i++) {
	var myM = M[i%3];
	var h_i = ( i/n_colors + h_rot) % 1.0;
	var s_i = myM.sat_m + (2*Math.random() - 1) * myM.sat_s;
	var l_i = myM.lum_m + (2*Math.random() - 1) * myM.lum_s;
	myColSet.push(hslToRgb(h_i, s_i, l_i));
    }
    return myColSet;
}



//TODO - set up shared code better.
////////this code is duplicate - also present on clientside...
function contains(a, obj) {
    for (var i = 0; i < a.length; i++) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
}



////////////////////////////////////////
//todo: this is just code tagged onto the end of the file. doing this is a bit messy...
////////////////////////////////////////

// Warn if overriding existing method
if(Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});


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
