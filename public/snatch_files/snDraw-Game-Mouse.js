
snDraw.Game.Mouse = {
    
    mDown: function (e) {
	myTileID = e.target.tileID;
	if(myTileID !== undefined){//for when a click landed on a tile...
	    if(tileset[myTileID].status=="unturned"){
		tileTurnObj = {
		    playerIndex: client_player_index,
		    tileID: myTileID
		}
		var ObjStr = JSON.stringify(tileTurnObj);
		TILE_TURN_REQUEST(ObjStr);//for an unturned tile, always message to flip
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
			snDraw.Game.Spell.shuffleAnagramDrag(e.target);
		    });
		}
	    }
	}


	//it's important this comes before the button handlers, or the window will get drawn then removed.
	if(snDraw.Game.Controls.playersListWindowVisible){
	    snDraw.Game.Controls.removePlayersListWindow();
	}

	//for handling mouse down on the row of buttons accross the top.
	GCindex = e.target.gameButtonID;
	if(GCindex!==undefined){

	    snDraw.Game.Controls.buttonRecolor(e.target,"press");

	    if(GCindex == 0){
		snDraw.Game.Controls.cancelWordButtonHandler();
	    }

	    if(GCindex == 1){
		snDraw.Game.Controls.snatchItButtonHandler();
	    }
	    
	    if(GCindex == 2){
		snDraw.Game.Controls.playersListButtonHandler();
	    }
	    
	    if(GCindex == 3){
		snDraw.Game.Controls.resetGameButtonHandler();
	    }
	}

    },

    mUp: function (e) {
	myTileID = e.target.tileID;
	if(myTileID !== undefined){//for when a mouse up landed on a tile...

	    //this is for RELEASES that land on a blue tile in the free tiles area
	    if(tileset[myTileID].status=="turned"){
		if(e.target.visual=="flipped"){
		    if(!this.significantMovement(e.target)){
			//move the tile into the ActiveGroup
			snDraw.Game.Spell.addLetter(e.target);		    
		    }
		}
		//ELSE is really important, because the first statement changes it to the second
		//this is for RELEASES that land on active tiles...
		else if(e.target.visual=="ACTIVE"){
		    if(this.verticalMovement(e.target)){
			snDraw.Game.Spell.removeLetter(e.target);
		    }else{
			snDraw.Game.Spell.shuffleAnagramRelease(e.target);
		    }
		    
		}
	    }
	}

	//for handling "mouse:over" on the row of buttons accross the top.
	GCindex = e.target.gameButtonID;
	if(GCindex!==undefined){
	    snDraw.Game.Controls.buttonRecolor(e.target,"normal");
	}
    },

    mOver: function (e) {

	//for handling "mouse:over" on the row of buttons accross the top.
	GCindex = e.target.gameButtonID;
	if(GCindex!==undefined){
	    snDraw.Game.Controls.buttonRecolor(e.target,"hover");
	}

    },

    mOut: function (e) {

	//for handling "mouse:out" on the row of buttons accross the top.
	GCindex = e.target.gameButtonID;
	if(GCindex!==undefined){
	    snDraw.Game.Controls.buttonRecolor(e.target,"normal");
	}

    },


    significantMovement: function(tile){

	var adx = Math.abs(tile.xPickup - tile.getLeft());
	var ady = Math.abs(tile.yPickup - tile.getTop()); 
	var threshold = snDraw.Game.tileSize * 0.1;
	return (adx>threshold)||(ady>threshold);

    },

    verticalMovement: function(tile){

	//getTop is the final position, and an a reduced Y coord (i.e. positive dy) implies upwards
	var ady = Math.abs(tile.yPickup - tile.getTop());
	var threshold = snDraw.Game.tileSize * 1.2;
	return ady>threshold;

    }


};
