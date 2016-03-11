snDraw.Game.Zones = {

    //member data
    PlayerZone: [],//rarranged subset of array players
    playersZoneTopPx: undefined,

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
	    snDraw.Game.drawSingleCapturedWord(pZone.player, i);	
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

	//determine total amount of height contained within players' zone boxes
	section_height = myZoneHeight - this.playersZoneTopPx;
	zones_sum_height = section_height - nZones * snDraw.Game.stroke_px - (nZones-1)*snDraw.Game.textMarginUnit - snDraw.Game.marginUnit;
	basic_height = snDraw.Game.tileSize + 4*snDraw.Game.marginUnit;
	shareable_height = zones_sum_height - nZones * basic_height;

	var plr_top_cumulator = this.playersZoneTopPx;// the starting value for this variable is the lower edge of the tile zone...
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

    createZoneBox: function(pZone,animate_from_left){

	var boxLeft   = snDraw.Game.marginUnit;
	var boxTop    = pZone.zone_top;
	var boxWidth  = myZoneWidth - 2 * snDraw.Game.marginUnit - snDraw.Game.stroke_px;
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

	    ObjectArray.push(youBlock,youText);
	}

	pZone.FabObjects = [];
	for(var i=ObjectArray.length-1; i>=0; i--){
	    var OB = ObjectArray[i];
	    OB.set({
		hasControls: false,
		hasBorders: false,
		lockMovementX: true,
		lockMovementY: true,
		selectable: false
	    });
	    canvas.add(OB);
	    canvas.sendToBack(OB);//TODO: determine if this command with the one above represents duplication?
	    pZone.FabObjects[i] = OB;

	    if(animate_from_left){
		var origX = OB.getLeft();

		//move away (non animated)
		snDraw.moveSwitchable(OB, false, null,{
		    left: origX - myZoneWidth,
		});

		//move in (animated)
		snDraw.moveSwitchable(OB, true, snDraw.ani.sty_Join,{
		    left: origX,
		});
	    }

	}

	/*
	  var plrZone = new fabric.Group(ObjectArray,{
	  hasControls: false,
	  hasBorders: false,
	  lockMovementX: true,
	  lockMovementY: true
	  });
	*/
    },


    removeZoneBox: function(empty_zone){
	var bxFab = empty_zone.FabObjects;
	var LOW_px = myZoneHeight + snDraw.Game.tileSize;
	var zoneBox   = bxFab[0];
	var plrName   = bxFab[1];

	//generates a new animation properties object which includes a callback to group the relevant set of letter tiles upon completion of the animation
	var ani_withDELcallback = jQuery.extend({
	    onComplete: function(){
		canvas.remove(zoneBox);
		canvas.remove(plrName);
	    }
	}, snDraw.ani.sty_Resize);


	snDraw.moveSwitchable(zoneBox, true, snDraw.ani.sty_Resize,{
	    top: LOW_px
	});
	snDraw.moveSwitchable(plrName, true, ani_withDELcallback,{// only need to use the ani_withDELcallback variant once...
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
	for(var i=0; i < this.PlayerZone.length; i++){
	    var zone_i = this.PlayerZone[i];
	    if((zone_i.player.words.length == 0)&&(!zone_i.is_client)){//there are no words in the zone, and it's a non-client player. 
		var empty_zone = this.PlayerZone.splice(i,1)[0];
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
	    this.animateResizeRewrapZone(zone_i, snatched_word_in_this_zone);
	}//loop

	// does the player box need to be inserted onto the screen?
	if(new_zone){
	    //create new zone box...
	    var PZ = snDraw.Game.Zones.PlayerZone;
	    var FinalZone = PZ[PZ.length-1];
	    snDraw.Game.Zones.createZoneBox(FinalZone,true);// Draws the BOX, second parameter is for animation.	
	}
    },


    animateResizeRewrapZone: function(myZone, snatched_word_here){

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

	//if present, animate the 'YOU'
	if(myZone.player.index == client_player_index){
	    var youBlock  = bxFab[2];
	    var youText   = bxFab[3];
	    var labelTop  = boxTop + boxHeight;
	    var cell = snDraw.Game.tileSize * 1.4;

	    snDraw.moveSwitchable(youBlock, true, snDraw.ani.sty_Resize,{
		top: labelTop - cell * 0.5
	    });
	    snDraw.moveSwitchable(youText, true, snDraw.ani.sty_Resize,{
		top: labelTop - cell * 0.5
	    });
	}
	//animate the words, if present...
	snDraw.Game.animateRepositionPlayerWords(myZone.player, snatched_word_here);
    }

};
