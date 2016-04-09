snDraw.Game.Zones = {

    //member data
    PlayerZone: [],//rarranged subset of array players
    unusedTilesBottomPx: undefined,

    //member functions
    CreatePlayerZoneListAndDraw: function(){

	this.PlayerZone = [];//clear the array TODO: this should not be necessary, this function should only ever be called once.
	// Populate 'this.PlayerZone' with a subset of players...
	this.PlayerZone[0] = {
	    player: players[client_player_index],
	    is_client: true
	};
	for (var i=0; i<players.length; i++){
	    if((i!=client_player_index)&&(players[i].words.length>0)){//not the Client Player AND Player has at least 1 word...
		this.PlayerZone.push({
		    player: players[i],
		    is_client: false
		});
	    }
	}

	this.calculatePlayerZoneSizes();//this sets attributes within the player objects

	for (var i=0; i<this.PlayerZone.length; i++){
	    this.createZoneBox(this.PlayerZone[i]);// Draws the BOX
	    this.drawAllPlayerWords(this.PlayerZone[i]);//Draws all the WORDS
	}
    },


    // for example player.words : [[23,14,11],[44,12,13,19,4]]
    drawAllPlayerWords: function(pZone){
	//LOOP thru all the player's words...
	// draw them onscreen
	for (var i=0; i<pZone.player.words.length; i++){
	    snDraw.Game.Words.drawSingleCapturedWord(pZone.player, i);	
	}
    },


    calculatePlayerZoneSizes: function(){
	var nZones = this.PlayerZone.length;
	n_letters_in_zone = [];
	n_letters_played = 0;
	
	//count the number of letters each player has, and total letters used within words
	for(var i=0; i<nZones; i++){
	    n_letters_in_zone[i] = 0;
	    for(var j=0; j < this.PlayerZone[i].player.words.length; j++){
		n_letters_in_zone[i] += this.PlayerZone[i].player.words[j].length;
	    }
	    n_letters_played += n_letters_in_zone[i];
	}

	//Determine the height coordinate of the top of all of the zones
	var plr_top_cumulator = undefined;
	if(disconnected_players.length == 0){//there is no "unclaimed words zone"
	    plr_top_cumulator = Math.round(this.unusedTilesBottomPx + snDraw.Game.marginUnit);
	}else{
	    plr_top_cumulator = 3;//TODO: DETERMINE THE POSITION...
	}

	//determine total amount of height contained within players' zone boxes
	section_height = snDraw.canv_H - plr_top_cumulator;
	zones_sum_height = section_height - nZones * snDraw.Game.stroke_px - (nZones-1)*snDraw.Game.textMarginUnit - snDraw.Game.marginUnit;
	basic_height = snDraw.Game.tileSize + 4*snDraw.Game.marginUnit;
	shareable_height = zones_sum_height - nZones * basic_height;

	for(var i=0; i<nZones; i++){
	    //now, we don't want to go dividing by zero if it's a new game with nothing played!!
	    var hRatio = 0;
	    if(n_letters_played){
		hRatio = n_letters_in_zone[i] / n_letters_played;
	    }else{
		hRatio = 1 / nZones;
	    }

	    var zone_i = this.PlayerZone[i];

	    //this line of code adds the attribute calculated to the relevant player object within the array...
	    zone_i.zone_height = basic_height + Math.round( hRatio * shareable_height );
	    zone_i.zone_top = plr_top_cumulator;

	    //set the base coordinates:
	    zone_i.player.x_next_word = snDraw.Game.x_plotter_R;
	    zone_i.player.y_first_word = zone_i.zone_top + 1.8 * snDraw.Game.marginUnit;
	    zone_i.player.y_next_word = zone_i.player.y_first_word;

	    plr_top_cumulator += this.PlayerZone[i].zone_height + snDraw.Game.textMarginUnit + snDraw.Game.stroke_px;
	}
    },

    uc_Zone_words_L: undefined,
    uc_Zone_words_R: undefined,
    uc_Zone_words_T: undefined,
    uc_Zone_words_bottomPx: undefined,//note that this variable is set **Externally**
    createUnclaimedZone: function(animate_in){

	var edge_pad = snDraw.Game.tileSize * 0.2;
	var u_thickness = snDraw.Game.stroke_px * 2.5;

	var boxLeft   = edge_pad;
	var boxTop    = this.unusedTilesBottomPx + edge_pad/2;
	var boxWidth  = snDraw.canv_W - 2 * edge_pad - u_thickness;

	this.uc_Zone_words_L = edge_pad + u_thickness;
	this.uc_Zone_words_R = edge_pad + u_thickness;
	this.uc_Zone_words_T = boxTop + u_thickness;

	//now command all the words to move into 
//	var boxHeight = //pZone.zone_height;

	//determine the height...

	//determine the other zone sizes

	//make the fabric objects

	//set them to animate in...

	//get the words to 

    },

    createZoneBox: function(pZone, animate_from_left){

	var boxLeft   = snDraw.Game.marginUnit;
	var boxTop    = pZone.zone_top;
	var boxWidth  = snDraw.canv_W - 2 * snDraw.Game.marginUnit - snDraw.Game.stroke_px;
	var boxHeight = pZone.zone_height;

	var zoneBox = new fabric.Rect({
	    left: boxLeft,
	    top: boxTop,
	    width: boxWidth,
	    height: boxHeight,
	    fill: 'rgba(0, 0, 0, 0)',//transparent fill - does this speed up rendering? I think no (observation test)
	    stroke: pZone.player.color,
	    strokeWidth: snDraw.Game.stroke_px,
	});

	var plrName = new fabric.Text(pZone.player.name,{
	    left: 4 * snDraw.Game.marginUnit,
	    top: boxTop - snDraw.Game.textMarginUnit,
	    fontSize: 2 * snDraw.Game.textMarginUnit,
	    textBackgroundColor: snDraw.Game.bg_col,
	    fill: pZone.player.color,
	});

	var ObjectArray = [zoneBox,plrName];

	//label if YOU
	if(pZone.is_client){
	    
	    var cell = snDraw.Game.tileSize * 1.5;
	    var font_size = snDraw.Game.tileSize * 0.7;
	    var labelLeft = boxLeft + boxWidth;
	    var labelTop  = boxTop + boxHeight;

	    var youBlock = new fabric.Rect({
		left: labelLeft - cell,
		top: labelTop - cell * 0.5,
		width: cell + snDraw.Game.stroke_px*0.5,
		height: cell * 0.49 + snDraw.Game.stroke_px*0.5,
		fill: pZone.player.color
	    });

	    var youText = new fabric.Text("You",{
	    	left: labelLeft - cell * 0.9,
		top: labelTop - cell * 0.5,
		fill: snDraw.Game.bg_col,
		fontSize: font_size,
		fontWeight: 'bold',
	    });

	    //"Spell Pointer" is a triangle that points to the word being spelled
	    snDraw.Game.Spell.SpellBottomPx = labelTop - cell * 0.05;

	    //this won't change over the course of the game...
	    snDraw.Game.Spell.SpellLeftPx = boxLeft + cell * 0.3;

	    var spellPointer = new fabric.Triangle({
		left: boxLeft + cell * 0.25,
		top: labelTop - (cell * 0.58),
		width: (cell * 0.3),//is actually height, due to rotation
		height: (cell * 0.22),//is actually width, due to rotation
		fill: pZone.player.color,
		angle: 90
	    });

	    ObjectArray.push(youBlock, youText, spellPointer);
	}

	pZone.FabObjects = [];
	for(var i = ObjectArray.length-1; i >= 0; i--){
	    var OB = ObjectArray[i];
	    OB.set({
		hasControls: false,
		hasBorders: false,
		lockMovementX: true,
		lockMovementY: true,
		selectable: false
	    });
	    canvas.insertAt(OB,i);//this uses i as the z-index for placement of object on Canvas...
	    pZone.FabObjects[i] = OB;
	    
	    if(animate_from_left){
		var origX = OB.getLeft();

		//place the object outside the Canvas (setting this position is non animated)
		snDraw.moveSwitchable(OB, false, null,{
		    left: origX - snDraw.canv_W,
		});

		//move in (animated)
		snDraw.moveSwitchable(OB, true, snDraw.ani.sty_Join,{
		    left: origX,
		});
	    }
	}

	//array item [1] this is the name text...
	ObjectArray[1].bringForward();//so that it shows above the line..
    },


    removeZoneBox: function(empty_zone){
	var bxFab = empty_zone.FabObjects;
	var LOW_px = snDraw.canv_H + snDraw.Game.tileSize;
	var zoneBox   = bxFab[0];
	var plrName   = bxFab[1];

	//generates a new animation properties object which includes a callback to group the relevant set of letter tiles upon completion of the animation
	var onComplete_deleteLostZone = function(){
	    canvas.remove(zoneBox);
	    canvas.remove(plrName);
	};

	snDraw.moveSwitchable(zoneBox, true, snDraw.ani.sty_Resize,{
	    top: LOW_px
	});
	snDraw.moveSwitchable(plrName, onComplete_deleteLostZone, snDraw.ani.sty_Resize,{// only need to use the onComplete_deleteLostZone callback once...
	    top: LOW_px - snDraw.Game.textMarginUnit
	});

    },


    ZoneHandlingUponSnatch: function(snatching_player, n_words_prior2S){

	var client_is_snatcher = client_player_index == snatching_player.index;
	var snatcher_first_word = n_words_prior2S == 0;
	var new_zone = (!client_is_snatcher) && (snatcher_first_word);

	//Generate a new zone if required.
	if(new_zone){
	    snDraw.Game.Zones.PlayerZone.push({
		player: snatching_player,
		is_client: false
	    });
	}

	//delete zones if required
	for(var i = 0; i < this.PlayerZone.length; i++){
	    var zone_i = this.PlayerZone[i];
	    if((zone_i.player.words.length == 0)&&(!zone_i.is_client)){//there are no words in the zone, and it's a non-client player. 
		var empty_zone = this.PlayerZone.splice(i,1)[0];
		i--;//because we spliced, counteract the increment of i.
		this.removeZoneBox(empty_zone);
	    }
	}
	// Animate the resizing of the zones 
	var nZones = this.PlayerZone.length; //note that the immediately preceeding code may remove zones and change the length.
	this.calculatePlayerZoneSizes();
	if (new_zone){nZones--;}//don't make adjustment animations to any new final zone...

	for(var i=0; i<nZones; i++){
	    //second parameter true prevents it from attempting to shuffle the final word (already present as data), as it will not yet be existant as a fabric group 
	    var zone_i = this.PlayerZone[i];
	    var snatched_word_in_this_zone = zone_i.player.index == snatching_player.index;
	    this.animateResizeZoneBox(zone_i);
	    //shuffle the player's words to back fill the gap, in case one of their words was just snatched away.
	    snDraw.Game.Words.animateRepositionPlayerWords(zone_i.player.index, snatched_word_in_this_zone);
	}//loop

	// does the player box need to be inserted onto the screen?
	if(new_zone){
	    //create new zone box...
	    var PZ = snDraw.Game.Zones.PlayerZone;
	    var FinalZone = PZ[PZ.length-1];
	    snDraw.Game.Zones.createZoneBox(FinalZone,true);// Draws the BOX, second parameter is for animation.	
	}
    },

    // Animate the resizing of the zones 
    updateAllZoneSizes: function(){
	this.calculatePlayerZoneSizes();
	for(var i=0; i < this.PlayerZone.length; i++){
	    var ZOi = this.PlayerZone[i];
	    this.animateResizeZoneBox(ZOi);
	    snDraw.Game.Words.animateRepositionPlayerWords(ZOi.player.index, false);
	}
    },

    animateResizeZoneBox: function(myZone){

	//animate the name and the box outline
	var bxFab = myZone.FabObjects;
	var boxTop    = myZone.zone_top;
	var boxHeight = myZone.zone_height;
	var zoneBox   = bxFab[0];
	var plrName   = bxFab[1];

	snDraw.moveSwitchable(zoneBox, true, snDraw.ani.sty_Resize,{
	    top: boxTop,
	    height: boxHeight
	});
	snDraw.moveSwitchable(plrName, true, snDraw.ani.sty_Resize,{
	    top: boxTop - snDraw.Game.textMarginUnit
	});
	
	plrName.bringForward();//so that it shows above the line..
	snDraw.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()

	//if present, animate the 'YOU'
	if(myZone.player.index == client_player_index){
	    var youBlock  = bxFab[2];
	    var youText   = bxFab[3];
	    var spellPointer = bxFab[4];
	    
	    var labelTop  = boxTop + boxHeight;
	    var cell = snDraw.Game.tileSize * 1.5;

	    snDraw.moveSwitchable(youBlock, true, snDraw.ani.sty_Resize,{
		top: labelTop - cell * 0.5
	    });
	    snDraw.moveSwitchable(youText, true, snDraw.ani.sty_Resize,{
		top: labelTop - cell * 0.5
	    });

	    snDraw.Game.Spell.SpellBottomPx = labelTop - cell * 0.05;
	    snDraw.moveSwitchable(spellPointer, true, snDraw.ani.sty_Resize,{
		top: labelTop - (cell * 0.58)
	    });

	}
    },



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NEW FUNCTIONS HERE...
/*
    Style = { //all in pixels
	hpad // horizonal padding between screen boundary and box edge (vertical)
	vpad // vertical spacing between zones (between lower edge of bottom boundary and top of upper text)
	spellpad // vertical padding of spell (between upper edge of bottom box boundary and lower edge of tile).
	fill // inside the box
	color // text colour and box boundary
	thick // thickness of the box line
	text // Text of the title
	justify // justification of the title
	titlepad // effectively, the indentation of the title	
	fontsize // refers to the font of the title
	isClient // boolean, means extra
	scale_you // scaling of the block saying "you"
	scale_tri // scaling of the triangle/pointer
    }
*/

    CreateZoneBox: function(Height, Style){
	
	var boxWidth  = snDraw.canv_W - 2 * Style.hpad - Style.thick;

	var zoneBox = new fabric.Rect({
	    width: boxWidth,
	    height: Height,
	    fill: Style.fill,
	    stroke: Style.color,
	    strokeWidth: Style.thick
	});

	var plrName = new fabric.Text(pZone.player.name,{
	    fontSize: Style.fontsize,
	    textBackgroundColor: Style.fill,
	    fill: Style.color
	});

	var ObjectArray = [zoneBox,plrName];

	if(Style.isClient){
	    var youBlock = new fabric.Rect({
		width: (Style.scale_you * 2),
		height: Style.scale_you,
		fill: Style.color
	    });

	    var youText = new fabric.Text("You",{
		fill: snDraw.Game.bg_col,
		fontSize: Style.scale_you * 0.46,
		fontWeight: 'bold',
	    });

	    var pointer_h = Style.scale_tri * 0.85;
	    var pointer_w = Style.scale_tri;
	    var spellPointer = new fabric.Triangle({
		width: pointer_h,//is actually height, due to rotation
		height: pointer_w,//is actually width, due to rotation
		fill: Style.color,
		angle: 90
	    });

	    //"Spell Pointer" is a triangle that points to the word being spelled
	    snDraw.Game.Spellx.SpellBottomPx = labelTop - cell * 0.05;
	    snDraw.Game.Spellx.SpellLeftPx = boxLeft + cell * 0.3;

	    //maybe do it like this, or differently?
	    ObjectArray.push(youBlock, youText, spellPointer);
	}

	for(var i = 0; i < ObjectArray.length; i++){
	    ObjectArray[i].set({
		hasControls: false,
		hasBorders: false,
		lockMovementX: true,
		lockMovementY: true,
		selectable: false
	    });
	}
	
	return ObjectArray;

    },


    createZoneBox_TEAR_UP: function(pZone, animate_from_left){
	
	if(animate_from_left){
	    var origX = OB.getLeft();

	    //place the object outside the Canvas (setting this position is non animated)
	    snDraw.moveSwitchable(OB, false, null,{
		left: origX - snDraw.canv_W,
	    });

	    //move in (animated)
	    snDraw.moveSwitchable(OB, true, snDraw.ani.sty_Join,{
		left: origX,
	    });
	}
	

	//array item [1] this is the name text...
	ObjectArray[1].bringForward();//so that it shows above the line..
    },


    DetermineZoneBoxObjectsTops: function(Top, Height, Style){
	var box_top = Top + Style.fontsize/2;
	var box_bottom = box_top + Height;
	var hor_centerline_height = box_bottom - (Style.thick/2 + Style.spellpad + snDraw.Game.tileSize/2);
	return {
	    zoneBox_top: box_top,
	    plrName_top: Top,
	    youBlock_top: (box_bottom - Style.scale_you),
	    youText_top: (box_bottom - Style.scale_you),
	    spellPointer_top: (hor_centerline_height - pointer_h/2),
	    SPELL_TILES_top: (hor_centerline_height - snDraw.Game.tileSize/2)
	};
    },

    DetermineZoneBoxObjectsLefts: function(Left_Offset, Style){
	var boxLeft = Style.hpad + Style.thick/2;
	var boxRight = boxLeft + boxWidth;
	var pointer_w = Style.scale_tri;
	return {
	    zoneBox_left: boxLeft,
	    plrName_left: titlepad,//Ahem - this is incomplete!!!
	    youBlock_left: (boxRight - Style.scale_you),
	    youText_left: (boxRight - Style.scale_you * 1.8),
	    spellPointer_left: boxLeft + pointer_w//due to rotation, left is effectively a coordinate 'right'
	};
    },



    AnimateZoneBox: function(xxx){
	
    },


    CalculateAllZoneSizes: function(xxx){

    }

};
