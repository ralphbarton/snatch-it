snCore.Splash = {

    player_name: null,
    myFiveColors: undefined,
    colorsStore: undefined,
    myFiveBBs: [],
    textObject_main: undefined,
    ringZoneTopPx: undefined,
    name_validated: false,
    players_t: undefined,

    triggerPromptScreen: function(colors_remaining, players_t){
	
	//set the global objects
	this.colorsStore = colors_remaining;
	this.myFiveColors = this.colorsStore.splice(0,5);
	this.players_t = players_t;

	//up until this point the canvas is transparent...
	canvas.setBackgroundColor('white');

	//the fact that this checks for clicks landing on objects that don't yet exist doesn't matter
	this.addKBmouseListeners();

	var ts_px = snCore.Basic.canv_W * 0.060;
	var approx_1px = snCore.Basic.canv_W / 500;

	this.textObject_main = new fabric.Text("", {
	    textAlign: 'left',
	    fontWeight: 'bold',
	    fontSize: ts_px*0.6,
	    left: approx_1px * 10,
	    top: approx_1px * 10,
	    hasControls: false,
	    hasBorders: false,
	    selectable: false
	});

	//get the name via browser prompt box...
	if(!this.namePrompt()){
	    //code to run when valid name is not supplied...
	    
	    var mytext = "You will need to enter a name to continue...\n\
 Press ENTER or click the box below to provide a name";
	    this.textObject_main.set({text: mytext});
	    
	    var NPbuttonText = new fabric.Text("Open Name\nEntry Prompt",{
		fill: 'black',
		fontWeight: 'bold',
		fontSize: ts_px * 0.8,
		top: (this.textObject_main.getTop() + this.textObject_main.getHeight()) * 2,
		hasControls: false,
		hasBorders: false,
		selectable: false
	    });

	    NPbuttonText.set({
		left: (snCore.Basic.canv_W - NPbuttonText.getWidth())/2
	    });

	    var padding = 10;
	    var NPbuttonRect = new fabric.Rect({
		fill: '#AAA',
		stroke: 'black',
		strokeWidth: approx_1px * 4,
		left: (NPbuttonText.getLeft() - padding),
		top: (NPbuttonText.getTop() - padding),
		width: NPbuttonText.getWidth() + padding * 2,
		height: NPbuttonText.getHeight() + padding * 2,
		rx: approx_1px * 10,
		ry: approx_1px * 10,
		hasControls: false,
		hasBorders: false,
		selectable: false
	    });

	    canvas.add(this.textObject_main);
	    NPbuttonRect.isNameEntryPrompt = true;
	    NPbuttonText.isNameEntryPrompt = true;
	    canvas.add(NPbuttonRect, NPbuttonText);

	    canvas.renderAll();

	}
    },

    namePrompt: function(){
	this.player_name = prompt("What is your name?");
	var valid_str = (this.player_name != null) && (this.player_name.length != 0);

	this.name_validated = valid_str;
	if(valid_str){
	    for(var i = 0; i < this.players_t.length; i++){

		if (this.player_name.toUpperCase() == this.players_t[i].name.toUpperCase()){
		    if(this.players_t[i].is_disconnected){
			var X = confirm("A player \""+this.player_name+"\" was in this game but lost their session. They had "+this.players_t[i].words.length+" words. Reclaim now?");
			if(X){
			    //We have all the information needed...
			    var rPID = this.reclaiming_player_index; 
			    var playerDetailsObj = {
				reclaiming_player_index: i
			    };
			    PLAYER_JOINED_WITH_DETAILS(playerDetailsObj);
			    //this is important, or leave it so that clicking will send a "player joined" even after splash screen...
			    snCore.Splash.removeKBmouseListeners();
			}else{
		    	    this.name_validated = false;
			}	
		    }else{
			alert("There is already a player \""+this.player_name+"\" active in the game. Please choose a different name");
			this.name_validated = false;
		    }
		}
	    }
	}

	if (this.name_validated){
	    this.renderPromptScreen();
	}
	return this.name_validated;
    },

    renderPromptScreen: function(){

	//Draw the "Welcome Joe Blogs" message quite big on the canvas...
	canvas.clear();
	var mytext = "Welcome, " + this.player_name + "!\nSelect your color:";
	this.textObject_main.set({
	    text: mytext,
	    fontSize: snCore.Basic.canv_W * 0.060
	});
	canvas.add(this.textObject_main);

	this.ringZoneTopPx = this.textObject_main.getHeight()*0.9;
	//draw the ring of BB's
	this.drawBBring();
    },

    effectiveHeight: undefined,
    ringCenterX: undefined,
    ringCenterY: undefined,
    ringRadius: undefined,
    blipBlopRadius: undefined,
    radSF: undefined,

    drawBBring: function(){

	//set a load of parameters / dimentions that are constants using to draw the BBs
	this.ringCenterX = snCore.Basic.canv_W/2;
	this.effectiveHeight = snCore.Basic.canv_H - this.ringZoneTopPx;
	this.ringCenterY = this.ringZoneTopPx + this.effectiveHeight / 2;
	this.ringRadius = Math.min(snCore.Basic.canv_W, this.effectiveHeight)*0.5*0.6;
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
	    fill: this.myFiveColors[index],
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

    colorChoiceConsumed: function(col){

	var index_in_5 = this.myFiveColors.indexOf(col);
	console.log("Just consumed index = ", index_in_5);

	//perform a live replacement
	if(index_in_5 != -1){
	    this.myFiveColors[index_in_5] = this.colorsStore.splice(0,1)[0];
	    this.myFiveBBs[index_in_5].setFill(this.myFiveColors[index_in_5]),
	    snCore.Basic.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()

	}else{//just take it from the set...
	    var consumed_i = this.colorsStore.indexOf(col);
	    this.colorsStore.splice(consumed_i, 1);
	}
	
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
	
	snCore.Basic.moveSwitchable(shrinkMeBB, onComplete_deleteBB, snCore.Basic.ani.sty_BBshrink,{
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

	    snCore.Splash.removeKBmouseListeners();

	    var wait_str = "Waiting for server\nto send the state of the ongoing\nSNATCH-IT game...";
	    var my_font_size = snCore.Basic.canv_W * 0.055;
	    var textObj = snCore.Splash.textObject_main;

	    textObj.set({
		text: wait_str,
		textAlign: 'center',
		fontWeight: 'bold',
		fontSize: my_font_size,
		fill: 'rgb(230,0,40)'
	    });
	    
	    setTimeout(function(){
		if(socket.connected == false){
		    textObj.setText("Somehow, the websocket\nconnection is now closed.\nRefresh to try again...");
		    snCore.Basic.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
		}
	    },1000);

	    //this needs to be a separate, later function call, since the first one alters the size...
	    textObj.set({
		left: (canvas.getWidth() - textObj.getWidth()) / 2,
		top: (canvas.getHeight() - textObj.getHeight()) / 2,
	    });

	    //send the data to the server
	    var playerDetailsObj = {
		name: snCore.Splash.player_name,
		color: snCore.Splash.myFiveBBs[snCore.Splash.BB_chosen_was].getFill(),
		reclaiming_player_index: undefined
	    };
	    PLAYER_JOINED_WITH_DETAILS(playerDetailsObj);
	};

	// I have changed two instances of 'this' to 'snCore.Splash' in the code below. I think it's harmless
	// and it prevents problems with the keyboad handler. Damn the keyboard handler: rewrite it!!
	snCore.Splash.shrinkAndRemoveBBwithIndex(snCore.Splash.BB_chosen_was, onComplete_BBchosenReleased_animation);
    },

    KBListener_ref: undefined,
    addKBmouseListeners: function(){
	//respond to mouse down on a BB
	canvas.on('mouse:down',function(e){
	    if(e.target){
		var BB_hit_i = e.target.BBindex;
		if(BB_hit_i != undefined){
		    snCore.Splash.handleBBchosen(BB_hit_i);
		}
		
		var isNamePrompt = e.target.isNameEntryPrompt;
		if(isNamePrompt != undefined){
		    snCore.Splash.namePrompt();		    
		}
	    }
	}); 
	//respond to mouse up if a mouse-down has landed on a BB
	canvas.on('mouse:up',function(e){
	    if(snCore.Splash.BB_chosen_was !== undefined){
		snCore.Splash.handleBBchosenReleased();
	    }
	});

	//because the keyboard listener function has to be removed by name, we cannot define and pass it anonymously
	//there appear to be subtle differnces based upon the context in which the function is defined
	//(hence not directly defining 'KBlistenerSplash' as a member of snCore.Splash), but inside another
	var KBlistenerSplash = function(e){
	    var myKeycode = e.keyCode;
	    var keyPressed = String.fromCharCode(myKeycode);//note that this is non-case sensitive.

	    if(myKeycode == 32){//space bar

		if(snCore.Splash.BB_chosen_was === undefined){ //action only if mouse stuff hasn't happened
		    //apply the "chosen function"
		    var rand_BB_i = getRandomInt(0,4);
		    snCore.Splash.handleBBchosen(rand_BB_i);

		    //...and halfway through that animation, also apply the released function.
		    var shrink_dur = snCore.Basic.ani.sty_BBshrink.duration;
		    setTimeout(snCore.Splash.handleBBchosenReleased, shrink_dur * 0.5);		
		}
	    }

	    if(myKeycode == 13){//enter
		if(!snCore.Splash.name_validated){
		    snCore.Splash.namePrompt();
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
