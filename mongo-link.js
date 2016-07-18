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

	serve_word_list_page2: function(res){

	    db_event(function(db){

		var collection = db.collection('words_snatched');
		collection.aggregate([{$group : {_id : "$word", count : {$sum : 1}}}]).toArray(function (err, result) {
		    if (err) {
			console.log(err);
		    } else {
			console.log('data retrieved from DB');

			var str = "<b> Cumulation of all words snatched </b> <br>";
			for(var i=0; i < result.length; i++){
			    str += result[i]._id + ": <b>" + result[i].count + "</b><br>";
			}

			res.send(str);
		    }
		    //Close connection
		    db.close();
		});//find complete
	    });//event (connect) complete

	},

	next_snatch_PID: function(SET_ME){

	    db_event(function(db){

		var collection = db.collection('counters');
		//step 1: find the existing value, if present...
		collection.find({counter_type: 'n_restarts'}).toArray(function (err, result) {
		    if (err) {
			console.log(err);
		    } else {
			
			// step 2: if not present, add and initialise to zero
			if(result.length == 0){
			    console.log("Snatch_pid initialised to : Zero");
			    SET_ME(0);
			    collection.insert({counter_type: 'n_restarts', count: 0}, function (err, result) {
				if (err) {
				    console.log(err);
				}
				db.close();
			    });

			    // step 3: if present, increment...
			}else{
			    var pid = (result[0].count + 1);
			    collection.update({counter_type: 'n_restarts'}, {$set: {count: pid}}, function (err, data) {
				if (err) {
				    console.log(err);
				}else{
				    SET_ME(pid);
				    console.log("Snatch_pid initialised to : " + pid);
				}
				db.close();
			    });
			}
		    }
		});//find complete
	    });//event (connect) complete
	},

    };//return a collection of functions

}
