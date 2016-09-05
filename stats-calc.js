module.exports = function (){

    return{
	StateHistoryFromData: function(Game_Events){

	    var FullStateHistory = {
		StatePoints: [],
		LetterList: []
	    };

	    var CurrentStatePoint = {
		free_tiles: [], // tile IDs
		player_words: [], // tile IDs
		event_type: null,
		time_elapsed: 0
	    };

	    var start_time = undefined;

	    function push_history(my_Ei){

		// set the time...
		var cur_abs_time = new Date (my_Ei.timeStamp);
		CurrentStatePoint.time_elapsed = cur_abs_time - start_time;

		// set the event type
		CurrentStatePoint.event_type = my_Ei.event_type;

		// clone the current point snapshot
		var CurrentPointSnapshot = JSON.parse(JSON.stringify(CurrentStatePoint))
		FullStateHistory.StatePoints.push(CurrentPointSnapshot);
	    };

	    // === Run through the full list of events ===
	    for (var i=0; i < Game_Events.length; i++){
		var Ei = Game_Events[i];

		if(Ei.event_type == "turn"){

		    // 0. SET THE GAME START TIME...
		    // (the first "turn" of a game starts the game.)
		    if(start_time == undefined){
			start_time = new Date (Ei.timeStamp);
		    }

		    // 1. Log which letters they are...
		    FullStateHistory.LetterList.push(Ei.orderedLetters);//string length 1
		    CurrentStatePoint.free_tiles.push(Ei.orderedTileIDs[0]);

		    // 2. Push it into the History Array
		    push_history(Ei);

		}else if(Ei.event_type == "turn (auto)"){

		    // 1. Log which letters they are...
		    FullStateHistory.LetterList.push(Ei.orderedLetters[0]);// the string is "A, A", letters at indices
		    FullStateHistory.LetterList.push(Ei.orderedLetters[3]);// 0 and 3...
		    CurrentStatePoint.free_tiles.push(Ei.orderedTileIDs[0]);
		    CurrentStatePoint.free_tiles.push(Ei.orderedTileIDs[1]);

		    // 2. Push it into the History Array
		    push_history(Ei);

		}else if(Ei.event_type == "snatch"){

		    // 1. Enact effect upon snatch data

		    // strip away all TID refs...
		    for (var m=0; m < Ei.orderedTileIDs.length; m++){
			var TID = Ei.orderedTileIDs[m]; // use index of 'm' not of 'i'

			// 2.1 - remove from the 'free' list, if a consumed tile is here
			var j = CurrentStatePoint.free_tiles.indexOf(TID);
			if (j > -1) {
			    CurrentStatePoint.free_tiles.splice(j, 1);
			}

			// 2.2 - remove the entire word, if a consumed tile is contained in a word
			outer_search:
			for (var j=0; j < CurrentStatePoint.player_words.length; j++){
			    var Pj = CurrentStatePoint.player_words[j]; // Player J
			    if (Pj == undefined){Pj = [];}
			    for (var k=0; k < Pj.length; k++){
				var Wk = Pj[k]; // Word K
				for (var l=0; l < Wk.length; l++){
				    if (Wk[l] == TID){
					CurrentStatePoint.player_words[j].splice(k,1);
					break outer_search;// now that TID has been found once, break...
				    }
				}
			    }
			}
		    }

		    
		    if(CurrentStatePoint.player_words[Ei.player_number] == undefined){
			CurrentStatePoint.player_words[Ei.player_number] = [];
		    }
		    CurrentStatePoint.player_words[Ei.player_number].push(Ei.orderedTileIDs);

		    // 2. Push it into the History Array
		    push_history(Ei);
		 
		    //specifically, a snatch event...   
		}else if(i == Game_Events.length-1){//the final event in the log...

		    //regardless of event type, the final event in the log will go in...
		    push_history(Ei);

		}


	    }//cycling thought the game events
	    



	    ////////////////////////////////////////////////
	    // At this point the history array is created //
	    ////////////////////////////////////////////////

	    function individual_score(word_list){
		var score = 0;
		for (var i=0; i < word_list.length; i++){
		    score += word_list[i].length-2;
		}
		return score;
	    }	    

	    var Scores_Timeseries = [];

	    var XOX = FullStateHistory.StatePoints;

	    //Loop though all State-points
	    for (var i=0; i < XOX.length; i++){
		var SNi = XOX[i];

		//If a particular state point is a SNATCH
		if(SNi.event_type == "snatch"){

		    //loop through all players
		    for (var pi=0; pi < SNi.player_words.length; pi++){
			
			//if the player has words...
			if(SNi.player_words[pi] != undefined){

			    var pi_sco = individual_score(SNi.player_words[pi]);

			    if (Scores_Timeseries[pi] == undefined){
				Scores_Timeseries[pi] = [];
			    }
			    var series_pi = Scores_Timeseries[pi];

			    // only log the score upon a score change...
			    var b_add_point = false;
			    if (series_pi.length == 0){//test if this player has had score before
				b_add_point = true;
			    } else if (series_pi[series_pi.length-1].y != pi_sco){//test if score changed
				b_add_point = true;
			    }

			    if (b_add_point){
				series_pi.push({
				    x: SNi.time_elapsed,
				    y: pi_sco
				});
			    }
			}
		    }
		}
	    }

	    //add a final data point to each series for the final logged event...
	    //this is almost duplicating the code above...
	    //note that this still doesn't guarentee a 'final' point.
	    for (var pi=0; pi < Scores_Timeseries.length; pi++){
		var series_pi = Scores_Timeseries[pi];
		if (series_pi != undefined){//test if the array exists
		    if (series_pi.length > 0){//test if this player has had score so far at all
			var pi_sco = individual_score(SNi.player_words[pi]);
			series_pi.push({
			    x: SNi.time_elapsed,
			    y: pi_sco
			});
		    }
		}
	    }

	    return {
		Scores_Timeseries: Scores_Timeseries
	    };
	},

	non33: function(Game_Events){}                     
    };

}
