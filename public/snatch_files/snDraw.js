//this is all drawing stuff, common to the entire mini App

var canvas = undefined;//OK let's at least keep the canvas object as a global...

var snDraw = {

    //member variables (native types)
    //todo: either delete this non-global data or replace all the global references in the code with this
    myZoneWidth: undefined,
    myZoneHeight: undefined,

    frameperiod_measured: undefined,
    


    //for animation
    FrameTargetsArray: [],

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

    measureFramePeriod: function(){
	var completion_flag = false;
	snDraw.more_animation_frames_at_least(3);// this sets animation going. It is sustained by the non-empty FrameTargetsArray
	snDraw.FrameTargetsArray.push({
	    framesCount: 0,
	    d_start: undefined,

	    frame: function(){
		if(this.d_start===undefined){
		    this.d_start = new Date();
		    setTimeout(function(){completion_flag = true;}, 500); //measure the framerate over a 0.5 second period
		}else{//think of the fence bars and posts problem. The first post can be excluded in the count
		    this.framesCount++;
		}
		if(completion_flag){
		    var d_end = new Date();
		    snDraw.frameperiod_measured = (d_end.getTime() - this.d_start.getTime())/this.framesCount;
		    return true;
		}
		return false;
	    }
	});
    },

    animation_frame_requests_exist: false,
    nAnimations: 0,
    literal_frame_countdown: 0,
    startScreenFrameDrawing: function(){
	this.animation_frame_requests_exist = false;
	
	this.literal_frame_countdown--;
	// custom animation processing (locked to frame rate)
	for (var i=0; i<this.FrameTargetsArray.length; i++){
	    var complete = this.FrameTargetsArray[i].frame();
	    if (complete){
		this.FrameTargetsArray.splice(i,1);
	    }
	}
	canvas.renderAll();

	if((this.FrameTargetsArray.length>0)||(this.nAnimations>0)||(this.literal_frame_countdown>0)){
	    //this may not guarentee a recursive call, which may cause animation bugs where frames aren't drawn?
	    window.requestAnimationFrame(function(){snDraw.startScreenFrameDrawing();});
	    this.animation_frame_requests_exist = true;
	}
    },

    more_animation_frames_at_least: function(N){
	this.literal_frame_countdown = Math.max(this.literal_frame_countdown, N);
	if(!this.animation_frame_requests_exist){
	    this.startScreenFrameDrawing();
	}
    },

    animation_started: function(){
	if(!this.animation_frame_requests_exist){
	    this.startScreenFrameDrawing();
	}
	this.nAnimations++;
    },

    animation_completed: function(){
	this.nAnimations--;
    },

    moveSwitchable: function(FabricObject,animate_onComplete,animation_style,properties){
	var my_onComplete = undefined;

	if(typeof(animate_onComplete)=='function'){//a custom on-complete function has been supplied
	    my_onComplete = function(){
		animate_onComplete();
		snDraw.animation_completed();
	    };
	}else if(animate_onComplete === true){
	    my_onComplete = function(){
		snDraw.animation_completed();
	    };
	}

	if(my_onComplete !== undefined){//this means animation was requested
	    var animation_style_with_onComplete = jQuery.extend( {onComplete: my_onComplete}, animation_style);
	    FabricObject.animate(properties, animation_style_with_onComplete);
	    this.animation_started();
	}else{//this means movement without animation
	    FabricObject.set(properties);
	    //these two lines are the trick for ensuring click detection zones are moved...
	    canvas.remove(FabricObject);
	    canvas.add(FabricObject);
	    snDraw.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
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
