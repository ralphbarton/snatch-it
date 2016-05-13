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

    CreateZoneBox: function(Height, ZoneProperties){
	
	var ZoneSty = ZoneProperties.ZoneSty;
	var boxWidth  = snDraw.canv_W - 2 * ZoneSty.hpad - ZoneSty.thick;

	var zoneBox = new fabric.Rect({
	    width: boxWidth,
	    fill: ZoneSty.box_fill,
	    stroke: ZoneProperties.color,
	    strokeWidth: ZoneSty.thick,
	    rx: ZoneSty.rounding,
	    ry: ZoneSty.rounding
	});

	var plrName = new fabric.Text((ZoneSty.text_pad + ZoneProperties.text + ZoneSty.text_pad),{
	    fontSize: ZoneSty.fontsize,
	    backgroundColor: ZoneSty.text_bg,
	    fill: ZoneProperties.color
	});

	var ObjectArray = [zoneBox,plrName];

	if(ZoneProperties.isClient){
	    var youBlock = new fabric.Rect({
		width: ZoneSty.you_w,
		height: ZoneSty.you_h,
		rx: ZoneSty.rounding,
		ry: ZoneSty.rounding,
		fill: ZoneProperties.color
	    });

	    var youText = new fabric.Text("You",{
		fill: snDraw.Game.bg_col,
		fontSize: ZoneSty.you_fontsize,
		fontWeight: 'bold',
	    });

	    //"Spell Pointer" is a triangle that points to the word being spelled
	    var spellPointer = new fabric.Triangle({
		width: ZoneSty.tri_h,//is actually height, due to rotation
		height: ZoneSty.tri_w,//is actually width, due to rotation
		fill: ZoneProperties.color,
		angle: 90,
	    });

	    var spellPointerMask = new fabric.Triangle({
		width: ZoneSty.tri_h,//is actually height, due to rotation
		height: ZoneSty.tri_w,//is actually width, due to rotation
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

    DetermineZoneBoxObjectsTops: function(Top, Height, ZoneSty){
	var box_top = Top + Math.max(ZoneSty.fonthalfheight - ZoneSty.thick/2, 0);
	var box_bottom = Top + Height - ZoneSty.thick/2;//center of border
	var hor_centerline_height = box_bottom - (ZoneSty.thick/2 + ZoneSty.spell_vpad + snDraw.Game.tileSize/2);
	return [
	    box_top, // 1. zoneBox_top
	    Top, // 2. plrName_top
	    (box_bottom - ZoneSty.you_h), // 3. youBlock_top
	    (box_bottom - ZoneSty.you_h + ZoneSty.you_font_Yoff), // 4. youText_top
	    (hor_centerline_height - ZoneSty.tri_h/2), // 5. spellPointer_top
	    (hor_centerline_height - ZoneSty.tri_h/2), // 6. spellPointer_Mask_top
	    (hor_centerline_height - snDraw.Game.tileSize/2) // 7. SPELL_TILES_top
	];
    },

    DetermineZoneFlexBoxHeight: function(Height, ZoneSty){
	return (Height - Math.max(ZoneSty.fonthalfheight, ZoneSty.thick/2) - ZoneSty.thick/2);
    },

    DetermineZoneBoxObjectsLefts: function(Left_Offset, ZoneSty, textWidth){
	var boxLeft = ZoneSty.hpad;
	var boxWidth  = snDraw.canv_W - 2 * ZoneSty.hpad - ZoneSty.thick; // this line is duplicated
	var boxRight = boxLeft + boxWidth + ZoneSty.thick/2; //center of border
	var textLeft = undefined;

	if((textWidth != undefined)&&(ZoneSty.justify == "center")){
	    textLeft = boxLeft + (boxWidth - textWidth)/2;
	}else if((textWidth != undefined)&&(ZoneSty.justify == "right")){
	    textLeft = boxRight - ZoneSty.titlepad - textWidth; 
	}else{//assume it is left-justify
	    textLeft = ZoneSty.titlepad;
	}
	
	var spellpointer_left = boxLeft + ZoneSty.thick/2 + ZoneSty.tri_w; // rotation => left is effectively 'right'
	var spellpointer_offset_thick = ZoneSty.thick * 2.5 * (ZoneSty.tri_w / ZoneSty.tri_h);

	return [
	    (Left_Offset + boxLeft), // 1. zoneBox_left
	    (Left_Offset + textLeft), // 2. plrName_left
	    (Left_Offset + boxRight - ZoneSty.you_w), // 3. youBlock_left
	    (Left_Offset + boxRight - ZoneSty.you_w + ZoneSty.you_font_Xoff), // 4. youText_left
	    (Left_Offset + spellpointer_left), // 5. spellPointer_left 
	    (Left_Offset + spellpointer_left - spellpointer_offset_thick), // 6. spellPointerMask_left
	    (Left_Offset + boxLeft + ZoneSty.thick/2 + ZoneSty.tri_w + ZoneSty.spell_hpad)// 7. spell left
	];
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


    ZoneSty1: undefined,
    ZoneSty2: undefined,
    ZoneVerticalPaddings: undefined,
    SetZoneStyleScalingsFromTileSize: function(tile_size_px){
	var Tx = tile_size_px / 10;

	//Zone Style 1 refers to the Player Zones....
	this.ZoneSty1 = { //all in pixels
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
	    w_vpad: Tx * 3.8, // vertical padding between top of word tiles and lower inside edge of box border
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
	this.ZoneSty2 = { //all in pixels
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

	//this inline function has the side effect of modifying the ZoneSty object it is provided...
	function setZoneStyWordBlockBounds (ZoneSty){
	    ZoneSty.WordBlockBounds = {
		left: (ZoneSty.hpad + ZoneSty.thick + ZoneSty.w_hpad),
		right: (snDraw.canv_W - (ZoneSty.hpad + ZoneSty.thick + ZoneSty.w_hpad)),
		topPadding: (Math.max(ZoneSty.fonthalfheight + ZoneSty.thick/2, ZoneSty.thick) + ZoneSty.w_vpad)
	    };
	}

	setZoneStyWordBlockBounds(this.ZoneSty1);
	setZoneStyWordBlockBounds(this.ZoneSty2);

	this.ZoneVerticalPaddings = {
	    aboveU: Tx * 2.5,
	    above: Tx,
	    between: Tx,
	    bottom: Tx
	};
    },


    // Determinate the positions and arrangements of everything to be drawn on-screen
    calculateAllPositionsArrangements: function(){

	// 1. retrieve style information...
	var ZoneSty_P = snDraw.Game.Zones.ZoneSty1;
	var WordBounds_P = ZoneSty_P.WordBlockBounds;
	var ZoneSty_U = snDraw.Game.Zones.ZoneSty2;
	var WordBounds_U = ZoneSty_U.WordBlockBounds;
	var interzonePad = snDraw.Game.Zones.ZoneVerticalPaddings;
	var Spacings = snDraw.Game.tileSpacings;

	// 2. retrieve the bottom pixel of the letters grid
	var upper_drawing_bound = snDraw.Game.Grid.GetGridBottomPx();

	// 3. If an unclaimed zone exists, calculate its word arrangement and hence its overall height
	var Unclaimed_D = {};
	if(snDraw.Game.Zones.Unclaimed.exists){
	    var words_list = snDraw.Game.Words.getUnclaimedWordsList("via TID");
	    Unclaimed_D.Arrangement_noH = snDraw.Game.Words.GenWordArrangement(words_list, WordBounds_U, Spacings, "center");

	    upper_drawing_bound += snDraw.Game.Zones.ZoneVerticalPaddings.aboveU;
	    Unclaimed_D.Top = upper_drawing_bound;

	    var unclaimed_Height_pads_tot = ZoneSty_U.thick*2 + ZoneSty_U.w_vpad*2;
	    var unclaimed_Height_words_stack = snDraw.Game.Zones.WordsStackHeightPx(Unclaimed_D.Arrangement_noH, Spacings);
	    Unclaimed_D.Height = unclaimed_Height_words_stack + unclaimed_Height_pads_tot;

	    upper_drawing_bound += Unclaimed_D.Height;
	}

	// 4. calculate the word arrangements for zones of all active players
	var ArrangementsArray_noH = [];
	for (var i = 0; i < snDraw.Game.Zones.PlayerZone.length; i++){
	    var player_i = snDraw.Game.Zones.PlayerZone[i].player;
	    ArrangementsArray_noH.push(snDraw.Game.Words.GenWordArrangement(player_i.words, WordBounds_P, Spacings, "left"));
	}

	// 5. Finally, calculate the sizes of all zones...
	// ZoneSizes is data object like [{Top: , Height: }, {}, ...]
	return {
	    Unclaimed_D: Unclaimed_D,
	    ArrangementsArray_noH: ArrangementsArray_noH,
	    ZoneSizes: (snDraw.Game.Zones.CalcZoneSizes(ArrangementsArray_noH, upper_drawing_bound, interzonePad, Spacings))
	};
    },

    
    AnimateResizeAllZones: function(ani_sty, exclude_this_zone_by_i){
	// 1. Get the positions and arrangements of everything...
	var Positions = snDraw.Game.Zones.calculateAllPositionsArrangements();

	//note, Positions is an object: {Unclaimed_D, ArrangementsArray_noH, ZoneSizes}
	//note, ZoneSizes is an array: [{Top: , Height: }, {}, ...]

	// 2. If present, move the unclaimed zone & its words
	// note that if the unclaimed zone is excluded from resize, the entire step of:
	// (a) animating the zone changing to the new size
	// (b) animating the words into new positions
	// is omitted altogther. this is because distinct animations are required for words and zone (the come together)

	// by constrast a player zone, if new, always starts has zero words in it at the point this function is called
	if(exclude_this_zone_by_i !== "unclaimed"){
	    if(snDraw.Game.Zones.Unclaimed.exists){

		this.repositionZoneAndEnclWordsOnCanvas(snDraw.Game.Zones.Unclaimed,
							Positions.Unclaimed_D.Arrangement_noH,
							Positions.Unclaimed_D.Top,
							Positions.Unclaimed_D.Height,
							this.getZoneProperties("unclaimed"),	
							ani_sty
						       );
	    }
	}

	// 4. Now move all of the player zones, and their contained words
	for (var i = 0; i < snDraw.Game.Zones.PlayerZone.length; i++){

	    var pz_ani_sty = (exclude_this_zone_by_i == i) ? null : ani_sty;
	    this.repositionZoneAndEnclWordsOnCanvas(snDraw.Game.Zones.PlayerZone[i],
						    Positions.ArrangementsArray_noH[i],
						    Positions.ZoneSizes[i].Top,
						    Positions.ZoneSizes[i].Height,
						    this.getZoneProperties("player"),
						    pz_ani_sty
						   );
	}

	
	//return the array: [{Top: , Height: }, {}, ...] for all zones
	return Positions;
    },


    CreateNewZoneBoxOnCanvas: function(Top, Height, ZoneProperties){

	//generate the fabric objects that represent the new zone. Note that properties left & top are not set
	//nor are the objects present onf the canvas.
	var Zone_FabObjs =  snDraw.Game.Zones.CreateZoneBox(Height, ZoneProperties);
	var Zone_Tops = snDraw.Game.Zones.DetermineZoneBoxObjectsTops(Top, Height, ZoneProperties.ZoneSty);
	var Zone_Lefts = snDraw.Game.Zones.DetermineZoneBoxObjectsLefts(0, ZoneProperties.ZoneSty, Zone_FabObjs[1].width);
	var flex_box_height = snDraw.Game.Zones.DetermineZoneFlexBoxHeight(Height, ZoneProperties.ZoneSty);

	//for each object making the ZONE, set coordinates and place on canvas...
	for (var j = 0; j < Zone_FabObjs.length; j++){
	    Zone_FabObjs[j].setLeft(Zone_Lefts[j]);
	    Zone_FabObjs[j].setTop(Zone_Tops[j]);
	    canvas.add(Zone_FabObjs[j]);
	}

	//also set the height of the only item in Zone_FabObjs which has flexi-height...
	Zone_FabObjs[0].setHeight(flex_box_height);

	// non-animated movement of spell to correct position
	if(ZoneProperties.isClient){
	    var spell_Left = Zone_Lefts[6]; 
	    var spell_Top = Zone_Tops[6];
	    snDraw.Game.Spell.setSpellPosition(spell_Left, spell_Top, false, null);
	    snDraw.Game.Spell.redrawResizedSpell();
	}

	return Zone_FabObjs;
    },

    // the intended purpose of this function has changed since I last considered it.
    // given an already correctly sized zone box, this will animate it on or off the screen
    // handling the visuals of zone addition and zone removal events
    // the off-screen animation coordinates are simply determined from the Fabric object properties...
    InOutAnimateZoneBox: function(Zone, ani_sty, ani_entryexit, direction){

	var BoxObjs = Zone.Zone_FabObjs;
	var B_Top = BoxObjs[1].getTop(); // here, we assume the top of the "Name" text of the zone it its top

	//this is to do the reverse of "DetermineZoneFlexBoxHeight" and determine overall height from box height
	var zonetype = Zone.exists == undefined ? "player" : "unclaimed";
	var total_height_incrementor = -this.DetermineZoneFlexBoxHeight(0, this.getZoneProperties(zonetype).ZoneSty);
	var B_Height = BoxObjs[0].getHeight + total_height_incrementor;
	
	for(var i = 0; i < BoxObjs.length; i++){

	    var onScreen_location = {
		left: BoxObjs[i].left,
		top: BoxObjs[i].top
	    };
	    var offScreen_location = {};

	    if(direction == "left"){
		offScreen_location.left = BoxObjs[i].left - snDraw.canv_W;

	    }else if(direction == "right"){
		offScreen_location.left = BoxObjs[i].left + snDraw.canv_W;

	    }else if(direction == "top"){
		offScreen_location.top = BoxObjs[i].top - (B_Height + B_Top);

	    }else if(direction == "bottom"){
		offScreen_location.top = BoxObjs[i].top + (snDraw.canv_H - B_Top);
	    }

	    if(ani_entryexit == "entry"){
		//this is to statically place object in starting position
		BoxObjs[i].set(offScreen_location);
		//this sets it animating
		snDraw.moveSwitchable(BoxObjs[i], true, ani_sty, onScreen_location);
	    }
	    if(ani_entryexit == "exit"){
		// it is already in its onScreen location, so only need to make it move off.
		//with object deletion upon animation completion built in...
		snDraw.moveSwitchable(BoxObjs[i], function(){canvas.remove(BoxObjs[i]);}, ani_sty, offScreen_location);
	    }
	}
    },



    repositionZoneAndEnclWordsOnCanvas: function(Zone, WordArrangement_noH, Top, Height, ZoneProperties, ani_sty){
	// (A) move the items of Zone box itself into their new positions
	// copy - pasted...
	var Zone_FabObjs = Zone.Zone_FabObjs;
	var Zone_Tops = snDraw.Game.Zones.DetermineZoneBoxObjectsTops(Top, Height, ZoneProperties.ZoneSty);
	var flex_box_height = snDraw.Game.Zones.DetermineZoneFlexBoxHeight(Height, ZoneProperties.ZoneSty);

	var B_animation = (ani_sty !== null);
	// (i) move items actually making up the zone...
	for (var j = 0; j < Zone_FabObjs.length; j++){
	    snDraw.moveSwitchable(Zone_FabObjs[j], B_animation, ani_sty,{
		top: Zone_Tops[j]
	    });
	}
	// (ii) change HEIGHT of box outline (Zone_FabObjs[0] the only array item with variable height)
	snDraw.moveSwitchable(Zone_FabObjs[0], B_animation, ani_sty,{
	    height: flex_box_height
	});
	// (iii) if client zone, move spell-pointer...
	if(Zone.is_client){
	    var spell_Top = Zone_Tops[6];
	    snDraw.Game.Spell.setSpellPosition(null, spell_Top, true, ani_sty);
	}

	// (B) move all words within the box into their new positions
	if(Zone.exists == undefined){// case 1: a player owned-zone
	    var PID = Zone.player.index;
	    var WordGroup = snDraw.Game.Words.TileGroupsArray[PID];
	}else{// case 2: the unclaimed zone
	    var WordGroup = snDraw.Game.Words.getUnclaimedWordsList("via Grp");
	}

	// (i) move each word to the new location.
	snDraw.Game.Words.MoveWordsIntoArrangement(Top, ZoneProperties.WordBounds, WordGroup, WordArrangement_noH, ani_sty);
    },


    getZoneProperties: function(zone_index){
	// 7.2 - retrieve style information, for both player and unclaimed zones
	if (typeof(zone_index) == "number"){
	    return {
		color: this.PlayerZone[zone_index].player.color, // text colour and box boundary
		text: this.PlayerZone[zone_index].player.name, // Text of the title
		isClient: this.PlayerZone[zone_index].is_client,
		ZoneSty: this.ZoneSty1,
		WordBounds: this.ZoneSty1.WordBlockBounds
	    };
	}else if(zone_index == "unclaimed"){
	    return {
		color: 'grey',
		text: 'unclaimed',
		isClient: false,
		ZoneSty: this.ZoneSty2,
		WordBounds: this.ZoneSty2.WordBlockBounds
	    };
	}else if(zone_index == "player"){
	    return {
		ZoneSty: this.ZoneSty1,
		WordBounds: this.ZoneSty1.WordBlockBounds
	    };
	}
    },


    getZoneIndexOfPlayer: function(player_index){
	for(var i = 0; i < this.PlayerZone.length; i++){
	    if(this.PlayerZone[i].player.index == player_index){
		return i;
	    }
	}
    }

};
