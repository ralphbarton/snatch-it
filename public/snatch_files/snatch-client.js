// Run only when HTML is loaded and 
// DOM properly initialized (courtesy jquery)
//$(function () {

//establish the websocket connection with the server
var socket = io();

// Obtain a canvas drawing surface from fabric.js
var canvas = new fabric.Canvas('c');

//take the window dimentions at time of page load, and use these to draw on
// the screen of the device at the correct scaling
var myZoneWidth = window.innerWidth-20;
var myZoneHeight = window.innerHeight-20;
canvas.setHeight(myZoneHeight);
canvas.setWidth(myZoneWidth);

//we don't want to select a group of objects with the mouse
canvas.selection = false;
//speedup?
canvas.renderOnAddRemove = false;
canvas.stateful = false;

var Ratio_tile = 0.15;//0.25;
var dark_background = true;
var bg_col = dark_background ? 'black' : 'white';
var fg_col = dark_background ? 'white' : 'black';


var tileset = [];//global reference - for server data...
var players = [];//global reference - for server data...
var N_tiles = 0;
var TileArray = [];
var tiles_bottom_px=0;
var WordCreate = undefined;
var ClientPlayerIndex = undefined;

socket.emit('player joining game', 0);

socket.on('player color choices', function(colorSetObjStr){
    //probably need to decode colorSet here...
    playerIdentityPrompt(colorSetObjStr);
});

///upon arrival, process the transmitted game state from the server
//HERE sits the code to render a game from scratch
socket.on('full game state transmission', function(gameState){

    rmLoadingMsg();//unnecessary now due to the next instruction...
    canvas.setBackgroundColor(bg_col);
    canvas.clear();	    

    var GameStateObject = JSON.parse(gameState);
    tileset = GameStateObject.tileSet;
    players = GameStateObject.playerSet;
    N_tiles = tileset.length;
    tiles_bottom_px = loadTilesOntoCanvas(tileset);

    //this is the BIG DEAL and it creates all of the objects for the game
    drawEntirePlayerZone();

    createGameControlButtons();

    //also add the lister functions to the canvas for handling the game's mouse events
    canvas.on('mouse:down', function(e){
	handleMouseDownDuringGame(e);
    });

    canvas.on('mouse:up', function(e){
	handleMouseUpDuringGame(e);
    });

    canvas.on('mouse:over', function(e) {
	handleMouseOverDuringGame(e);
    });

    canvas.on('mouse:out', function(e) {
	handleMouseOutDuringGame(e);
    });

    fullGameStateRequestPending=false;//now we have handled the request
    canvas.renderAll();

});//end of function to load game data


///upon server assertion that a letter is turned over
socket.on('tile turn assert', function(tileDetailsObjStr){
    var detailsObj = JSON.parse(tileDetailsObjStr);
    var playerIndex = detailsObj.playerIndex;
    var tileID = detailsObj.tileID;
    var TargetTile = TileArray[tileID];
    var targetTileData = tileset[tileID];
    targetTileData.status="turned";//whilst the status change is immediate, the animation causes delay

    modifyTileObject(TargetTile, "flipping",{player_i:playerIndex,time:2});
    canvas.renderAll();
});

socket.on('player wants reset', function(playerName){
    var resetAssent = confirm(playerName + " has requested to reset the game. Do you want to reset the game?");
	socket.emit('agree to reset', resetAssent);	
});


//this is message to Tell me that Alex has said "Reset" - inform of another players decision
socket.on('player response to reset request', function(responseObj){
    //it would be too much to generate a prompt for each, but a toast would be good
    var abcd = JSON.parse(responseObj);
    a = abcd.playerName;
    b = abcd.response;
    
});

socket.on('give client their player index', function(myIndex){
    ClientPlayerIndex = myIndex;
    
});


socket.on('player has joined game', function(playerObjStr){
    var newPlayer = JSON.parse(playerObjStr);
    players.push(newPlayer);
    //won't necessarily need to redraw screen here, since player hasn't necessarily got words
});






function significantMovement(tile){

    var adx = Math.abs(tile.xPickup - tile.getLeft());
    var ady = Math.abs(tile.yPickup - tile.getTop()); 
    var threshold = getTileSize()*0.1;
    return (adx>threshold)||(ady>threshold);

}

