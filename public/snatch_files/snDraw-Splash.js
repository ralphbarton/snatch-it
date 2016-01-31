snDraw.Game.Splash = {
    //TODO: splot this big function into smaller functions (even though there's no point...) there is: hierarchical sequence
    identityPrompt: function(colorSetObjStr){

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

	//TODO: set whether background is dark or light
	snDraw.Game.setDarkBackground(true);
	
	//now add canvas mouse events...
	canvas.on('mouse:down',function(e){
	    //right, so on mousedown shrink all the other circles to nothing then delete
	    if(e.target){
		BB_hit = e.target.BBindex;
		if(BB_hit!==undefined){

		    for (i=0; i<5; i++){
			if(i==BB_hit){continue;}//don't vanish the BB we just hit!
			shrinkBB(BlipBlop[i]);
		    }
		}
	    }
	}); 



	canvas.on('mouse:up',function(e){
	    //and on mouse UP, this is when we transmit to the server and move things along
	    
	    if(e.target){
		shrinkBB(e.target);
		BB_hit = e.target.BBindex;
		

		function finalBBanimationComplete(){


		    for (i=0; i<5; i++){
			canvas.remove(BlipBlop[i]);
		    }
		    canvas.remove(prompt_text_obj);
		    
		    snDraw.gameMessage("Waiting for server\nto send the state of the ongoing\nSNATCH-IT game...",myZoneWidth * 0.065,'rgb(230,0,40)'); 

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
	    }
	});
    }
};
