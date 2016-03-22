snDraw.Splash = {
    //TODO: split this big function into smaller functions (even though there's no point...) there is: hierarchical sequence
    identityPrompt: function(colorChoices){

	var playerName = prompt("What is your name?");
	while((playerName==null)||(playerName.length == 0)){
	    playerName = prompt("Please enter an actual name for yourself:");
	}

	var ts_px = myZoneWidth * 0.070;
	
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

	var removeUnselectedBBs = function(i_selected){
	    if(i_selected!==undefined){
		for (i=0; i<5; i++){
		    if(i==i_selected){continue;}//don't vanish the BB we just hit!
		    shrinkBB(BlipBlop[i]);
		}
	    }
	};

	var onComplete_finalBBshrink = function(i_selected){
	    for (i=0; i<5; i++){
		canvas.remove(BlipBlop[i]);
	    }
	    canvas.remove(prompt_text_obj);
	    
	    snDraw.gameMessage("Waiting for server\nto send the state of the ongoing\n\
SNATCH-IT game...",myZoneWidth * 0.065,'rgb(230,0,40)'); 

	    //send the data to the server
	    var playerDetailsObj = {
		name: playerName,
		color_index: colorChoices[i_selected].index
	    };
	    PLAYER_JOINED_WITH_DETAILS(playerDetailsObj);


	    //after details are supplied, load the latest game state (timing is important here...)
	    canvas.off('mouse:down');
	    canvas.off('mouse:up');
	    document.removeEventListener("keydown", KBlistenerSplash, false);

	};

	canvas.on('mouse:down',function(e){
	    if(e.target){
		var BB_hit_i = e.target.BBindex;
		removeUnselectedBBs(BB_hit_i);
	    }
	}); 

	canvas.on('mouse:up',function(e){
	    if(e.target){
		shrinkBB(e.target);
		var BB_hit_i = e.target.BBindex;
		setTimeout(function(){onComplete_finalBBshrink(BB_hit_i);},myDur);
	    }
	});

	//define and add code to respond to keystrokes.
	var KBlistenerSplash = function(e){
	    var myKeycode = e.keyCode;
	    var keyPressed = String.fromCharCode(myKeycode);//note that this is non-case sensitive.
	    if(myKeycode == 32){//space bar
		var rand_BB_i = getRandomInt(0,4);
		removeUnselectedBBs(rand_BB_i);
		setTimeout(function(){shrinkBB(BlipBlop[rand_BB_i]);},myDur*0.5);		
		setTimeout(function(){onComplete_finalBBshrink(rand_BB_i);},myDur*1.5);
	    }
	};

	document.addEventListener("keydown", KBlistenerSplash, false);

    }
};