function verticalMovement(tile){

    //getTop is the final position, and an a reduced Y coord (i.e. positive dy) implies upwards
    var ady = Math.abs(tile.yPickup - tile.getTop());
    var threshold = getTileSize()*1.2;
    return ady>threshold;

}


function handleMouseDownDuringGame(e) {
    if(WordCreate===undefined){WordCreate = wCreate();}
    myTileID = e.target.tileID;
    if(myTileID !== undefined){//for when a click landed on a tile...
	if(tileset[myTileID].status=="unturned"){
	    tileTurnObj = {
		playerIndex: ClientPlayerIndex,
		tileID: myTileID
	    }
	    var ObjStr = JSON.stringify(tileTurnObj);
	    socket.emit('tile turn request', ObjStr);//for an unturned tile, always message to flip
	}
	if(tileset[myTileID].status=="turned"){//click on a turned tile. Log coords of start of drag
	    e.target.xPickup=e.target.getLeft();
	    e.target.yPickup=e.target.getTop();
	    //log its old board coordinates in case it is to be returned
	    if(e.target.visual=="flipped"){
		e.target.x_availableSpace=e.target.getLeft();
		e.target.y_availableSpace=e.target.getTop();
	    }
	    //upon pickup of an active tile, add the event listener
	    // this is really only for the fresh word create case?
	    if(e.target.visual=="ACTIVE"){
		e.target.on('moving',function (o){
		    WordCreate.shuffleAnagramDrag(e.target);
		});
	    }
	}
    }

    //for handling mouse down on the row of buttons accross the top.
    GCindex = e.target.gameButtonID;
    if(GCindex!==undefined){

	recolourGameControlButtons(e.target,"press");

	if(GCindex == 0){
	    cancelWordButtonHandler();
	}

	if(GCindex == 1){
	    snatchItButtonHandler();
	}
	
	if(GCindex == 2){
	    playersLiseButtonHandler();
	}
	
	if(GCindex == 3){
	    resetGameButtonHandler();
	}
    }
}


function handleMouseUpDuringGame(e) {
    myTileID = e.target.tileID;
    if(myTileID !== undefined){//for when a mouse up landed on a tile...

	//this is for RELEASES that land on a blue tile in the free tiles area
	if(tileset[myTileID].status=="turned"){
	    if(e.target.visual=="flipped"){
		if(!significantMovement(e.target)){
		    console.log("checkpoint 1");
		    //move the tile into the ActiveGroup
		    WordCreate.addLetter(e.target);		    
		}
	    }
	    //ELSE is really important, because the first statement changes it to the second
	    //this is for RELEASES that land on active tiles...
	    else if(e.target.visual=="ACTIVE"){
		if(verticalMovement(e.target)){
		    WordCreate.removeLetter(e.target);
		}else{
		    WordCreate.shuffleAnagramRelease(e.target);
		}
		
	    }
	}
    }

    //for handling "mouse:over" on the row of buttons accross the top.
    GCindex = e.target.gameButtonID;
    if(GCindex!==undefined){
	recolourGameControlButtons(e.target,"normal");
    }
}


function handleMouseOverDuringGame(e) {

    //for handling "mouse:over" on the row of buttons accross the top.
    GCindex = e.target.gameButtonID;
    if(GCindex!==undefined){
	recolourGameControlButtons(e.target,"hover");
    }

}


function handleMouseOutDuringGame(e) {

    //for handling "mouse:out" on the row of buttons accross the top.
    GCindex = e.target.gameButtonID;
    if(GCindex!==undefined){
	recolourGameControlButtons(e.target,"normal");
    }

}




