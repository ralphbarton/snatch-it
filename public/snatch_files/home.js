var room_tag = undefined;

//initiate game exchange
function initiate_game(){
    $("#page1").css("display", "none");
    $("#page2").css("display", "block");
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

function start_game(room_tag_2){
    socket.emit('join room and start', (room_tag_2!=undefined?room_tag_2:room_tag));
};



var listeners_need_adding = true;
function add_listeners(){

    if(listeners_need_adding){
	listeners_need_adding=false;
	//show the randomly generated room code on-screen
	socket.on('your room tag', function(msg_obj){
	    room_tag = msg_obj;
	    $("#tag-box").html(msg_obj);
	});

	// create an HTML table for all the open games...
	socket.on('rooms list', function(ActiveRoomsList){
	    //code here to construct the list of rooms on-screen
	    // unfortunately, this is a massive chunk of copy-pasted code
	    var doc = document;
	    var fragment = doc.createDocumentFragment();
	    //get the data
	    var rooms_array = [];
	    console.log(ActiveRoomsList);
	    for (var key in ActiveRoomsList) {
		if (ActiveRoomsList.hasOwnProperty(key)) {
		    rooms_array.push(key);
		}
	    }

	    //make the HTML elements constituting the table...
	    for(var i = 0; i < rooms_array.length; i++){

		var r = rooms_array[i];
		var tr = doc.createElement("tr");
		var td1 = doc.createElement("td");
		td1.innerHTML = "<a href=\"#\" class=\"red-link\" onclick=\"start_game('"+r+"')\">"+r+"</a>";
		tr.appendChild(td1);
		fragment.appendChild(tr);
	    }

	    var table = doc.createElement("table");
	    table.appendChild(fragment);

	    var rooms_div = doc.getElementById("room-table");
	    rooms_div.innerHTML = "";
	    rooms_div.appendChild(table);
	});
    }
};
