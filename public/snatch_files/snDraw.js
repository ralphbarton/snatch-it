//this is all drawing stuff, common to the entire mini App

var canvas = undefined;//OK let's at least keep the canvas object as a global...

var snDraw = {

    //member variables (native types)
    myZoneWidth: undefined,
    myZoneHeight: undefined,

    //for animation
    AnimationFunction: [],

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
	sty_Resize: {
	    easing: fabric.util.ease.easeInOutCubic,
	    duration: 1000
	},
	sty_Boot: {
	    easing: fabric.util.ease.easeInCubic,
	    duration: 1000
	},
	sty_Join: {
	    easing: fabric.util.ease.easeOutCubic,
	    duration: 1000
	}
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
    },

    frame_rendering_timeout: undefined,
    setFrameRenderingTimeout: function(duration){
	var already_running = this.frame_rendering_timeout !== undefined;
	if(already_running){
	    clearTimeout(this.frame_rendering_timeout);
	}
	this.frame_rendering_timeout = setTimeout(function(){snDraw.frame_rendering_timeout = undefined;}, duration*4);//fudge factor
	if(!already_running){
	    this.startScreenFrameDrawing();//this ensures another chain of recusive function calls will not happen but timeout can still be adjusted.
	}
    },

    startScreenFrameDrawing: function(){

	//this extra bit is for my custom animation processing...
	for (var i=0; i<this.AnimationFunction.length; i++){
	    var complete = this.AnimationFunction[i].frame();
	    if (complete){
		this.AnimationFunction.splice(i,1);
	    }
	}
	if(this.frame_rendering_timeout!==undefined){
	    canvas.renderAll();
	    window.requestAnimationFrame(function(){snDraw.startScreenFrameDrawing();});
	}
    },

    moveSwitchable: function(FabricObject,animate,animation_style,properties){
	if(animate){
	    FabricObject.animate(properties, animation_style);
	    this.setFrameRenderingTimeout(animation_style.duration);
	}
	else{
	    FabricObject.set(properties);
	    canvas.renderAll();
	}
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