//this is a container for functions and data for Word creation (the generally yellow bit)...
wCreate = function(){
    var x_home = players[ClientPlayerIndex].saved_x_plotter;
    var y_home = players[ClientPlayerIndex].saved_y_plotter;
    var ActiveLetterSet = [];
    var nActiveLetters = 0;
    var active =false;
    var prev_DT_rdNt = 0;//previous Drag Tile's shift in tile position...

    var destDragTileIndex=0;
    var h_spacer = getTileSize() * 1.04;



    return {
	//shuffles letters horizonally, making a gap
	shuffleAnagramDrag: function(dTile){
	    var daT = dTile.activeGrpIndex;//dragging tile's index within the Active Letter Set
	    DT_dx = dTile.xPickup - dTile.get('left');
	    DT_dNt = -(DT_dx)/h_spacer;// dTile is the tile object being dragged
	    DT_rdNt = Math.round(DT_dNt);
	    //apply limitation to DT_rdNt
	    max_DT = (nActiveLetters-1)-daT;
	    min_DT = -daT;
	    DT_rdNt = Math.min(max_DT, DT_rdNt);
	    DT_rdNt = Math.max(min_DT, DT_rdNt);

	    destDragTileIndex = daT+DT_rdNt;

	    if(DT_rdNt != prev_DT_rdNt){
		
		function letterShuffler(prev_DT_rdNt, DT_rdNt){
		    pos=true;
		    console.log("transition", prev_DT_rdNt, DT_rdNt);
		    anT = Math.max(DT_rdNt, prev_DT_rdNt);
		    if(anT<=0){//tile is relatively negative to DragTile
			anT = Math.min(DT_rdNt, prev_DT_rdNt);
			pos=false;
		    }
		    
		    var animateTile = ActiveLetterSet[daT+anT];
		    
		    shiftRight = prev_DT_rdNt > DT_rdNt;
		    destC = (daT+anT)+shiftRight-pos;
		    destPx = destC*h_spacer + x_home;

		    animateTile.animate('left', destPx, {
			onChange: function() {
			    canvas.renderAll();
			},
			easing: fabric.util.ease.easeOutBounce,
			duration: 200
		    });
		}

		//these lines of code handle a transition of more than 1 tile
		//probably due to slow rendering
		Trans_inc = DT_rdNt > prev_DT_rdNt ? 1 : -1;
		var imbetweener=prev_DT_rdNt;
		while(imbetweener != DT_rdNt){
		    letterShuffler(imbetweener,imbetweener+Trans_inc);
		    imbetweener+=Trans_inc;
		}

		

		prev_DT_rdNt = DT_rdNt;

	    }
	},xhome:x_home,

	//at the end of a drag event (anagram=>no new letter added) reshuffle the array to reflect...
	shuffleAnagramRelease: function(dTile){
	    //Todo:
	    var daT = dTile.activeGrpIndex;//dragging tile's index within the Active Letter Set
	    ActiveLetterSet.move(daT,destDragTileIndex)

	    dTile.setTop(y_home);
	    destPx = destDragTileIndex * h_spacer + x_home;
	    
	    dTile.animate('left', destPx, {
		onChange: function() {
		    canvas.renderAll();
		},
		easing: fabric.util.ease.easeOutBounce,
		duration: 100
	    });

	    //make sure all the stored indecies for position in activeletter set reflect new ordering
	    for(i=0;i<nActiveLetters;i++){
		ActiveLetterSet[i].activeGrpIndex = i;
	    }
	    prev_DT_rdNt = 0;//needs reset so as not to use old data
	},

	//shuffles letters horizonally, making a gap
	shuffleInsertionDrag: function(){
	},

	//include a new letter in the ActiveLetterSet
	addLetter: function(myTile){
	    ActiveLetterSet.push(myTile);
	    console.log(ActiveLetterSet);
	    myTile.activeGrpIndex=nActiveLetters;
	    nActiveLetters++;
	    x_loco = x_home + (nActiveLetters-1) * h_spacer
	    myTile.set({
		left: x_loco,
		top: y_home
	    });
	    canvas.remove(myTile);
	    canvas.add(myTile);
	    console.log(myTile);
	    modifyTileObject(myTile,"ACTIVE");
	},


	//remove a letter from the ActiveLetterSet
	removeLetter: function(myTile){

	    nActiveLetters--;

	    //TODO: must remove it from the arry ACTIVELETTERSET 
	    ActiveLetterSet.splice(myTile.activeGrpIndex,1);
	    myTile.activeGrpIndex=undefined;//it no longer has such an index.

	    //make sure all the stored indecies for position in activeletter reflect removal    
	    for(i=0;i<nActiveLetters;i++){
		ActiveLetterSet[i].activeGrpIndex = i;
		ActiveLetterSet[i].setLeft(x_home+i*h_spacer);
		//whenever namually changing tile coordinates, must do this to update drag zone
		canvas.remove(ActiveLetterSet[i]);
		canvas.add(ActiveLetterSet[i]);
	    }


	    //remove the event listener for that tile...
	    myTile.off('moving');

	    //move the tile to be removed back to wherever it was before
	    myTile.set({
		left: myTile.x_availableSpace,
		top: myTile.y_availableSpace
	    });
	    //whenever namually changing tile coordinates, must do this to update drag zone
	    canvas.remove(myTile);
	    canvas.add(myTile);


	    modifyTileObject(myTile,"flipped");

	},


	//send a candidate word to the server
	SubmitWord: function(){
	    
	    var myWord_tileIndeces = [];

	    for(i=0; i<nActiveLetters; i++){
		//take the tile's actual ID
		myTile = ActiveLetterSet[i];
		myWord_tileIndeces[i] = myTile.tileID;
		//this tile is no longer in the active group
		myTile.activeGrpIndex=undefined;
		myTile.off('moving');
		//graphically remove tile

	    	modifyTileObject(myTile,"flipped");//do we need this here?
		//I think if we just rerender the screen, its incorrect...
	    }

  
	    //finally, reset the data objects of the WordCreate class.
	    x_home = players[ClientPlayerIndex].saved_x_plotter;
	    y_home = players[ClientPlayerIndex].saved_y_plotter;
	    ActiveLetterSet = [];
	    nActiveLetters = 0;
	    active =false;
	    prev_DT_rdNt = 0;//previous Drag Tile's shift in tile position...
	    
	    socket.emit('player submits word', JSON.stringify(myWord_tileIndeces));

	},

	//cancel word
	CancelWord: function(){
	    
	    var myWord_tileIndeces = [];

	    for(i=0; i<nActiveLetters; i++){
		myTile = ActiveLetterSet[i];
		//logically remove tile
		myTile.activeGrpIndex=undefined;
		myTile.off('moving');
		//graphically remove tile
		myTile.set({
		    left: myTile.x_availableSpace,
		    top: myTile.y_availableSpace
		});
		canvas.remove(myTile);
		canvas.add(myTile);
	    	modifyTileObject(myTile,"flipped");//do we need this here?
	    }

	    //reset the data objects of the WordCreate class.
	    x_home = players[ClientPlayerIndex].saved_x_plotter;
	    y_home = players[ClientPlayerIndex].saved_y_plotter;
	    ActiveLetterSet = [];
	    nActiveLetters = 0;
	    active =false;
	    prev_DT_rdNt = 0;//previous Drag Tile's shift in tile position...
	    
	},


	//server accepted the candidate word, mutate the client side data and display...
	wordAccepted: function(){
	    active = false;
	}
    }
}














