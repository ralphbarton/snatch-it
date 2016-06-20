var socket = io();

var d_src = ["http://www.dictionary.com/browse/", "http://www.thefreedictionary.com/"];

socket.on('new word definition', function(W_DEF){
/*  {
	word_queried: <string>
	word_defined: <string>
	n_definitions: <int>
	DefnList: <Array>
    }*/

    var tag_id = '#defn-' + W_DEF.word_queried.toUpperCase();

    if($(tag_id).html()=="no definition recieved"){$(tag_id).html("");}

    var w_change = W_DEF.word_defined.toLowerCase() != W_DEF.word_queried.toLowerCase();
    var no_defn = W_DEF.word_defined == '---';

    var w_class = (!no_defn && w_change) ? "ln-red" : "ln-plain" 
    var ln_word = (!no_defn && w_change) ? W_DEF.word_defined.toLowerCase() : W_DEF.word_queried.toLowerCase();

    var RAG = "green";
    var lin = '<a class="defn-source-ln" href="' + d_src[0] + ln_word + '" target="_blank">' + d_src[0] + '<span class="' + w_class + '">' + ln_word + '</span>' + '</a>';
    var src_cm = 'Extracted from ' + lin;

    if(no_defn){
	RAG = "red";
	var src_cm = 'Defintion not present on ' + lin;
    }else if(w_change){
	RAG = "pale";
	var src_cm = 'Extracted from (word altered) ' + lin;
    }


    $(tag_id).append(//into the TABLE CELL

	$("<div></div>").addClass("defn-container").append(//into the EXTRACT CONTAINER (1)
	    $("<div></div>").addClass("defn-blob blob-"+RAG)//this is the BLOB
	).append(//into the EXTRACT CONTAINER (2)
	    $("<div></div>").addClass("defn-source").html(src_cm)//this is the source link etc.
	)// EXTRACT CONTAINER
    );// TABLE CELL

    var my_defn_cont = $(tag_id).children(".defn-container");
    for (var i = 0; i < W_DEF.DefnList.length; i++){
	my_defn_cont.append(
	    $("<div></div>").addClass("defn-text").html(W_DEF.DefnList[i]) // this this the definition
	);
    }

    var xx = W_DEF.n_definitions;//abbrev.
    var my_str = "("+xx+" defintion"+(xx>1?"s":"")+" found)";
    if (W_DEF.DefnList.length > 0){
	my_defn_cont.append(
	    $("<div></div>").addClass("defn-qty").html(my_str)
	);
    }

});
