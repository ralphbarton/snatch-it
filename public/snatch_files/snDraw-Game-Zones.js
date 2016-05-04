snDraw.Game.Zones = {

    //member data
    PlayerZone: [],//rarranged subset of array players
    Unclaimed: {},
    
    unusedTilesBottomPx: undefined,//delete this line and others...

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
	plr_top_cumulator = Math.round(this.unusedTilesBottomPx + snDraw.Game.marginUnit);

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

    CreateZoneBox: function(Height, Style, Properties){
	
	var boxWidth  = snDraw.canv_W - 2 * Style.hpad - Style.thick;

	var zoneBox = new fabric.Rect({
	    width: boxWidth,

	    fill: Style.box_fill,
	    stroke: Properties.color,
	    strokeWidth: Style.thick,
	    rx: Style.rounding,
	    ry: Style.rounding
	});

	var plrName = new fabric.Text((Style.text_pad + Properties.text + Style.text_pad),{
	    fontSize: Style.fontsize,
	    backgroundColor: Style.text_bg,
	    fill: Properties.color
	});

	var ObjectArray = [zoneBox,plrName];

	if(Properties.isClient){
	    var youBlock = new fabric.Rect({
		width: Style.you_w,
		height: Style.you_h,
		rx: Style.rounding,
		ry: Style.rounding,
		fill: Properties.color
	    });

	    var youText = new fabric.Text("You",{
		fill: snDraw.Game.bg_col,
		fontSize: Style.you_fontsize,
		fontWeight: 'bold',
	    });

	    //"Spell Pointer" is a triangle that points to the word being spelled
	    var spellPointer = new fabric.Triangle({
		width: Style.tri_h,//is actually height, due to rotation
		height: Style.tri_w,//is actually width, due to rotation
		fill: Properties.color,
		angle: 90,
	    });

	    var spellPointerMask = new fabric.Triangle({
		width: Style.tri_h,//is actually height, due to rotation
		height: Style.tri_w,//is actually width, due to rotation
		fill: 'rgba(0,0,0,1)',
		angle: 90
	    });


	    //maybe do it like this, or differently?
	    ObjectArray.push(youBlock, youText, spellPointer, spellPointerMask);
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

    DetermineZoneBoxObjectsTops: function(Top, Height, Style){
	var box_top = Top + Math.max(Style.fonthalfheight - Style.thick/2, 0);
	var box_bottom = Top + Height - Style.thick/2;//center of border
	var hor_centerline_height = box_bottom - (Style.thick/2 + Style.spell_vpad + snDraw.Game.tileSize/2);
	return [
	    box_top, // 1. zoneBox_top
	    Top, // 2. plrName_top
	    (box_bottom - Style.you_h), // 3. youBlock_top
	    (box_bottom - Style.you_h + Style.you_font_Yoff), // 4. youText_top
	    (hor_centerline_height - Style.tri_h/2), // 5. spellPointer_top
	    (hor_centerline_height - Style.tri_h/2), // 6. spellPointer_Mask_top
	    (hor_centerline_height - snDraw.Game.tileSize/2) // 7. SPELL_TILES_top
	];
    },

    DetermineZoneFlexBoxHeight: function(Height, Style){
	return (Height - Math.max(Style.fonthalfheight, Style.thick/2) - Style.thick/2);
    },

    DetermineZoneBoxObjectsLefts: function(Left_Offset, Style, textWidth){
	var boxLeft = Style.hpad;
	var boxWidth  = snDraw.canv_W - 2 * Style.hpad - Style.thick; // this line is duplicated
	var boxRight = boxLeft + boxWidth + Style.thick/2; //center of border
	var textLeft = undefined;

	if((textWidth != undefined)&&(Style.justify == "center")){
	    textLeft = boxLeft + (boxWidth - textWidth)/2;
	}else if((textWidth != undefined)&&(Style.justify == "right")){
	    textLeft = boxRight - Style.titlepad - textWidth; 
	}else{//assume it is left-justify
	    textLeft = Style.titlepad;
	}
	
	var spellpointer_left = boxLeft + Style.thick/2 + Style.tri_w; // rotation => left is effectively 'right'
	var spellpointer_offset_thick = Style.thick * 2.5 * (Style.tri_w / Style.tri_h);

	return [
	    (Left_Offset + boxLeft), // 1. zoneBox_left
	    (Left_Offset + textLeft), // 2. plrName_left
	    (Left_Offset + boxRight - Style.you_w), // 3. youBlock_left
	    (Left_Offset + boxRight - Style.you_w + Style.you_font_Xoff), // 4. youText_left
	    (Left_Offset + spellpointer_left), // 5. spellPointer_left 
	    (Left_Offset + spellpointer_left - spellpointer_offset_thick), // 6. spellPointerMask_left
	    (Left_Offset + boxLeft + Style.thick/2 + Style.tri_w + Style.spell_hpad)// 7. spell left
	];
    },

    //consider this function...
    //function repositionZoneAndEnclWordsOnCanvas(Zone, Top, Height, ZoneSty, WordBounds, ani_sty){

    // the parameter 'TargetDims' will be null if it is an animation exit
    AnimateZoneBox: function(BoxObjs, Height, TargetDims, ani_sty, ani_entryexit, direction){

	
	if(ani_entryexit == "entry"){
	    for(var i = 0; i < BoxObjs.length; i++){

		var target_off = {};
		if(direction == "left"){
		    target_off.left = null;//TODO

		}else if(direction == "right"){
		    target_off.left = null;//todo

		}else if(direction == "top"){
		    target_off.top = null;//TODO

		}else if(direction == "bottom"){
		    TargetDims.top = null;//TODO
		}

		//this is to statically place object in starting position
		BoxObjs[i].set({

		});

		//this sets it animating


	    }
	}else if(ani_entryexit == "exit"){

	    //this is ugly: we're now inferring a specific set of objects, where the 'top' of array[1] is the top overall
	    var BT = BoxObjs[1].top;

	    for(var i = 0; i < BoxObjs.length; i++){

		var target_off = {};
		if(direction == "left"){
		    target_off.left = BoxObjs[i].getLeft() - snDraw.canv_W;

		}else if(direction == "right"){
		    target_off.left = BoxObjs[i].getLeft() + snDraw.canv_W;

		}else if(direction == "top"){
		    target_off.top = BoxObjs[i].getTop() - (Height + BT);

		}else if(direction == "bottom"){
		    TargetDims.top = BoxObjs[i].getTop() + (snDraw.canv_H - BT);
		}

		//with object deletion upon animation completion built in...
		snDraw.moveSwitchable(BoxObjs[i], function(){canvas.remove(BoxObjs[i]);}, ani_sty, target_off);
	    }

	}else if(ani_entryexit == "size asjust"){
	    return null
	}
    },


    CalcZoneSizes: function(ArrangementsArray, top_px, ZoneVerticalPaddings, Spacings){

	var n_zones = ArrangementsArray.length;
	var ZoneSizes = [];
	var EffectiveZoneTopPx = top_px + ZoneVerticalPaddings.above;
	
	var words_consume_height = [];
	var words_consume_height_total = 0;
	
	//1. Determine how much height is actually required by all the lines of words...
	for(var i = 0; i < n_zones; i++){
	    words_consume_height[i] = this.WordsStackHeightPx(ArrangementsArray[i], Spacings);
	    words_consume_height_total += words_consume_height[i];
	}

	//2. Share the "spare height" between all active players...
	var rem_height = snDraw.canv_H - EffectiveZoneTopPx;
	var total_zone_height = rem_height - (n_zones-1) * ZoneVerticalPaddings.between - ZoneVerticalPaddings.bottom;
	var spare_sharable_height = total_zone_height - words_consume_height_total;
	var space_height_each = spare_sharable_height / (n_zones+1);

	//3. generate and return the sizes array (with Top and Height for each zone)...
	var ZonesHeightsTops = [];
	var Top_cumulator = EffectiveZoneTopPx;
	for(var i = 0; i < n_zones; i++){
	    var Height = words_consume_height[i] + space_height_each * (i==0?2:1);
	    ZonesHeightsTops.push({
		Top: Top_cumulator,
		Height: Height 
	    });
	    Top_cumulator += Height + ZoneVerticalPaddings.between;
	}
	return ZonesHeightsTops;
    },

    WordsStackHeightPx: function(Arrangement, Spacings){
	var n_lines_i = Arrangement.breaks.length;
	return (n_lines_i - 1) * Spacings.tsvg + Spacings.ts;
    },


    Style1: undefined,
    Style2: undefined,
    ZoneVerticalPaddings: undefined,
    SetZoneStyleScalingsFromTileSize: function(tile_size_px){
	var Tx = tile_size_px / 10;

	//Zone Style 1 refers to the Player Zones....
	this.Style1 = { //all in pixels
	    hpad: Tx * 1.4,  // horizonal padding between screen boundary and box edge (vertical)
	    w_hpad: Tx * 1.4, // horizonal padding between words and the inside of the box
	    box_fill: 'rgba(0,0,0,0)', // inside the box
	    text_bg: 'black', // inside the box
	    thick: Tx * 0.9, // thickness of the box line
	    rounding: Tx * 0.5, // rounding of corners of box
	    text_pad: " ",
	    justify: "left", // justification of the title
	    titlepad: Tx * 10, // effectively, the indentation of the title	
	    fontsize: Tx * 7, // refers to the font of the title
	    fonthalfheight: Tx * 4, // refers to the offset between top of font and top surface of box
	    w_vpad: Tx * 2.8, // vertical padding between top of word tiles and lower inside edge of box border
	    you_w: Tx * 20, // scaling of the block saying "you"
	    you_h: Tx * 10, // scaling of the block saying "you"
	    you_fontsize: Tx * 9,
	    you_font_Xoff: Tx * 2.9,
	    you_font_Yoff: Tx * 0.5,
	    tri_w: Tx * 5, // Width, in pixels, of the little triangle (spell pointer)
	    tri_h: Tx * 7, // Height, in pixels, of the little triangle (spell pointer)
	    spell_vpad: Tx * 2.5, // vertical padding of spell (upper edge of bottom box to lower edge of tile).
	    spell_hpad: Tx * 2.5 // horizonatal padding of spell (tip of arrow to right edge of tile).
	};

	//Zone Style 2 refers to unused word Zone
	this.Style2 = { //all in pixels
	    hpad: Tx * 9,  // horizonal padding between screen boundary and box edge (vertical)
	    w_hpad: Tx * 1.8, // horizonal padding between words and the inside of the box
	    box_fill: 'rgba(255,255,255,0.1)', // inside the box
	    text_bg: 'black', // inside the box
	    thick: Tx * 2.2, // thickness of the box line
	    rounding: Tx * 1.5, // rounding of corners of box
	    text_pad: " ",
	    justify: "center", // justification of the title
	    fontsize: 0.1, // refers to the font of the title
	    fonthalfheight: 0.1, // refers to the offset between top of font and top surface of box
	    w_vpad: Tx * 1.8 // vertical padding between top of word tiles and lower inside edge of box border
	};

	//this inline function has the side effect of modifying the Style object it is provided...
	function setStyleWordBlockBounds (Style){
	    Style.WordBlockBounds = {
		left: (Style.hpad + Style.thick + Style.w_hpad),
		right: (snDraw.canv_W - (Style.hpad + Style.thick + Style.w_hpad)),
		topPadding: (Math.max(Style.fonthalfheight + Style.thick/2, Style.thick) + Style.w_vpad)
	    };
	}

	setStyleWordBlockBounds(this.Style1);
	setStyleWordBlockBounds(this.Style2);

	this.ZoneVerticalPaddings = {
	    aboveU: Tx * 2.5,
	    above: Tx,
	    between: Tx,
	    bottom: Tx
	};
    }

};
