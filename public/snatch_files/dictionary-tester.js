var socket = io();

socket.on('new word definition', function(w_def){
    var tag_id = '#defn-' + w_def.word.toUpperCase();
    $(tag_id).html(w_def.definition);
});