var tileSize=null;
//this function relies upon a defined number of tiles, which is only after game state is loaded...
function getTileSize(){
    if(!tileSize){
	var N_pixels = myZoneWidth * myZoneHeight;
	var Tile_pixels = N_pixels * Ratio_tile / N_tiles;
	var tile_dim = Math.sqrt(Tile_pixels);
	var tileSize = Math.round(tile_dim);
	
    }
    return tileSize;
}




function loadTilesOntoCanvas(tileset){

    //calculation to determine tile_DIM, the tile size in pixels

    var tile_DIM = getTileSize();
    var letter_spacing = 0.14;

    //parameters controlling tile spacing in the tile grid
    var tile_space_px = tile_DIM * letter_spacing;
    var XPD=6;
    var x_plotter = XPD;
    var y_plotter = 6 + tile_DIM + tile_space_px;

    //now create a fabric object for every tile...
    for (i=0; i<tileset.length; i++){
	var myTile = generateTileObject(tileset[i],i,tile_DIM);
	myTile.set({top:y_plotter,left:x_plotter});
	if(tileset[i].status=="turned"){modifyTileObject(myTile,"flipped");}
	if(tileset[i].status=="inword"){modifyTileObject(myTile,"flipped");}
	TileArray[i]=myTile;
	canvas.add(myTile);

	//modify the plot coordinates, ready to place the next tile alongside...
	x_plotter += tile_space_px + tile_DIM;

	//rule to wrap around at end of line:
	if(x_plotter+tile_space_px+tile_DIM>myZoneWidth){
	    x_plotter=XPD;
	    y_plotter += tile_space_px + tile_DIM;
	}
    }

    //handles the case of a full bottom line of tiles...
    return y_plotter + (x_plotter==XPD ? 0 :  tile_space_px + tile_DIM);
}




