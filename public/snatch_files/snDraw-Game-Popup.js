snDraw.Game.Popup = {

    //Properties of this class...
    popup_in_foreground: false,


    //Methods of this class...
    
    scalePropertiesPlayersListWindow: function(){
	
	//things that scale with the Tile Size
	var ts = Math.round(snDraw.Game.tileSpacings.ts);
	var cr = ts * 0.30; // corner radius
	var fsz = ts * 0.50; // master font size

	//set style properties that depend on tile size...
	$("#modal_dark_sheet").css("font-size", fsz+"px");
	$("#modal-content").css("border-radius", cr+"px");
	$("#modal-header").css("border-radius", cr+"px "+cr+"px 0 0");
	$("#modal-footer").css("border-radius", "0 0 "+cr+"px "+cr+"px");
	$("#modal-body").css("max-height", snDraw.canv_H * 0.8+"px");

	//change the scale associated with those words with a black haze.
	$('.blacken').css({"text-shadow":"0px 0px "+fsz*0.05+"px black, 0px 0px "+fsz*0.1+"px black"});
    },

    createPlayersListWindow_html_scores_table: function(){

	// 3. Extract the data
	var player_scores_list = [];
	//extact scores from players stat structure:
	for(var i = 0; i < players.length; i++){
	    var player_i_score = 0;
	    for(var j = 0; j < players[i].words.length; j++){
		player_i_score += Math.max(1,players[i].words[j].length-2);
	    }
	    player_scores_list.push({
		p_index: i,
		score: player_i_score
	    });
	}

	function comparePlayers(a, b) {
	    return a.score - b.score;
	}
	player_scores_list.sort(comparePlayers);
	player_scores_list.reverse();

	var doc = document;
	var fragment = doc.createDocumentFragment();

	//Just create the table headings...
	var tr = doc.createElement("tr");
	var th1 = doc.createElement("th");
	th1.innerHTML = "Name";
	th1.className = "scores scores-underline";
	tr.appendChild(th1);

	var th2 = doc.createElement("th");
	th2.innerHTML = "Score";
	th2.className = "scores scores-underline";
	tr.appendChild(th2);

	//does not trigger reflow
	fragment.appendChild(tr);
	
	var n_psl = player_scores_list.length;
	for(var i = 0; i < n_psl; i++){

	    var Plr = players[player_scores_list[i].p_index];

	    var tr = doc.createElement("tr");
	    var td1 = doc.createElement("td");
	    td1.innerHTML = (i+1)+ ". " + Plr.name;
	    td1.className = "scores pl-name" + (i != n_psl-1?" scores-underline":"");
	    tr.appendChild(td1);

	    var td2 = doc.createElement("td");
	    td2.innerHTML = player_scores_list[i].score.toString();
	    tr.appendChild(td2);
	    td2.className = "scores pl-score" + (i<3?" blacken":"")+ (i != n_psl-1?" scores-underline":"");
	    td2.style["font-weight"] = (i<3?800:100);
	    td2.style["color"] = (i<3? Plr.color : 'black');

	    //does not trigger reflow
	    fragment.appendChild(tr);

	}

	var table = doc.createElement("table");
	table.appendChild(fragment);

	return table;
    },


    createPlayersListWindow: function(){

	this.scalePropertiesPlayersListWindow();

	//Inject the Title
	$("#box-title").html("Players");

	//Clear body then inject scores table
	var scores_table = this.createPlayersListWindow_html_scores_table();
	$("#modal-body").html("").append(scores_table);

	//Clear the footer then add the CLOSE and potentially PLAY AGAIN links...
	var close_link = "<a class=\"modal\" href=\"#\" onclick=\"snDraw.Game.Popup.removePlayersListWindow()\">Close</a>";
	$("#modal-footer").html("").append(close_link);
	if(snDraw.Game.Controls.client_finished_game == true){
	    $("#modal-footer").append(" | <a class=\"modal\" href=\"#\" onclick=\"snDraw.Game.Popup.gotoHomePage()\">Another Game</a>");
	}

	// ineligant, but a second call is necessary to apply styles to objects that didn't exist earlier
	this.scalePropertiesPlayersListWindow();

	this.createPlayersListWindow_generic_make_appear();
    },



    maybe_createConnectionLostWindow: function(){

	var x = $("#modal_dark_sheet").css('display');
	if(x[0] == 'n'){ //this is an ugly/unreliable to check if display:none for the div!
	    
	    this.scalePropertiesPlayersListWindow();

	    //Inject the Title
	    $("#box-title").html("Connection to server lost");
	    console.log($("#box-title").html());

	    //Clear body then inject scores table
	    $("#modal-body").html("<p>A constant connection to the server is required during this multiplayer game.</p>");
	    $("#modal-body").append("<p>By going back to the home page, you should be able to rejoin the same game using the <b>join</b> option.</p>");

	    //link to refresh page
	    $("#modal-footer").html("<a class=\"modal\" href=\"#\" onclick=\"snDraw.Game.Popup.gotoHomePage()\">Rejoin</a>");

	    this.createPlayersListWindow_generic_make_appear();
	}
    },


    create_GameSettings_Window: function(){

	var x = $("#modal_dark_sheet").css('display');
	if(x[0] == 'n'){ //this is an ugly/unreliable to check if display:none for the div!
	    
	    this.scalePropertiesPlayersListWindow();

	    //Inject the Title
	    $("#box-title").html("Options");
	    console.log($("#box-title").html());

	    //Clear body then inject some content (in this case the options)
	    $("#modal-body").html("note to self: add some options in this space...");
	    $("#modal-body").append("<a class=\"modal\" href=\"#\" onclick=\"snDraw.Game.Popup.gotoHomePage()\">Quit this game</a>");

	    //link to add a "close" link beneath...
	    var close_link = "<a class=\"modal\" href=\"#\" onclick=\"snDraw.Game.Popup.removePlayersListWindow()\">Close</a>";
	    $("#modal-footer").html("").append(close_link);

	    this.createPlayersListWindow_generic_make_appear();
	}
    },



    createPlayersListWindow_generic_make_appear: function(){
	var ds = document.getElementById("modal_dark_sheet");

	//make it visible...
	ds.style["display"] = "block";

	//only make the backround itself respond to clicks half a second after the scores have appeared (Touchscreen niggle fix)
	ds.onclick = undefined;
	setTimeout(function(){
	    ds.onclick = function(event) {
		if (event.target == ds) {
		    snDraw.Game.Popup.removePlayersListWindow();
		}
	    };
	}, 500);

	//the x button closes the window...
	document.getElementById("close").onclick = function() {
	    snDraw.Game.Popup.removePlayersListWindow();
	};
    },


    removePlayersListWindow: function(){
	$("#modal_dark_sheet").css("display", "none");
    },

    gotoHomePage: function(){
	var homeURL = window.location.href.split('join')[0];
	window.location.href = homeURL;
	
    }

};
