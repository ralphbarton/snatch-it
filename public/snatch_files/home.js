var room_tag = undefined;

function initiate_game(){
    $("#page1").css("display", "none");
    $("#page2").css("display", "block");

    //
    socket.emit('request to init room', 0);

    socket.on('your room tag', function(msg_obj){
	room_tag = msg_obj;
	$("#tag-box").html(msg_obj);
    });

};

function join_game(){
    $("#page1").css("display", "none");
    $("#page3").css("display", "block");

    socket.emit('request rooms list', 0);

    socket.on('rooms list', function(msg_obj){
	//code here to construct the list of rooms on-screen

    });

};

function show_home(){
    $("#page1").css("display", "block");
    $("#page2").css("display", "none");
    $("#page3").css("display", "none");

};

function start_game(){
    socket.emit('join room and start', room_tag);
};
