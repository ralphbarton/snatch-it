module.exports = function (){

    var mongodb = require('mongodb');
    var MongoClient = mongodb.MongoClient;// Work with "MongoClient" interface to connect to a mongodb server.
    var url = 'mongodb://localhost:27017/snatch_db'; // where mongodb server is running.

    // This function will regenerate game history from database data
    var StatsProcessor = require('./stats-calc.js')();

    XLSX = require('xlsx');

    function db_event(db_func){
	// Use connect method to connect to the Server
	MongoClient.connect(url, function (err, db) {
	    if (err) {
		console.log('Mongo: Unable to connect to the mongoDB server. Error:', err);
	    } else {
		console.log('Mongo: Connection made to DB');
		db_func(db);//this is my function
		//db.close();
	    }
	});
    };


    // MONGOOSE stuff all BELOW here...
    var mongoose = require('mongoose');

    var db = mongoose.connection;

    db.on('error', console.error);

    // this is now a section for MongoDB schema defintion:

    var save_game_schema = new mongoose.Schema({
	game_db_uID: Number,
	timeStarted: { type: Date, default: Date.now },
	timeAccessed: { type: Date, default: Date.now },
	original_key: String,
	original_pin: Number,
	original_SnPID: Number,
	GameData: mongoose.Schema.Types.Mixed
    });

    //Compile Schema into Model
    var SaveGame = mongoose.model('SaveGame', save_game_schema);

    var game_event_schema = new mongoose.Schema({
	timeStamp: { type: Date, default: Date.now },
	game_db_uID: Number,
	event_type: String,
	player_name: String,
	player_number: Number,
	orderedLetters: String,
	orderedTileIDs: [Number]
    });

    //Compile Schema into Model
    var GameEvent = mongoose.model('GameEvent', game_event_schema);




    mongoose.connect(url);

    console.log("Prepared to connected to", url);

    return{
	log_word: function(my_word){
	    db_event(function(db){

		var collection = db.collection('words_snatched');
		collection.insert({word: my_word}, function (err, result) {
		    if (err) {
			console.log(err);
		    } else {
			console.log('insertion executed', result);
		    }
		    //Close connection
		    db.close();
		});//insert complete
	    });//event (connect) complete
	},


//simpler list...
/*
	serve_word_list_page: function(res){

	    db_event(function(db){

		var collection = db.collection('words_snatched');
		collection.find({}).toArray(function (err, result) {
		    if (err) {
			console.log(err);
		    } else {
			console.log('data retrieved from DB');
			res.send(result);
		    }
		    //Close connection
		    db.close();
		});//find complete
	    });//event (connect) complete

	},
*/

	serve_word_list_page2: function(res, my_op){

	    db_event(function(db){

		var collection = db.collection('words_snatched');
		collection.aggregate([{$group : {_id : "$word", count : {$sum : 1}}}]).toArray(function (err, result) {
		    if (err) {
			console.log(err);
		    } else {
			console.log('data retrieved from DB');

			//this is to show count of how many words of each length...
			if(my_op==1){
			    var str = "<b> Length distribution of all words snatched since 17th July 2016 </b> <br><br>";
			    var word_lengths = [];

			    for(var i=0; i < result.length; i++){

				var length = result[i]._id.length;
				if(word_lengths[length]==undefined){
				    word_lengths[length] = 0;
				}
				word_lengths[length] += result[i].count;//there may be multiple of a particular word

			    }

			    for(var i=3; i < word_lengths.length; i++){//start with 3 letter words...
				if(word_lengths[i]==undefined){word_lengths[i]=0;}
				str += "Count of " + i + " letter words: <b>" + word_lengths[i] + "</b><br>";
			    }

			    res.send(str);

			}else{
			    var str = "<b> Cumulation of all words snatched since 17th July 2016 </b> <br><br>";
			    for(var i=0; i < result.length; i++){
				str += result[i]._id + ": <b>" + result[i].count + "</b><br>";
			    }

			    res.send(str);
			}
		    }
		    //Close connection
		    db.close();
		});//find complete
	    });//event (connect) complete

	},

	IncrDBcount: function(SET_ME,counter_name){

	    //this code is just to add a layer of protection to what gets added in the database...
	    var counter_type_str = 'unknown count';
	    if(counter_name == 'Snatch_pid'){
		counter_type_str = 'n_restarts';

	    }else if(counter_name == 'game_db_uID'){
		counter_type_str = 'n_game_instances';
	    }

	    db_event(function(db){

		var collection = db.collection('counters');
		//step 1: find the existing value, if present...
		collection.find({counter_type: counter_type_str}).toArray(function (err, result) {
		    if (err) {
			console.log(err);
		    } else {
			
			// step 2: if not present, add and initialise to zero
			if(result.length == 0){
			    console.log(counter_type_str + " initialised to : Zero");
			    SET_ME(0);
			    collection.insert({counter_type: counter_type_str, count: 0}, function (err, result) {
				if (err) {
				    console.log(err);
				}
				db.close();
			    });

			    // step 3: if present, increment...
			}else{
			    var pid = (result[0].count + 1);
			    collection.update({counter_type: counter_type_str}, {$set: {count: pid}}, function (err, data) {
				if (err) {
				    console.log(err);
				}else{
				    SET_ME(pid);
				    console.log(counter_type_str + " now at : " + pid);
				}
				db.close();
			    });
			}
		    }
		});//find complete
	    });//event (connect) complete
	},


// This is just a reminder of the structure of the obj_AG object mentioned below, actually used in snatch.js

/*
	dict_activeGames[room_pin] = {
	    db_uID: next_game_db_uID,
	    room_key: key_deets.key,
	    closeTimeoutID: undefined,
	    timeStarted: (new Date),
	    timeAccessed: undefined,
	    GameInstance: snatchSvr_factory(qty_tiles, WordDictionaryTools.in_dictionary)
	};
*/

	Save_Game: function(obj_AG, arg1, arg2){

	    var query = { game_db_uID: obj_AG.db_uID };// this is where game UID object comes in...
	    var props_obj = {
		timeStarted: obj_AG.timeStarted,
		timeAccessed: obj_AG.timeAccessed,
		original_key: obj_AG.room_key,
		original_pin: arg1,
		original_SnPID: arg2,//Snatch 'Process ID' (process counter). 'Original' in the sense of which process init-ed
		GameData: (obj_AG.GameInstance.get_FullGameData())
	    };

	    SaveGame.update(query, {$set: props_obj}, {upsert: true}, function (err, result) {
		if (err) {
		    console.log(err);
		} else {
		    console.log('game upserted in DB...');
		}
	    });
	},


	reload_by_game_db_uID: function(res, uid, dict_activeGames, snatchSvr_factory, keygen, get_active_uids_list, WordDictionaryTools, access_room, mongo_link, my_SDC){

	    db_event(function(db){
		SaveGame.find({game_db_uID:uid}, function (err, kittens) {

		    var Saved_Game = kittens[0];
		    if (Saved_Game == undefined){
			console.log("A requested saved game was not found in the database");
			res.send("A requested saved game was not found in the database");
		    }else if(get_active_uids_list().indexOf(uid) != -1){
			//condition to check if game already loaded
			console.log("Cannot reload an already loaded Game");
			res.send("Cannot reload an already loaded Game");
		    }else{
			// NOTE TO SELF: this is pretty similar code to handler for socket.on('request to init room'...
			var key_deets = keygen.getPIN();
			var room_pin = key_deets.pin;
			var myRetrivedGame = snatchSvr_factory(null, WordDictionaryTools.in_dictionary, Saved_Game.GameData);

			// Create a new room instance, referenced by the room_pin
			dict_activeGames[room_pin] = {
			    db_uID: uid,
			    room_key: key_deets.key,
			    closeTimeoutID: undefined,
			    timeStarted: (new Date(Saved_Game.timeStarted)),
			    timeAccessed: undefined,
			    GameInstance: myRetrivedGame
			};
			access_room(room_pin);//this perhaps ought to be part of constructor. Needed to put timeout in place.

			// Lookup all definitions of all words, in one hit...
			var players_data = myRetrivedGame.getGameObject().playerSet;
			for(var i=0; i < players_data.length; i++){
			    var word_list_i = players_data[i].words;
			    for(var j=0; j < word_list_i.length; j++){
				var word_str = myRetrivedGame.TileIDArray_to_LettersString(word_list_i[j]);
				my_SDC.lookup_definition(word_str);
				console.log("Looking up a word for a retrieved game:" + word_str);
			    }
			}

			// log as a Game Event			
			mongo_link.log_GameEvent({
			    game_db_uID: uid,
			    event_type: "game reloaded",
			    player_name: null,
			    player_number: null,
			    orderedLetters: null,
			    orderedTileIDs: null
			});

			console.log("Game reloaded with new key/pin: ", key_deets);
			var str1 ="Reloaded game of uid "+uid+".<br>Original key: "+Saved_Game.original_key+"<br>New key: "+key_deets.key; 
			var str2 = "<br><a href='/'>Homepage</a><br>";
			var str3 = "<a href='/join="+key_deets.pin+"'>Enter...</a><br>";
			res.send(str1 + str2 + str3);
		    }
		});
	    });
	},


	serve_SaveGame_list: function(res, dict_activeGames, uid_list_fun){

	    var Mnths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	    //generate the list of uIDs of the active games
	    var uid_active = uid_list_fun();

	    var projection_query = {
		_id: false,
		game_db_uID: true,
		timeStarted: true,
		original_pin: true,
		original_key: true
	    };

	    db_event(function(db){
		SaveGame.find({}, projection_query, function (err, kittens) {

		    var my_tbl = "<table style=\"border: 1px solid black\">\
<tr>\
<th>Date Started</th>\
<th>Time Started</th>\
<th>Save Game ID</th>\
<th>Key (original)</th>\
</tr>";


		    for(var i = 0; i < kittens.length; i++){
			var thisDate = new Date(kittens[i].timeStarted);
			var pin = kittens[i].original_pin;
			var uid = kittens[i].game_db_uID
			var newly_active = dict_activeGames[pin] != undefined;
			var reactivated = false;
			if (newly_active){
			    active = dict_activeGames[pin].db_uID == uid;
			}else{
			    // so we already know it is not the case that
			    // (1) the original pin is an active pin, AND
			    // (2) the game's (original) uid matches between RAM copy and DB copy
			    reactivated = (uid_active.indexOf(uid) != -1);
			}
			
			//Generates the HTML for the table of Saved Games
			var key_cell_cont = kittens[i].original_key;
			if((!reactivated)&&(!newly_active)){
			    key_cell_cont += " <a href='/db_retrieve="+uid+"'>(reload...)</a>"
			}

			my_tbl +=  "<tr>\
<td>" + thisDate.getDate() + "-" + Mnths[thisDate.getMonth()] + "</td>\
<td>" + thisDate.toLocaleTimeString() + "</td>\
<td>" + uid + "</td>\
<td style=\"color: "+(newly_active?"red":(reactivated?"orange":"blue"))+"\">" + key_cell_cont + "</td>\
</tr>";
		    }

		    my_tbl += "</table>";

		    var str2 = "<b>Saved Games Listing from Database (count="+kittens.length+")</b><br><br>";
		    res.send(str2 + my_tbl);

		    
		});
	    });
	},


	log_GameEvent: function(game_event_props){

	    game_event_props.timeStamp = new Date();

	    var game_event = new GameEvent(game_event_props);

	    game_event.save(function (err, fluffy) {
		if (err) return console.error(err);
		console.log("Game Event Logged");
	    });

	},


	serve_GameEvent_list: function(res, db_uID){

	    var query = db_uID ? {game_db_uID: db_uID} : {};

	    db_event(function(db){

		GameEvent.find(query, function (err, kittens) {
		    if (err) return console.error(err);
//		    res.send(syntaxHighlight(kittens));
		    var my_str = JSON.stringify(kittens, null, 2);
		    my_str = "<pre><code>" + my_str + "</pre></code>";

		    var str2 = "<b>Database dump for " + (db_uID ? ("game with uID = "+db_uID) : "all games logged") + "</b><br>";
		    str2 += "<a href=\"/get_xlxs\">Download Excel file...</a><br><br>";
		    res.send(str2 + my_str);
		    write_GameEvent_xlsx(kittens);
		});

	    });
	},

	GameStats_for_client: function(db_uID, cb){

	    var query = {
		game_db_uID: db_uID,
	    };

	    db_event(function(db){

		GameEvent.find(query, function (err, kittens) {
		    if (err) return console.error(err);

		    //at this point, we have retrieved the data...
		    var big_array = StatsProcessor.StateHistoryFromData(kittens);

		    console.log(JSON.stringify(big_array, null, 2));
		    cb(big_array);

		});

	    });

	}

    };//return a collection of functions

}


