function playerIdentityPrompt(colorSetObjStr){

    var playerName = prompt("What is your name?");
    var colorChoices = JSON.parse(colorSetObjStr);

    ts_px = myZoneWidth * 0.070;
    
    var mytext = "Welcome, " + playerName + "!\nSelect your color:";
  
    var prompt_text_obj = new fabric.Text(mytext, {
	textAlign: 'left',
	fontWeight: 'bold',
	fontSize: ts_px,
	left: 20,
	top: 20
    });

    top_btm_px = prompt_text_obj.getHeight()*0.9;
    console.log(top_btm_px);

    canvas.add(prompt_text_obj);

    var circleCenterX = myZoneWidth/2;
    var effectiveHeight = myZoneHeight - top_btm_px;
    var circleCenterY = top_btm_px + effectiveHeight / 2;
    var circleRadius = Math.min(myZoneWidth, effectiveHeight)*0.5*0.6;
    var blipBlopRadius = circleRadius*0.4;

    var placement_angle = 18 + 36;
    var radSF = Math.PI*2 / 360;

    var BlipBlop = [];//this is the array of coloured circles

    canvas.setBackgroundColor('white');

    for (i=0; i<5; i++){

	var mcLeft_c = circleCenterX + circleRadius * Math.cos(radSF*placement_angle);
	var mcTop_c = circleCenterY - circleRadius * Math.sin(radSF*placement_angle);
	var mcLeft = mcLeft_c - blipBlopRadius;
	var mcTop = mcTop_c - blipBlopRadius;

	var myBB = new fabric.Circle({
	    radius: blipBlopRadius,
	    stroke: 'black',
	    strokeWidth:blipBlopRadius*0.2,
	    fill: colorChoices[i].color,
	    left: mcLeft,
	    top: mcTop,
	    hasControls: false,
	    hasBorders: false
	});

	myBB.BBindex = i;

	
	BlipBlop.push(myBB);
	canvas.add(myBB);
	placement_angle += 72;

    }
    
    canvas.renderAll();


    var myDur = 400;
    function shrinkBB(myBB){
	var newLeft = myBB.getLeft()+blipBlopRadius; 
	var newTop = myBB.getTop()+blipBlopRadius;
	
	var myEas = fabric.util.ease.easeOutCubic;
	myBB.animate('left',newLeft, {
	    onChange: function() {
		canvas.renderAll();
	    },
	    easing: myEas,
	    duration: myDur
	});
	myBB.animate('top',newTop, {
	    easing: myEas,
	    duration: myDur
	});
	myBB.animate('strokeWidth',0, {
	    easing: myEas,
	    duration: myDur
	});
	myBB.animate('radius', 0, {
	    easing: myEas,
	    duration: myDur
	});

    }

 
    //now add canvas mouse events...
    canvas.on('mouse:down',function(e){
	//right, so on mousedown shrink all the other circles to nothing then delete
	BB_hit = e.target.BBindex;
	if(BB_hit!==undefined){

	    for (i=0; i<5; i++){
		if(i==BB_hit){continue;}//don't vanish the BB we just hit!
		shrinkBB(BlipBlop[i]);
	    }
	}
    }); 



    canvas.on('mouse:up',function(e){
	//and on mouse UP, this is when we transmit to the server and move things along
	shrinkBB(e.target);
	BB_hit = e.target.BBindex;
	

	function finalBBanimationComplete(){


	    for (i=0; i<5; i++){
		canvas.remove(BlipBlop[i]);
	    }
	    canvas.remove(prompt_text_obj);
	    
	    rmLoadingMsg = gameMessage("Waiting for server\nto send the state of the ongoing\nSNATCH-IT game...",myZoneWidth * 0.065,'rgb(230,0,40)'); 

	    //send the data to the server
	    var playerDetailsObj = {
		name: playerName,
		color_index: colorChoices[BB_hit].index
	    };
	    var encodedObj = JSON.stringify(playerDetailsObj);

	    //after details are supplied, load the latest game state (timing is important here...)
	    socket.emit('player joined with details', encodedObj);
	    canvas.off('mouse:down');
	    canvas.off('mouse:up');
	}

	setTimeout(function(){finalBBanimationComplete();},myDur);

    });
}








//deals with the resetting of the game (lots of confirmation steps)
function resetGameButtonHandler(){
    var really = confirm("Do you really want to reset this game?");
    socket.emit('reset request', 0);
}

//submit word to server
function snatchItButtonHandler(myWordStr){
    //confirm("Submit the word"+myWordStr+"?");
    WordCreate.SubmitWord();
}


function cancelWordButtonHandler(){
    //alert("cancel word...");
    WordCreate.CancelWord();
}

function playersListButtonHandler(){

    var DIM = getTileSize() * 1.35;
    var tile_DIM = getTileSize();

    var windowBox = new fabric.Rect({
	left:DIM,
	top:DIM,
	width: myZoneWidth - 2*tile_DIM,
	height: myZoneHeight - 2*tile_DIM,
	fill: '#AAA',
	stroke: fg_col,
	strokeWidth: tile_DIM*tile_stroke_prop,
	rx: 0.12*tile_DIM,
	ry: 0.12*tile_DIM
    });

    canvas.add(windowBox);

}


function createGenericButton(text,n_ind,N_but){

    var tile_DIM = getTileSize();
    var gap_width = tile_DIM*0.3;
    var font_size = myZoneWidth * 0.030;
    var line_thickness = tile_DIM * 0.06;
    var corners_rounding = tile_DIM * 0.12;

    var button_width = (myZoneWidth - (N_but+1) * gap_width)/N_but;

    var button_left = n_ind * (button_width + gap_width) +0.5*gap_width+6;

    var buttonText = new fabric.Text(text,{
	originX: 'center',
	top: (tile_DIM - font_size)*0.5,
	fill: 'black',
	fontWeight: 'bold',
	fontSize: font_size
    });

    var buttonRect = new fabric.Rect({
	originX: 'center',
	top: 0,
	fill: '#AAA',
	stroke: fg_col,
	strokeWidth: line_thickness,
	width: button_width,
	height: tile_DIM,
	rx: corners_rounding,
	ry: corners_rounding
    });

    var buttonGrp = new fabric.Group( [buttonRect, buttonText], {
	hasControls: false,
	hasBorders: false,
	selectable: false,
	top: 6,
	left: button_left
    });

//E0D7C5
    //make the colour change on mouseover & mousedown
    buttonGrp.on("mouse:over",function(e){alert("mouse over");});

    
    buttonGrp.gameButtonID = n_ind;

    canvas.add(buttonGrp);
}


function createGameControlButtons(){
    
    createGenericButton("Cancel Word",0,4);
    createGenericButton("SNATCH IT",1,4);
    createGenericButton("Players List",2,4);
    createGenericButton("Reset Game",3,4);

}


function recolourGameControlButtons(){

