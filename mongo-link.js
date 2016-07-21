module.exports = function (){

    var mongodb = require('mongodb');
    var MongoClient = mongodb.MongoClient;// Work with "MongoClient" interface to connect to a mongodb server.
    var url = 'mongodb://localhost:27017/snatch_db'; // where mongodb server is running.

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

	    SaveGame.findOneAndUpdate(query, props_obj, {upsert: true}, function (err, result) {
		if (err) {
		    console.log(err);
		} else {
		    console.log('game upserted in DB...');
		}
	    });
	},


	reload_by_game_db_uID: function(uID){

	},

	serve_SaveGame_list: function(res, my_op){

	    db_event(function(db){

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


	serve_GameEvent_list: function(res){

	    db_event(function(db){

		GameEvent.find(function (err, kittens) {
		    if (err) return console.error(err);
//		    res.send(syntaxHighlight(kittens));
		    var my_str = JSON.stringify(kittens, null, 2);
		    my_str = "<pre><code>" + my_str + "</pre></code>";

		    res.send(my_str);
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
