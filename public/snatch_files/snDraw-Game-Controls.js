snDraw.Game.Controls = {

    //member variables
    playersListWindowVisible: false,
    ScoresWindow: undefined,
    button_widths: [],
    button_widths_cumulated: [],
    Button_Objs: [],

    //constants...
    button_height: undefined,
    gap_width: undefined,
    button_font_size: undefined,
    line_thickness: undefined,
    corners_rounding: undefined,
    underneath_buttons_px:  undefined,

    createControls: function(){

	//set the constants
	this.button_height = snDraw.Game.tileSize * 0.7;
	this.gap_width = snDraw.Game.tileSize*0.2;
	this.button_font_size = Math.min(snDraw.canv_W, snDraw.canv_H * 1.8) * 0.030;//base font size on width, but with a har limit for extreme aspect ratios...
	this.line_thickness = snDraw.Game.tileSize * 0.06;
	this.corners_rounding = snDraw.Game.tileSize * 0.25;
	this.underneath_buttons_px = this.button_height + this.gap_width * 1.5;// 1.5 is a reasonable gap...

	//set the relative widths of the buttons (these numbers are only relative)
	this.button_widths =  [10,20,15,10,4];

	//some preprocessing from the widths list...
	this.button_widths_cumulated[0] = this.button_widths[0];

	for (var i=1; i<this.button_widths.length; i++){
	    this.button_widths_cumulated[i] = this.button_widths_cumulated[i-1] + this.button_widths[i];
	}

	this.Button_Objs[0] = this.createGenericButton("Cancel",0,"1");
	this.Button_Objs[1] = this.createGenericButton("Turn Letter (xx)",1,"2");
	this.Button_Objs[2] = this.createGenericButton("SNATCH IT",2,"3");
	this.Button_Objs[3] = this.createGenericButton("Scores",3,"4");
	this.Button_Objs[4] = this.createGenericButton(":",4,null);

	//starting state of buttons with visual state
	var n_tiles_remaining = tilestats.n_tiles - tileset.length;
	this.updateTurnLetter_number(n_tiles_remaining);
	this.setButtonDisabled(2, true);
    },


    createGenericButton: function(text, n_ind, key_label){

	var N_but = this.button_widths.length;
	var button_w_px = [];
	var button_l_px = [this.gap_width/2];
	var eff_width = snDraw.canv_W - this.line_thickness;
	for (var i=0; i<N_but; i++){
	    button_w_px[i] = (eff_width - N_but * this.gap_width) * (this.button_widths[i] / this.button_widths_cumulated[N_but-1]);
	    button_l_px[i+1] = button_l_px[i] + this.gap_width + button_w_px[i] ;
	}

	var button_width = button_w_px[n_ind];
	var button_left = button_l_px[n_ind];

	var buttonObsArray = [];

	//defined the rounded, containing rectangle
	var buttonRect = new fabric.Rect({
	    top: 0,
	    fill: '#AAA',
	    stroke: snDraw.Game.fg_col,
	    strokeWidth: this.line_thickness,
	    width: button_width,
	    height: this.button_height,
	    rx: this.corners_rounding,
	    ry: this.corners_rounding
	});
	buttonObsArray.push(buttonRect);

	var centerising_offset = undefined;
	if(text == ":"){//the special case of the 3 lines for the options button...

	    var bar_length = button_width * 0.4;
	    var left_offset = button_width * (1.0 - 0.4) / 2 + this.line_thickness/2;
	    var bar_height = this.line_thickness;
	    var bar_spacing = this.button_height *0.25;

	    for (var i=1; i<4; i++){
		var thin_bar = new fabric.Rect({
		    top: bar_spacing * i,
		    left: left_offset,
		    fill: 'black',
		    width: bar_length,
		    height: bar_height,
		    rx: bar_height/2,
		    ry: bar_height/2
		});
		buttonObsArray.push(thin_bar);
	    }


	}else{//use text for all other buttons...
	    var buttonText = new fabric.Text(text,{
		top: (this.button_height - this.button_font_size*1.15) * 0.5,//the 1.1 is a fudgefactor to generally shift text up
		fill: 'black',
		fontWeight: 'bold',
		fontSize: this.button_font_size
	    });
	    centerising_offset = (button_width - buttonText.getWidth())/2; 
	    buttonText.set({left: centerising_offset});
	    buttonObsArray.push(buttonText);
	}

	//Function to add the little box which labels the button with its keyboard shortcut key.	
	var draw_boxed_label = function(ll, size, myleft){

	    var kl_top = snDraw.Game.Controls.button_height * 0.15;
	    var key_letter = new fabric.Text(ll, {
		top: kl_top,
		left: (myleft + snDraw.Game.Controls.line_thickness),
		fill: 'black',
		fontWeight: 'bold',
		fontSize: size 
	    });
	    
	    var key_box = new fabric.Rect({
		top: kl_top,
		left: myleft,
		fill: '#CCC',
		stroke: 'black',
		strokeWidth: 1,
		width: (key_letter.getWidth() + 2*snDraw.Game.Controls.line_thickness),
		height: size
	    });
	    
	    //Add the objects to the group
	    //sequence of layer ordering: push the box before the letter...
	    buttonObsArray.push(key_box, key_letter);
	    buttonObsArray.push();
	}

	if(centerising_offset != undefined){//this applies for all buttons except the rightmost -/-/- options button

	    var key_font_size = Math.min (this.button_font_size * 0.9, 20);
	    var kl_left = centerising_offset * 0.5 - this.button_font_size*0.3;

	    draw_boxed_label(key_label, key_font_size, kl_left);

	    if(n_ind == 0){//it's the CANCEL button
		var extra_width = buttonObsArray[2].getWidth();
		draw_boxed_label("5", key_font_size, kl_left + extra_width);

		var CancelTextwith15boxRightPx = kl_left + extra_width*2;
		if(buttonObsArray[1].getLeft() < CancelTextwith15boxRightPx){
		    buttonObsArray[1].setLeft(CancelTextwith15boxRightPx);
		} 
	    }

	    //this is a bit of a scrappy, iterative approach to nicely centering (ish) 2 objects evenly accross a space...
	    //Having used the main text to position the 'key label boxes', I now use the 'key label boxes to reposition the main text
	    var item_i = n_ind == 0 ? 4 : 2;
	    var littleBoxRightEdge = buttonObsArray[item_i].getLeft() + buttonObsArray[item_i].getWidth();
	    var buttonText = buttonObsArray[1];
	    var twoThirds_centerise_offset = littleBoxRightEdge + (button_width - littleBoxRightEdge - buttonText.getWidth())/2; 
	    buttonText.setLeft(twoThirds_centerise_offset);
	}

	var buttonGrp = new fabric.Group( buttonObsArray, {
	    hasControls: false,
	    hasBorders: false,
	    selectable: false,
	    top: this.gap_width/2,
	    left: button_left
	});
	
	buttonGrp.gameButtonID = n_ind;
	canvas.add(buttonGrp);
	return buttonGrp;
    },

    updateTurnLetter_number: function(n_tiles_remaining){
	var TurnButton = this.Button_Objs[1];
	if(n_tiles_remaining>0){
	    TurnButton.item(1).setText("Turn Letter (" + n_tiles_remaining + ")");
	}else{
	    TurnButton.item(1).setText("Finish Game");
	}
    },

    turnDisabled: false,
    cancelTurnDisabled: false,
    setButtonDisabled: function(buttonID, disable){
	if(buttonID == 1){//this code is specific to the Turn Letter button
	    this.turnDisabled = disable;
	}
	var myTextObj = this.Button_Objs[buttonID].item(1);
	var myRectObj = this.Button_Objs[buttonID].item(0);
    	myRectObj.setFill('#AAA');
	//change the button text colour
	if(disable){
	    myTextObj.setFill('#75746E');//text colour to a dull grey-brown
	}else{
	    myTextObj.setFill('black');//text colour to black
	    myRectObj.setStroke(snDraw.Game.fg_col);//box border colour to black, in case it was changed...
	}
    },

    SNATCHbuttonBar_Objs: [],
    modifySNATCHbuttonBar: function(DotSet, i_optimal){

	//certainly, remove any pre-existing bars...
	for (var i=0; i<this.SNATCHbuttonBar_Objs.length; i++){
	    canvas.remove(this.SNATCHbuttonBar_Objs[i]);
	}

	//re-add the correct number of bars
	var n_pieces = DotSet.length;
	if(n_pieces > 0){
	    var BGrp = this.Button_Objs[2];//this assumes SNATCH button has index 2

	    var h_pad = BGrp.height * 0.5;
	    var stroke_w = BGrp.item(0).strokeWidth;
	    var h_gap = BGrp.height * 0.25;

	    var w_bar = (BGrp.width - h_pad*2 - h_gap*(n_pieces-1)) / n_pieces;

	    //these next 2 lines reduce w_bar length and h_pad to match
	    //again, I'm being a bit iterative here to save thought
	    w_bar = Math.min(w_bar, BGrp.height*0.9);
	    h_pad = (BGrp.width - w_bar*n_pieces - h_gap*(n_pieces-1))/2;

	    var top_o = BGrp.top + BGrp.height * 0.76;
	    var left_o = BGrp.left + h_pad;

	    //setting up the variables for the dots specifically
	    var dot_dia = stroke_w * 1.5; 
	    var dot_stroke = dot_dia * 0.17; 

	    for (var i = 0; i < n_pieces; i++){//run through each of those bars

		var barWithDotsObj = [];
		var stroke_w_actual = i == i_optimal ? stroke_w * 1.4 : stroke_w * 0.8;

		var thin_bar = new fabric.Rect({
		    top: (-stroke_w_actual/2),
		    left: 0,
		    fill: 'rgba(0,0,0,0.8)',//this effectively is choosing dark grey
		    strokeWidth: 0,
		    width: w_bar,
		    height: stroke_w_actual,
		    rx: w_bar/2,
		    ry: stroke_w_actual/2
		});

		barWithDotsObj.push(thin_bar);

		//create those 'dot' objects...
		//DotSet[i]
		
		var n_dots = DotSet[i].length;
		var dot_rel_left = (w_bar - n_dots * dot_dia)/2;

		for (var j = 0; j < n_dots; j++){//run through each of those bars
		    
		    var dot_col = players[DotSet[i][j]].color;
		    var myDot = new fabric.Circle({
			radius: dot_dia/2,
			stroke: 'black',
			strokeWidth: dot_stroke,
			fill: dot_col,
			left: (dot_rel_left + dot_dia*j),
			top: ( -(dot_dia+dot_stroke)/2)
		    });

		    barWithDotsObj.push(myDot);
		}

		var top_o_adj = top_o - (n_dots==0 ? stroke_w_actual : (dot_dia+dot_stroke))/2;
		var DottedBarGrp = new fabric.Group(barWithDotsObj, {
		    top: top_o_adj,
		    left: (left_o + i*(w_bar+h_gap)),
		    hasControls: false,
		    hasBorders: false,
		    selectable: false
		});

		this.SNATCHbuttonBar_Objs.push(DottedBarGrp);
		canvas.add(DottedBarGrp);
	    }

	}
	snDraw.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
    },

    startTurnDisableTimeout: function(){
	
	if(this.turnDisabled){//the function irrelivant if the turn is not already disabled...

	    //count words in play...
	    var n_words = 0;
	    for (var i=0; i<players.length; i++){
		n_words += players[i].words.length;
	    }

	    var fast_flip = (players.length < 2) || (n_words == 0);

	    //How long (in seconds) should it take for the button to become available again?
	    var dur = (dev || fast_flip) ? 1 : 10;//minimise wait in development mode...

	    //make the outline of the button coloured.
	    var RoundedRec = this.Button_Objs[1].item(0);
	    RoundedRec.setStroke(snDraw.Game.client_col);

	    //todo: this values ought only be calculated once as they are constant w.r.t. a game instance

	    var corners_r = snDraw.Game.tileSize * 0.12;

	    //this is the exact number of pixels of the perimeter of the rounded cornered rectangle (test by making the 1.0 slightly smaller!)
	    var l_tot = ((RoundedRec.getWidth() + RoundedRec.getHeight()) * 2 + 2*corners_r*(Math.PI-4.0))* 1.0;
	    var fps = (1000/snDraw.frameperiod_measured);//TODO: fps is not fixed for different platforms. It needs to be measured upon page load.
	    var f_tot = Math.round(dur*fps,0);//whole number of frames...
	    
	    var start_time = (new Date()).getTime();

	    RoundedRec.setStrokeDashArray([0, l_tot]);

	    this.cancelTurnDisabled=false;
	    snDraw.FrameTargetsArray.push({
		frame: function(){
		    var time_now = (new Date()).getTime();
		    var progress_fraction = (time_now-start_time) / (1000 * dur);
		    var solid_len = progress_fraction * l_tot;
		    RoundedRec.setStrokeDashArray([solid_len, l_tot-solid_len]);
		    if((progress_fraction>=1)||(snDraw.Game.Controls.cancelTurnDisabled)){//animation completed...
			//restore the visual state of the button to normal
			RoundedRec.setStrokeDashArray(null);
			snDraw.Game.Controls.setButtonDisabled(1, false);//un-disable the "Turn Letter" button
			return true; //this means the function call chain shall terminate
		    }else{
			return false; // function call chain to continue
		    }
		}
	    });
	}
    },


    buttonRecolor: function(myButtonGrp,style){
	if((myButtonGrp.gameButtonID!=1)||(!this.turnDisabled)){//condition prevents interference with the animating Turn button (ID =1 for Turn button)
	    var ButtonRect = myButtonGrp.item(0);
	    var KeyLabel = myButtonGrp.gameButtonID == 4 ? null : myButtonGrp.item(2);
 
	    if (style=="hover"){
    		ButtonRect.setStroke('#FF0');
    		ButtonRect.setFill('#AAA');
		if(KeyLabel){KeyLabel.setFill('#FF9');}
	    }
	    else if (style=="press"){
		ButtonRect.setStroke('#FF0');
    		ButtonRect.setFill(snDraw.Game.fg_col);
		if(KeyLabel){KeyLabel.setFill('#999');}
	    }
	    else{
    		ButtonRect.setStroke(snDraw.Game.fg_col);
    		ButtonRect.setFill('#AAA');
		if(KeyLabel){KeyLabel.setFill('#CCC');}
	    }
	    canvas.renderAll();
	}
    },

    client_finished_game: false,
    turnLetterClickHandler: function(){
	if(this.turnDisabled){
	    console.log("TOAST: you must wait before you are allowed to take another turn. Number of seconds = [todo]");
	}else{
	    this.setButtonDisabled(1, true);//Disable the "turn letter" button...
	    var n_tiles_remaining = tilestats.n_tiles-tileset.length;
	    if(n_tiles_remaining>0){
		TILE_TURN_REQUEST(); //request another tile...
	    }else{
		this.client_finished_game = true;
		this.createPlayersListWindow();
		
	    }
	}
    },

    scalePropertiesPlayersListWindow: function(){
	
	//things that scale with the Tile Size
	var ts = Math.round(snDraw.Game.tileSpacings.ts);
	var cr = ts * 0.30; // corner radius
	var fsz = ts * 0.50; // master font size

	//set style properties that depend on tile size...
	$("#modal_dark_sheet").css("font-size", fsz+"px");
	$("#modal-content").css("border-radius", cr+"px");
	$("#modal-header").css("border-radius", cr+"px "+cr+"px 0 0");
	$("#modal-footer").css("border-radius", "0 0 "+cr+"px "+cr+"px");
	$("#modal-body").css("max-height", snDraw.canv_H * 0.8+"px");

	//change the scale associated with those words with a black haze.
	$('.blacken').css({"text-shadow":"0px 0px "+fsz*0.05+"px black, 0px 0px "+fsz*0.1+"px black"});
    },

    createPlayersListWindow_html_scores_table: function(){

	// 3. Extract the data
	var player_scores_list = [];
	//extact scores from players stat structure:
	for(var i = 0; i < players.length; i++){
	    var player_i_score = 0;
	    for(var j = 0; j < players[i].words.length; j++){
		player_i_score += Math.max(1,players[i].words[j].length-2);
	    }
	    player_scores_list.push({
		p_index: i,
		score: player_i_score
	    });
	}

	function comparePlayers(a, b) {
	    return a.score - b.score;
	}
	player_scores_list.sort(comparePlayers);
	player_scores_list.reverse();

	var doc = document;
	var fragment = doc.createDocumentFragment();

	//Just create the table headings...
	var tr = doc.createElement("tr");
	var th1 = doc.createElement("th");
	th1.innerHTML = "Name";
	th1.className = "scores scores-underline";
	tr.appendChild(th1);

	var th2 = doc.createElement("th");
	th2.innerHTML = "Score";
	th2.className = "scores scores-underline";
	tr.appendChild(th2);

	//does not trigger reflow
	fragment.appendChild(tr);
	
	var n_psl = player_scores_list.length;
	for(var i = 0; i < n_psl; i++){

	    var Plr = players[player_scores_list[i].p_index];

	    var tr = doc.createElement("tr");
	    var td1 = doc.createElement("td");
	    td1.innerHTML = (i+1)+ ". " + Plr.name;
	    td1.className = "scores pl-name" + (i != n_psl-1?" scores-underline":"");
	    tr.appendChild(td1);

	    var td2 = doc.createElement("td");
	    td2.innerHTML = player_scores_list[i].score.toString();
	    tr.appendChild(td2);
	    td2.className = "scores pl-score" + (i<3?" blacken":"")+ (i != n_psl-1?" scores-underline":"");
	    td2.style["font-weight"] = (i<3?800:100);
	    td2.style["color"] = (i<3? Plr.color : 'black');

	    //does not trigger reflow
	    fragment.appendChild(tr);

	}

	var table = doc.createElement("table");
	table.appendChild(fragment);

	return table;
    },


    createPlayersListWindow: function(){

	this.scalePropertiesPlayersListWindow();

	//Inject the Title
	$("#box-title").html("Players");

	//Clear body then inject scores table
	var scores_table = this.createPlayersListWindow_html_scores_table();
	$("#modal-body").html("").append(scores_table);

	//Clear the footer then add the CLOSE and potentially PLAY AGAIN links...
	var close_link = "<a class=\"modal\" href=\"#\" onclick=\"snDraw.Game.Controls.removePlayersListWindow()\">Close</a>";
	$("#modal-footer").html("").append(close_link);
	if(this.client_finished_game == true){
	    $("#modal-footer").append(" | <a class=\"modal\" href=\"#\" onclick=\"location.reload()\">Another Game</a>");
	}

	// ineligant, but a second call is necessary to apply styles to objects that didn't exist earlier
	this.scalePropertiesPlayersListWindow();

	this.createPlayersListWindow_generic_make_appear();
    },



    maybe_createConnectionLostWindow: function(){

	var x = $("#modal_dark_sheet").css('display');
	if(x[0] == 'n'){ //this is an ugly/unreliable to check if display:none for the div!
	    
	    this.scalePropertiesPlayersListWindow();

	    //Inject the Title
	    $("#box-title").html("Connection to server lost");
	    console.log($("#box-title").html());

	    //Clear body then inject scores table
	    $("#modal-body").html("<p>A constant connection to the server is required during this multiplayer game.</p>");
	    $("#modal-body").append("<p>By going back to the home page, you should be able to rejoin the same game using the <b>join</b> option.</p>");

	    //link to refresh page
	    $("#modal-footer").html("<a class=\"modal\" href=\"#\" onclick=\"location.reload()\">Rejoin</a>");

	    this.createPlayersListWindow_generic_make_appear();
	}
    },


    create_GameSettings_Window: function(){

	var x = $("#modal_dark_sheet").css('display');
	if(x[0] == 'n'){ //this is an ugly/unreliable to check if display:none for the div!
	    
	    this.scalePropertiesPlayersListWindow();

	    //Inject the Title
	    $("#box-title").html("Options");
	    console.log($("#box-title").html());

	    //Clear body then inject scores table
	    $("#modal-body").html("note to self: add some options in this space...");
	    $("#modal-body").append("<a class=\"modal\" href=\"#\" onclick=\"location.reload()\">Quit this game</a>");

	    //link to add a "close" link beneath...
	    var close_link = "<a class=\"modal\" href=\"#\" onclick=\"snDraw.Game.Controls.removePlayersListWindow()\">Close</a>";
	    $("#modal-footer").html("").append(close_link);

	    this.createPlayersListWindow_generic_make_appear();
	}
    },



    createPlayersListWindow_generic_make_appear: function(){
	var ds = document.getElementById("modal_dark_sheet");

	//make it visible...
	ds.style["display"] = "block";

	//only make the backround itself respond to clicks half a second after the scores have appeared (Touchscreen niggle fix)
	ds.onclick = undefined;
	setTimeout(function(){
	    ds.onclick = function(event) {
		if (event.target == ds) {
		    snDraw.Game.Controls.removePlayersListWindow();
		}
	    };
	}, 500);

	//the x button closes the window...
	document.getElementById("close").onclick = function() {
	    snDraw.Game.Controls.removePlayersListWindow();
	};
    },

    removePlayersListWindow: function(){
	$("#modal_dark_sheet").css("display", "none");
    }

};
