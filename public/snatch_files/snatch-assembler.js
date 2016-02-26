var Assembler = {

    synthesiseSnatch: function(letters_array){
	var tileID_array = [];
	console.log(letters_array);	
	for (var i=0; i<letters_array.length; i++){//work through the word from the beginning
	    for (var j=tileset.length-1; j>=0; j--){//work through the unused tiles from the end
		if ((tileset[j].status == 'turned')&&(tileset[j].letter==letters_array[i])){
		    if(!contains(tileID_array,j)){
			tileID_array.push(j);
			j=-1;//this is to break the inner loop
		    }
		} 
	    }
	}

	return tileID_array;
    }

};

