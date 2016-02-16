//this is all drawing stuff, common to the entire mini App

var canvas = undefined;//OK let's at least keep the canvas object as a global...

var snDraw = {

    //member variables (native types)
    myZoneWidth: undefined,
    myZoneHeight: undefined,

    //for animation
    frame_rate: 1000/60,//60 frames per second
    remaining_animation_time: 0,

    //define animation styles data here...
    ani: {
	sty_Anag: {
	    easing: fabric.util.ease.easeOutBounce,
	    duration: 150
	},
	sty_Sing: {
	    easing: fabric.util.ease.easeOutQuart,
	    duration: 200
	},
	sty_Bloc: {
	    easing: fabric.util.ease.easeOutQuart,
	    duration: 400
	},
    },
    
    //methods
    initialiseCanvas: function(){
	// Obtain a canvas drawing surface from fabric.js
	canvas = new fabric.Canvas('c');
	
	//take the window dimentions at time of page load, and use these to draw on
	// the screen of the device at the correct scaling
	myZoneWidth = window.innerWidth-20;
	myZoneHeight = window.innerHeight-20;
	canvas.setHeight(myZoneHeight);
	canvas.setWidth(myZoneWidth);

	//we don't want to select a group of objects with the mouse
	canvas.selection = false;
	//speedup?
	canvas.renderOnAddRemove = false;
	canvas.stateful = false;
	this.startScreenFrameDrawing();
    },

    startScreenFrameDrawing: function(){
	canvas.renderAll();
	window.requestAnimationFrame(function(){snDraw.startScreenFrameDrawing();});
    },

    gameMessage: function (message,size,text_color){
	
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
    }
};
