snCore.Keyboard = {
    
    secretCode: "99FROGS99",
    codeCounter: 0,

    secretCode2: "99FROGS88",
    codeCounter2: 0,

    secretCode3: "99FROGS77",
    codeCounter3: 0,

    kDown: function (e) {
	var myKeycode = e.keyCode;
	var keyPressed = String.fromCharCode(myKeycode);//note that this is non-case sensitive.

	//this design only handles one code but could easily be modified for more.
	if(keyPressed == this.secretCode[this.codeCounter]){
	    this.codeCounter++;
	    if(this.codeCounter == this.secretCode.length){
		//the whole code was entered!!
		alert("TOAST: You typed the secret code to enter developement mode\nEnjoy the faster tile flips for you only!\nDev mode " + (!dev ? "ON" : "OFF"));
		dev = !dev;
		this.codeCounter = 0;
	    }
	}else{
	    this.codeCounter = 0;
	}


	//this design only handles one code but could easily be modified for more.
	//note how the easy modification used here has been the copying and pasting of code.
	//TODO. if any more codes are to be used, do it a bit better than this, please...
	if(keyPressed == this.secretCode2[this.codeCounter2]){
	    this.codeCounter2++;
	    if(this.codeCounter2 == this.secretCode2.length){
		var qty = 96;
		//the whole code was entered!!
		snCore.Toast.showToast("Secret code entered shall now flip "+qty+" tiles");
		TURN_MANY_TILES(qty);
		this.codeCounter2 = 0;
	    }
	}else{
	    this.codeCounter2 = 0;
	}

	//this design only handles one code but could easily be modified for more.
	//note how the easy modification used here has been the copying and pasting of code.
	//TODO. if any more codes are to be used, do it a bit better than this, please...
	// note that plee above has herby been disregarded.
	if(keyPressed == this.secretCode3[this.codeCounter3]){
	    this.codeCounter3++;
	    if(this.codeCounter3 == this.secretCode3.length){
		snCore.Toast.showToast("This game has uID = " + db_uID);

		this.codeCounter3 = 0;
	    }
	}else{
	    this.codeCounter3 = 0;
	}





	//Keystroke is a user-active event. Clear Persistent Toasts
	snCore.Toast.clear_all_persistent();


	if(snCore.Popup.popup_in_foreground){
	    if((snCore.Popup.popup_in_foreground == "rules")||(snCore.Popup.popup_in_foreground == "stats")){
		var flkty_foreground = (snCore.Popup.popup_in_foreground == "rules")?flkty_rules:flkty_stats;
		if(myKeycode == 37){//left
		    flkty_foreground.previous();
		}else if(myKeycode == 39){//right
		    flkty_foreground.next();
		}else{
		    snCore.Popup.hideModal();
		}
	    }else{
		//the two popup checked for are the "unclosable" ones...
		if((snCore.Popup.popup_in_foreground != "connection")&&(snCore.Popup.popup_in_foreground != "connection_1min")){
		    snCore.Popup.hideModal();
		}
	    }

	}else{
	    if( (myKeycode >= 65) && (myKeycode <= 90) ){//any letter key
		snCore.DefineWord.KPicker_cycler('clear');
		snCore.Spell.addLetter(keyPressed); 
	    }

	    if(myKeycode == 32){//space bar
		snCore.Controls.turnLetterClickHandler();
	    }

	    if((myKeycode == 8)||(keyPressed == '5')){//delete key
		// let this be remove the final letter of the spell (if present)
		snCore.Spell.removeLetter();
	    }

	    if((myKeycode == 13)||(keyPressed == '3')){//enter key
		// let this be submit word
		snCore.Spell.SubmitWord();
	    }

	    if((myKeycode == 27)||(keyPressed == '1')){//escape key or number 1
		// let this be cancel word
		snCore.Spell.CancelWord();
		//also removes score window if present...
		snCore.Popup.hideModal();
		//also removes all Toasts with immediate effect
		snCore.Toast.clear_all();
		//also remove the keyboard-based picker to define a word
		snCore.DefineWord.KPicker_cycler('clear');

		//also, (and really just as an alternative for fixing display bugs at the root) let this redraw all.
		snCore.Event.DrawAll();
	    }

	    if(keyPressed == '2'){
		snCore.Controls.turnLetterClickHandler();
	    }

	    if(keyPressed == '4'){
		snCore.Popup.openModal("scores");
	    }

	    if(keyPressed == '6'){
		// let this cycle through words
		snCore.DefineWord.KPicker_cycler('cycle');
	    }

	    if(keyPressed == '7'){
		// no action, but keep in reserve for testing...
	    }

	    if(keyPressed == '8'){
		// no action, but keep in reserve for testing...
	    }


	    /*
	      if(myKeycode == 16){//shift key
	      
	      }

	      if(myKeycode == 17){//control key
	      
	      }
	    */
	}
    }
};