function generateTileObject(myTile,myTileID,size_factor){

    //extract the key data from the passed object:
    var myStatus = myTile.status;
    var myLetter = myTile.letter;
    //if(myStatus=='unturned'){myLetter='';}//hacky way of illustrating unturned letters


    //parameter controlling the proportions of the tiles (boarder, font size)
    var tile_letter_prop = 0.9;
    var tile_stroke_prop = 0.06;

    var tile_letter = new fabric.Text("",{
	originX: 'center',
	top: -size_factor/2,
	fill: 'yellow',
	fontWeight: 'bold',
	fontSize: tile_letter_prop*size_factor,
	selectable: false
    });

    var tile_bg = new fabric.Rect({
	originX: 'center',
	originY: 'center',
	fill: 'rgb(54,161,235)',
	stroke: '#999',
	strokeWidth: size_factor*tile_stroke_prop,
	width: size_factor,
	height: size_factor,
	rx: 0.12*size_factor,
	ry: 0.12*size_factor
    });

    var tile_grp = new fabric.Group( [tile_bg, tile_letter], {
	hasControls: false,
	hasBorders: false,
	selectable: false
    });

    tile_grp.tileID=myTileID;
    tile_grp.letter=myLetter;
    tile_grp.visual="facedown";

    return tile_grp;
}

function modifyTileObject(myTile,toState,options){
    myTile.visual = toState;
    if(toState=="flipping"){//this will animate the tile...

	pl_col = players[options.player_i].color;
	function animateCountDown(hs){
	    // variable 'hs' is number of quarter-seconds remaining
	    if (hs%2){
		myTile.item(0).setStroke(pl_col);
	    }else{
		myTile.item(0).setStroke(bg_col);
	    }
	    canvas.renderAll();
	    var hs2 = hs-1;
	    if(hs2){
		setTimeout(function(){animateCountDown(hs2);},125);
	    }else{
		modifyTileObject(myTile,"flipped");
	    }
	}
	animateCountDown(8*options.time);
    }
    if(toState=="flipped"){//only to be called from within the function
	myTile.item(1).setFill('yellow');
	myTile.item(0).setFill('rgb(54,161,235)');
	myTile.item(1).setText(myTile.letter);
	myTile.item(0).setStroke('#666');
	myTile.set({selectable:true});
	canvas.renderAll();
    }
    if(toState=="ACTIVE"){
    	console.log("checkpoint 5");

	myTile.item(1).setFill('red');
	myTile.item(0).setFill('yellow');
	canvas.renderAll();

    }

}























marginUnit = null;
textMarginUnit = null;
top_px = null;
stroke_px = null;

function calculatePlayerZoneSizes(players){
    nPlayers = players.length;
    nLettersPlayer = [];
    nLettersTotPlayed = 0;
    
    //count the number of letters each player has, and total letters used within words
    for(i=0; i<nPlayers; i++){
	nLettersPlayer[i] = 0;
	for(j=0; j<players[i].words.length; j++){
	    nLettersPlayer[i] += players[i].words[j].length;
	}
	nLettersTotPlayed += nLettersPlayer[i];
    }

    //determine total amount of height contained within players' zone boxes
    section_height = myZoneHeight - top_px;
    zones_sum_height = section_height - nPlayers * stroke_px - (nPlayers-1)*textMarginUnit - marginUnit;
    basic_height = getTileSize() + 4*marginUnit;
    shareable_height = zones_sum_height - nPlayers * basic_height;

    zoneHeightPlayer = [];
    for(i=0; i<nPlayers; i++){
	//now, we don't want to go dividing by zero if it's a new game with nothing played!!
	var hRatio = 0;
	if(nLettersTotPlayed){
	    hRatio = nLettersPlayer[i]/nLettersTotPlayed;
	}else{
	    hRatio = 1 / nPlayers;
	}

	zoneHeightPlayer[i] = basic_height + Math.round( hRatio * shareable_height );
    }

    return zoneHeightPlayer;
}



