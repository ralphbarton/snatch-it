function initiate_game(){
    $("#page1").css("display", "none");
    $("#page2").css("display", "block");

    socket.emit('request to init room', 0);
};

function join_game(){
    $("#page1").css("display", "none");
    $("#page3").css("display", "block");

    socket.emit('request to join room', 0);

};

function show_home(){
    $("#page1").css("display", "block");
    $("#page2").css("display", "none");
    $("#page3").css("display", "none");

};
