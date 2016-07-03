snCore.Splash2 = {

    player_name: null,
    myFiveColors: undefined,
    name_validated: false,
    players_t: undefined,

    triggerPromptScreen: function(colorSet, players_t){
	
	//set the global objects
	this.myFiveColors = colorSet;
	this.players_t = players_t;

	//the fact that this checks for clicks landing on objects that don't yet exist doesn't matter
	this.addKbListeners();

	//unhide the relevant DIV...
	$("#game-container").show().css({"background-color": "#CCC"});

	//get the name via browser prompt box...
	if(!this.namePrompt()){
	    //code to run when valid name is not supplied...

	    var frW = port_W * 0.020;// this is some fraction of page Width, in this case 2%

	    //
	    $("#game-container").append(//the text...
		$('<div/>').css({
		    "font-size": (frW+"pt"),
		    "padding": "20px"
		}).append(
		    $('<p/>').text("You will need to enter a name to continue...")
		).append(
		    $('<p/>').text("Press ENTER or click the box below to provide a name")
		)
	    ).append(//the button...
		$('<div/>').append(
		    $('<a/>').text("Name Entry").addClass("button gray alt").click(function(){
			snCore.Splash2.namePrompt();
		    }).attr("href", "#").css({
			"font-size": (frW+"px"),
			"height": (3*frW+"px"),
			"padding": (0.36*frW+"px "+2*frW+"px")
		    })
		).css({"text-align": "center"})
	    );
	    
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
			    document.removeEventListener("keydown", this.KBListener_ref, false);

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

    BB_radius: undefined,
    renderPromptScreen: function(){

	var frW = port_W * 0.020;// this is some fraction of page Width, in this case 2%

	$("#game-container").empty().css({"background-color": "white"}).append(//the text...
	    $('<div/>', {id: "BB-msg"}).css({
		"font-size": (1.7*frW+"pt"),
		"font-weight": "800",
		"padding": "2px 20px"
	    }).append(
		$('<div/>').text("Welcome, " + this.player_name + "!")
	    ).append(
		$('<div/>').text("Select your color:")
	    )
	);

	var rem_height = port_H - parseFloat($("#BB-msg").css('height'));
	var sqr_dim = Math.min(port_W, rem_height)

	$("#game-container").append(
	    $('<div/>', {id: "BB-area"}).css({
		width: (port_W)+"px",
		height: (rem_height)+"px"
	    }).append(
		$('<div/>', {id: "BB-box"}).css({
		    position: "relative",
		    width: (sqr_dim)+"px",
		    height: (sqr_dim)+"px",
		    margin: "0 auto"
		})
	    )
	);

	var ring_radius = (sqr_dim/2) * 0.6;
	this.BB_radius = ring_radius * 0.4;
	var radSF = Math.PI*2 / 360;

	//now draw the BBs
	for (var index = 0; index<5; index++){

	    var placement_angle = 18 + 36 + 72 * index;
	    var mcLeft_c = (sqr_dim/2) + ring_radius * Math.cos(radSF * placement_angle);
	    var mcTop_c = (sqr_dim/2) - ring_radius * Math.sin(radSF * placement_angle);
	    var mcLeft = mcLeft_c - this.BB_radius;
	    var mcTop = mcTop_c - this.BB_radius;

	    var bb_id = "BB-"+index;
	    //just create the BB's in-situ
	    $("#BB-box").append(
		$('<div/>', {id: bb_id}).css({
		    background: this.myFiveColors[index],
		    position: "absolute",
		    top: px(mcTop),
		    left: px(mcLeft),
		    width: px(this.BB_radius*2),
		    height: px(this.BB_radius*2),
		    border: px(this.BB_radius*0.15) + " solid black",
		    "border-radius": px(this.BB_radius)
		}).mousedown(function(){
		    var my_tag = $(this).attr('id');
		    var bb_i = parseInt(my_tag.replace("BB-",""))
		    snCore.Splash2.handleBBchosen(bb_i);
		}).mouseup(function(){
		    snCore.Splash2.handleBBchosenReleased();
		})
	    );
	}
    },

    shrinkAndRemoveBBwithIndex: function(index,extra_onComplete_function){
	var shrinkMeBB = $("#BB-" + index);
	var newLeft = parseFloat(shrinkMeBB.css('left')) + this.BB_radius;
	var newTop = parseFloat(shrinkMeBB.css('top')) + this.BB_radius;

	var props_final = {
	    width: px(0),
	    height: px(0),
	    left: newLeft,
	    top: newTop,
	    "border-width": px(0)
	};

	var onComplete_deleteBB = function(){
	    shrinkMeBB.remove();
	    if(extra_onComplete_function!==undefined){
		extra_onComplete_function();
	    }
	};

	shrinkMeBB.animate(props_final, 400, onComplete_deleteBB);
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

	    document.removeEventListener("keydown", this.KBListener_ref, false);

	    var frW = port_W * 0.020;// this is some fraction of page Width, in this case 2%

	    $("#game-container").empty().append(//the text...
		$('<div/>', {id: "BB-msg"}).css({
		    "font-size": (1.7*frW+"pt"),
		    "font-weight": "800",
		    "color": 'rgb(230,0,40)',
		    "text-align": "center",
		    "margin-top": px(frW*10)
		}).append(
		    $('<div/>').text("Waiting for server")
		).append(
		    $('<div/>').text("to send the state of the ongoing")
		).append(
		    $('<div/>').text("SNATCH-IT game...")
		)
	    );

	    //send the data to the server
	    var playerDetailsObj = {
		name: snCore.Splash2.player_name,
		color_index: snCore.Splash2.BB_chosen_was,
		reclaiming_player_index: undefined
	    };
	    PLAYER_JOINED_WITH_DETAILS(playerDetailsObj);
	};

	// I tried changing this then changed it back.
	// because of the call context using 'this' in place of snCore.Splash2 doesn't work...
	snCore.Splash2.shrinkAndRemoveBBwithIndex(snCore.Splash2.BB_chosen_was, onComplete_BBchosenReleased_animation);
    },

    KBListener_ref: undefined,
    addKbListeners: function(){
	//because the keyboard listener function has to be removed by name, we cannot define and pass it anonymously
	//there appear to be subtle differnces based upon the context in which the function is defined
	//(hence not directly defining 'KBlistenerSplash' as a member of snCore.Splash), but inside another
	var KBlistenerSplash = function(e){
	    var myKeycode = e.keyCode;
	    var keyPressed = String.fromCharCode(myKeycode);//note that this is non-case sensitive.

	    if(myKeycode == 32){//space bar

		if(snCore.Splash2.BB_chosen_was === undefined){ //action only if mouse stuff hasn't happened
		    //apply the "chosen function"
		    var rand_BB_i = getRandomInt(0,4);
		    snCore.Splash2.handleBBchosen(rand_BB_i);

		    //...and halfway through that animation, also apply the released function.
		    var shrink_dur = snCore.Basic.ani.sty_BBshrink.duration;
		    setTimeout(snCore.Splash2.handleBBchosenReleased, shrink_dur * 0.5);		
		}
	    }

	    if(myKeycode == 13){//enter
		if(!snCore.Splash2.name_validated){
		    snCore.Splash2.namePrompt();
		}
	    }
	};
	this.KBListener_ref = KBlistenerSplash;

	//respond to keydown events
	document.addEventListener("keydown", this.KBListener_ref, false);
    }
};