// this is for sending all the JSON in an HTML serve...

function syntaxHighlight(json) {
    if (typeof json != 'string') {
         json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}



function write_GameEvent_xlsx(data){

    var workbook = XLSX.readFile('files_creation/blank.xlsx');

    var first_sheet_name = workbook.SheetNames[0];
    var address_of_cell = 'A1';
    
    // Get worksheet
    var worksheet = workbook.Sheets[first_sheet_name];

    //we only write to the workbook...
    for(var i = 0; i < data.length; i++){
	var row = i+2;

	worksheet['A'+row] = {v: data[i].game_db_uID};
	worksheet['B'+row] = {v: data[i].timeStamp};
	worksheet['C'+row] = {v: data[i].player_name};
	worksheet['D'+row] = {v: data[i].event_type};
	worksheet['E'+row] = {v: data[i].orderedLetters};
	worksheet['F'+row] = {v: data[i].orderedTileIDs};
    }


    XLSX.writeFile(workbook, 'files_creation/latest.xlsx');


    // even if this library may offer benefits, I don't seem to be able to make it open files...
    /*
      var EditXlsx = require('edit-xlsx');

      var path = "/home/ralph/Documents/Projects/20-ralph-administrated-websites/digitalocean-mirror/snatch-it.rocks/abc.xlsx";

      var xlsx = new EditXlsx("/home/ralph/Documents/Projects/20-ralph-administrated-websites/digitalocean-mirror/snatch-it.rocks/abc.xlsx");
      var sheet = xlsx.sheet(0);
      
      sheet.update('A1', 'Title');
      sheet.update([2, 1], 'Creator');

      xlsx.save('files_creation/out2.xlsx');
    */

}
