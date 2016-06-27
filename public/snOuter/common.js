function gen_link_as_key(){
    var homeURL = window.location.href.split('join')[0].replace("#","");
    $("#k2").val(homeURL + "join=" + room_key.replace(" ","-"));// this is the "input" element
};

function gen_link_as_pin(){
    var homeURL = window.location.href.split('join')[0].replace("#","");
    $("#k2").val(homeURL + "join=" + room_pin);// this is the "input" element
};

function initiate_copy_box(){

    //put the link into the box
    gen_link_as_pin()

    // this is the "button" element
    var copy_button = $('#k4');
    var link_text = $('#k2');

    //add listener to button which copies upon a click...
    copy_button.click(function(event) {
	link_text.select();

	try {
	    var successful = document.execCommand('copy');
	    var msg = successful ? 'successful' : 'unsuccessful';
	    console.log('Copying text command was ' + msg);
	} catch (err) {
	    console.log('Oops, unable to copy');
	}
    });

}
