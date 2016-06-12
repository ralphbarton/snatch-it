function gen_link_as_key(){
    $("#k2").val("http://www.snatch-it.rocks/join=" + room_key.replace(" ","-"));// this is the "input" element
};

function gen_link_as_pin(){
    $("#k2").val("http://www.snatch-it.rocks/join=" + room_pin);// this is the "input" element
};
