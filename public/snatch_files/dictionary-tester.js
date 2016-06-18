var socket = io();

var d_src = ["http://www.dictionary.com/browse/", "http://www.thefreedictionary.com/"];

socket.on('new word definition', function(w_def){
    var W = w_def.word;
    var w = w_def.word.toLowerCase();
    var D = w_def.definition;
    var tag_id = '#defn-' + W.toUpperCase();

    if($(tag_id).html()=="no definition recieved"){$(tag_id).html("");}

    var RAG = "green";
    var ok = true;
    var lin = '<a class="defn-source-ln" href="' + d_src[0] + w + '" target="_blank">' + d_src[0] + w + '</a>';
    var src_cm = 'Extracted from ' + lin;

    if(D.indexOf("no definition found") > -1){	
	RAG = "dark";
	ok =false;
	src_cm = 'Not extracted sucessfully from ' + lin;
    }else if(D.indexOf("unexpected page structure") > -1){
	RAG = "red";
	ok =false;
	src_cm = 'Word not defined on ' + lin;
    }


    $(tag_id).append(//into the TABLE CELL

	$("<div></div>").addClass("defn-container").append(//into the EXTRACT CONTAINER (1)
	    $("<div></div>").addClass("defn-blob blob-"+RAG)//this is the BLOB
	).append(//into the EXTRACT CONTAINER (2)
	    $("<div></div>").addClass("defn-source").html(src_cm)//this is the source link etc.
	).append(//into the EXTRACT CONTAINER (3)
	    $("<div></div>").addClass("defn-text").html(ok?D:'') // this this the definition
	)// EXTRACT CONTAINER

    );// TABLE CELL

/*
    $(tag_id).append('<div class="defn-container">\
<div class="defn-blob blob-' + RAG + '"></div>\
<div class="defn-source">Extracted from <a class="defn-source-ln" \
href="' + d_src[0] + w + '" target="_blank">' + d_src[0] + w + '</a></div>\
<div class="defn-text">' + D + '</div>\
</div>\
');
*/

});