function drawPlayerZoneBox(myplayer, mytop, myheight){

    var zoneBox = new fabric.Rect({
	left: marginUnit,
	top: mytop,
	fill: bg_col,
	stroke: myplayer.color,
	strokeWidth: stroke_px,
	width: myZoneWidth-2*marginUnit-stroke_px,
	height: myheight,
    });

    var plrName = new fabric.Text(myplayer.name,{
	left: 4*marginUnit,
	top: mytop - textMarginUnit,
	fontSize: 2*textMarginUnit,
	textBackgroundColor: bg_col,
	fill: myplayer.color,
    });

    var plrZone = new fabric.Group([zoneBox,plrName],{
	hasControls: false,
	hasBorders: false,
	lockMovementX: true,
	lockMovementY: true
    });

    canvas.sendToBack(plrZone);
}

// for example player.words : [[23,14,11],[44,12,13,19,4]]
function drawPlayerWords(myplayer, mytop){
    var h_space_word = getTileSize() * 0.6;
    var h_spacer = getTileSize() * 1.04;
    var v_spacer = getTileSize() * 1.12;
    var x_plotter_R = 2*marginUnit;
    var x_plotter = x_plotter_R;
    var y_plotter = mytop + 1.8*marginUnit;
    for (i=0; i<myplayer.words.length; i++){
	var lettersOfThisWord = [];
	for (j=0; j<myplayer.words[i].length; j++){
	    var thisLetterIndex = myplayer.words[i][j];
	    var thisTile = TileArray[thisLetterIndex];
	    //move the relevant tile (already existing on the canvas) to location...
	    thisTile.set({
		left: x_plotter,
		top: y_plotter
	    });
	    
	    canvas.remove(thisTile);
	    modifyTileObject(thisTile,"flipped");//TODO: delete this line of code it should not be required.

	    lettersOfThisWord[j]=thisTile;
	    
	    x_plotter += h_spacer;
	}

	//at a completion of the inner loop, a word has just been drawn on canvas
	var PlayerWordGRP = new fabric.Group( lettersOfThisWord, {
	    hasControls: false,
	    hasBorders: false
	});
	
	canvas.add(PlayerWordGRP);
	x_plotter+=h_space_word;
	
	//word wrap handler
	//first check if the player has more words...
	var upcomingWord = myplayer.words[i+1]; 
	if(upcomingWord){
	    if(x_plotter+(h_spacer*upcomingWord.length)>myZoneWidth - marginUnit){
		y_plotter+= v_spacer;
		x_plotter=x_plotter_R;
	    }
	}
    }
    myplayer.saved_x_plotter = x_plotter;
    myplayer.saved_y_plotter = y_plotter;
}

function drawEntirePlayerZone(){

    if(!marginUnit){marginUnit = getTileSize()*0.13;}
    if(!textMarginUnit){textMarginUnit=getTileSize()*0.2;}
    if(!top_px){top_px=Math.round(tiles_bottom_px) + marginUnit;}
    if(!stroke_px){stroke_px=Math.round(marginUnit*0.5);}

    var heights_px = calculatePlayerZoneSizes(players);
    var plr_top_cumulator = top_px;
    
    for (aa=0; aa<players.length; aa++){
	drawPlayerZoneBox(players[aa],plr_top_cumulator,heights_px[aa]);
	drawPlayerWords(players[aa],plr_top_cumulator);
	plr_top_cumulator += heights_px[aa] + textMarginUnit + stroke_px;

    }
}

















function gameMessage(message,size,text_color){
    
    toastText = new fabric.Text('null text', {
	textAlign: 'center',
	fontWeight: 'bold',
	borderColor: 'rgb(0,70,70)',
	//	shadow: '#676 -5px -5px 3px',
    });


    toastText.set({
	text:message,
	fontSize:size,
	fill: text_color
    });

    //this needs to be a separate, later function call, since the first one alters the size...
    toastText.set({
	left: (canvas.getWidth() - toastText.getWidth()) / 2,
	top: (canvas.getHeight() - toastText.getHeight()) / 2,
    });

    canvas.add(toastText);
    canvas.renderAll();
    return (function(){canvas.remove(toastText);});
}


Array.prototype.move = function (old_index, new_index) {
    if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
};


//});
