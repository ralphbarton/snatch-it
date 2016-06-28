var socket = io();

var room_pin = undefined;
var room_key = undefined;

//initiate game exchange
function initiate_game(){
    $("#page1").css("display", "none");
    $("#page2").css("display", "block");
    $("#page3").css("display", "none");
    add_listeners();
    socket.emit('request to init room', 0);
};

//join game exchange
function join_game(){
    $("#page1").css("display", "none");
    $("#page3").css("display", "block");
    add_listeners();
    socket.emit('request rooms list', 0);
};


function show_home(){
    $("#page1").css("display", "block");
    $("#page2").css("display", "none");
    $("#page3").css("display", "none");
};


var listeners_need_adding = true;
function add_listeners(){

    if(listeners_need_adding){
	listeners_need_adding=false;

	//show the randomly generated room code on-screen
	socket.on('new game pin and key', function(key_deets){
	    room_pin = key_deets.pin;
	    room_key = key_deets.key;
	    $("#game-key-box").html(key_deets.key);
	    $("#game-pin-box").html(key_deets.pin);
	    $("#start-btn-placeholder").html("<a href=\"/join="+room_pin+"\" class=\"red-link\">START</a>");
	    
	    //make the copy-paste stuff work...
	    initiate_copy_box();
	});

	// create an HTML table for all the open games...
	socket.on('rooms list', function(rooms_data_array){
	    //code here to construct the list of rooms on-screen
	    // unfortunately, this is a massive chunk of copy-pasted code
	    var doc = document;
	    var fragment = doc.createDocumentFragment();
	    //get the data

	    //make the HTML elements constituting the table...
	    for(var i = 0; i < rooms_data_array.length; i++){

		var r = rooms_data_array[i];
		// r is an object {room_key: #, n_players: #, duration: #, n_tiles_turned: #}
		var tr = doc.createElement("tr");

		// Col 1
		var td1 = doc.createElement("td");
		td1.innerHTML = r.room_pin;
		td1.className = "b33";
		tr.appendChild(td1);

		// Col 2
		var td1 = doc.createElement("td");
		td1.innerHTML = "<a href=\"/join="+r.room_pin+"\" class=\"red-link\">"+r.room_key+"</a>";
		td1.className = "b33";
		tr.appendChild(td1);

		// Col 3
		var td1 = doc.createElement("td");
		td1.innerHTML = r.n_tiles_turned + "% thru";
		td1.className = "b33";
		tr.appendChild(td1);

		// Col 4
		var td1 = doc.createElement("td");
		td1.innerHTML = r.n_players + " players";
		td1.className = "b33";
		tr.appendChild(td1);

		// Col 5
		var td1 = doc.createElement("td");
		td1.innerHTML = fuzzyTime(r.duration*1000) + "s ago";
		td1.className = "b33";
		tr.appendChild(td1);

		fragment.appendChild(tr);
	    }

	    var rooms_div = doc.getElementById("room-table");
	    if(rooms_data_array.length>0){

		var table = doc.createElement("table");
		table.appendChild(fragment);

		// clear the contents of the DEV then fill it with the table
		// this will always be triggered by the rooms list message..
		rooms_div.innerHTML = "";
		rooms_div.appendChild(table);
	    }else{
		rooms_div.innerHTML = "<p class=\"b34\"> No games have been created.<br> Click here to <a href=\"#\" class=\"red-link\" onclick=\"initiate_game()\">initiate a new game</a>.</p>";
	    }

	    //add a time-delay to refresh page contents (conditional on page being in foreground)...
	    if($("#page3").css("display")=="block"){
		setTimeout(function(){
		    socket.emit('request rooms list', 0);
		}, 1000 * 60 * 1);//in 1 minutes time, re-execute the function with updated information...
	    }

	});
    }
};
