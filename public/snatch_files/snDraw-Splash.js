snDraw.Splash = {

    player_name: null,
    myFiveColors: undefined,
    myFiveBBs: [],
    welcome_sel_color_text_obj: undefined,
    ringZoneTopPx: undefined,

    renderPromptScreen: function(colorChoices){

	this.myFiveColors = colorChoices;

	//get the name via browser prompt box...
	this.player_name = prompt("What is your name?");
	while((this.player_name == null)||(this.player_name.length == 0)){
	    this.player_name = prompt("Please enter an actual name for yourself:");
	}

	//Draw the "Welcome Joe Blogs" message quite big on the canvas...
	canvas.setBackgroundColor('white');//is this superfluous?
	var ts_px = snDraw.canv_W * 0.070;
	var mytext = "Welcome, " + this.player_name + "!\nSelect your color:";
	this.welcome_sel_color_text_obj = new fabric.Text(mytext, {
	    textAlign: 'left',
	    fontWeight: 'bold',
	    fontSize: ts_px,
	    left: 20,
	    top: 20
	});
	canvas.add(this.welcome_sel_color_text_obj);
	this.ringZoneTopPx = this.welcome_sel_color_text_obj.getHeight()*0.9;

	//draw the ring of BB's
	this.drawBBring();
	this.addKBmouseListeners();

	//TODO: set whether background is dark or light
	snDraw.Game.setDarkBackground(true);
    },

    effectiveHeight: undefined,
    ringCenterX: undefined,
    ringCenterY: undefined,
    ringRadius: undefined,
    blipBlopRadius: undefined,
    radSF: undefined,

    drawBBring: function(){

	//set a load of parameters / dimentions that are constants using to draw the BBs
	this.ringCenterX = snDraw.canv_W/2;
	this.effectiveHeight = snDraw.canv_H - this.ringZoneTopPx;
	this.ringCenterY = this.ringZoneTopPx + this.effectiveHeight / 2;
	this.ringRadius = Math.min(snDraw.canv_W, this.effectiveHeight)*0.5*0.6;
	this.blipBlopRadius = this.ringRadius*0.4;
	this.radSF = Math.PI*2 / 360;

	//now draw the BBs
	for (var i=0; i<5; i++){
	    this.drawBBwithIndex(i);
	}
	canvas.renderAll();
    },

    drawBBwithIndex: function(index){
	
	var placement_angle = 18 + 36 + 72 * index;
	var mcLeft_c = this.ringCenterX + this.ringRadius * Math.cos(this.radSF*placement_angle);
	var mcTop_c = this.ringCenterY - this.ringRadius * Math.sin(this.radSF*placement_angle);
	var mcLeft = mcLeft_c - this.blipBlopRadius;
	var mcTop = mcTop_c - this.blipBlopRadius;

	var myBB = new fabric.Circle({
	    radius: this.blipBlopRadius,
	    stroke: 'black',
	    strokeWidth: this.blipBlopRadius*0.2,
	    fill: this.myFiveColors[index].color,
	    left: mcLeft,
	    top: mcTop,
	    hasControls: false,
	    hasBorders: false
	});

	//set forwards and backwards linking
	myBB.BBindex = index;
	this.myFiveBBs[index] = myBB;
	canvas.add(myBB);

    },

    shrinkAndRemoveBBwithIndex: function(index,extra_onComplete_function){
	var shrinkMeBB = this.myFiveBBs[index];
	var newLeft = shrinkMeBB.getLeft() + this.blipBlopRadius; 
	var newTop = shrinkMeBB.getTop() + this.blipBlopRadius;

	var onComplete_deleteBB = function(){
	    canvas.remove(shrinkMeBB);
	    if(extra_onComplete_function!==undefined){
		extra_onComplete_function();
	    }
	};
	
	snDraw.moveSwitchable(shrinkMeBB, onComplete_deleteBB, snDraw.ani.sty_BBshrink,{
	    left: newLeft,
	    top: newTop,
	    strokeWidth: 0,
	    radius: 0
	});
    },

    BB_chosen_was: undefined,
    handleBBchosen: function(i_chosen){
	this.BB_chosen_was = i_chosen;
	for (var i=0; i < 5; i++){
	    if(i == i_chosen){continue;}//don't vanish the BB we just hit!
	    this.shrinkAndRemoveBBwithIndex(i);
	}
    },

    handleBBchosenReleased: function(){

	var onComplete_BBchosenReleased_animation = function(){
	    canvas.remove(snDraw.Splash.welcome_sel_color_text_obj);
	    snDraw.Splash.removeKBmouseListeners();	    

	    var wait_str = "Waiting for server\nto send the state of the ongoing\nSNATCH-IT game...";
	    snDraw.gameMessage(wait_str, snDraw.canv_W * 0.065,'rgb(230,0,40)'); 

	    //send the data to the server
	    var playerDetailsObj = {
		name: snDraw.Splash.player_name,
		color_index: snDraw.Splash.myFiveColors[snDraw.Splash.BB_chosen_was].index
	    };
	    PLAYER_JOINED_WITH_DETAILS(playerDetailsObj);
	};

	// I have changed two instances of 'this' to 'snDraw.Splash' in the code below. I think it's harmless
	// and it prevents problems with the keyboad handler. Damn the keyboard handler: rewrite it!!
	snDraw.Splash.shrinkAndRemoveBBwithIndex(snDraw.Splash.BB_chosen_was, onComplete_BBchosenReleased_animation);
    },

    KBListener_ref: undefined,
    addKBmouseListeners: function(){
	//respond to mouse down on a BB
	canvas.on('mouse:down',function(e){
	    if(e.target){
		var BB_hit_i = e.target.BBindex;
		if(BB_hit_i != undefined){
		    snDraw.Splash.handleBBchosen(BB_hit_i);
		}
	    }
	}); 
	//respond to mouse up if a mouse-down has landed on a BB
	canvas.on('mouse:up',function(e){
	    if(snDraw.Splash.BB_chosen_was !== undefined){
		snDraw.Splash.handleBBchosenReleased();
	    }
	});

	//because the keyboard listener function has to be removed by name, we cannot define and pass it anonymously
	//there appear to be subtle differnces based upon the context in which the function is defined
	//(hence not directly defining 'KBlistenerSplash' as a member of snDraw.Splash), but inside another
	var KBlistenerSplash = function(e){
	    var myKeycode = e.keyCode;
	    var keyPressed = String.fromCharCode(myKeycode);//note that this is non-case sensitive.

	    if(myKeycode == 32){//space bar

		if(snDraw.Splash.BB_chosen_was === undefined){ //action only if mouse stuff hasn't happened
		    //apply the "chosen function"
		    var rand_BB_i = getRandomInt(0,4);
		    snDraw.Splash.handleBBchosen(rand_BB_i);

		    //...and halfway through that animation, also apply the released function.
		    var shrink_dur = snDraw.ani.sty_BBshrink.duration;
		    setTimeout(snDraw.Splash.handleBBchosenReleased, shrink_dur * 0.5);		
		}
	    }
	};
	this.KBListener_ref = KBlistenerSplash;

	//respond to keydown events
	document.addEventListener("keydown", this.KBListener_ref, false);

    },

    removeKBmouseListeners: function(){
	    canvas.off('mouse:down');
	    canvas.off('mouse:up');
	    document.removeEventListener("keydown", this.KBListener_ref, false);
    }
};
