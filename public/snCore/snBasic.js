snCore.Basic = {

    //member variables (native types)
    //todo: either delete this non-global data or replace all the global references in the code with this
    canv_W: undefined,
    canv_H: undefined,

    frameperiod_measured: undefined,
    
    //for animation
    FrameTargetsArray: [],

    //define animation styles data here...
    ani: {
	sty_BBshrink: {
	    easing: fabric.util.ease.easeOutCubic,
	    duration: 400
	},
	sty_Anag: {
	    easing: fabric.util.ease.easeOutBounce,
	    duration: 150
	},
	sty_Sing: {
	    easing: fabric.util.ease.easeOutQuart,
	    duration: 350
	},
	sty_Resize: {
	    easing: fabric.util.ease.easeInOutCubic,
	    duration: 1500
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

    makeCanvasFitWholeWindow: function(){
	//take the window dimentions at time of page load, and use these to draw on
	// the screen of the device at the correct scaling
	this.canv_W = window.innerWidth;
	this.canv_H = window.innerHeight;
	canvas.setWidth(this.canv_W);
	canvas.setHeight(this.canv_H);
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
	    window.requestAnimationFrame(function(){snCore.Basic.startScreenFrameDrawing();});
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
	this.nAnimations++;//v. important to call this before, or the chain may not kick off...
	if(!this.animation_frame_requests_exist){
	    this.startScreenFrameDrawing();
	}
    },

    animation_completed: function(){
	this.nAnimations--;
    },

/*
Parameters:

animate_onComplete
 - if it is a function, this function is called upon completion of the animation
 - if it is boolean TRUE, use animation (but with no custom callback upon competion)
 - if it boolean FALSE, do not use animation, just place it..

animation_style
 - object to define the duration and easing of the animation...

*/
    moveSwitchable: function(FabricObject, animate_onComplete, animation_style, properties){
	var my_onComplete = undefined;

	if(typeof(animate_onComplete)=='function'){//a custom on-complete function has been supplied
	    my_onComplete = function(){
		animate_onComplete();
		snCore.Basic.animation_completed();
	    };
	}else if(animate_onComplete === true){
	    my_onComplete = function(){
		snCore.Basic.animation_completed();
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
	    snCore.Basic.more_animation_frames_at_least(3);//as an alternative to canvas.renderAll()
	}
    },

    unGroupAndPlaceSingly: function (markedFabricGrp){
	// a 'markedFabricGrp' is a Fabric group where all of the _objects have a 'relObjCoords' member
	var Objs = markedFabricGrp._objects;
	var separates = [];
	for (var i = Objs.length-1; i >= 0; i--){
	    var take_o = Objs[i];
	    markedFabricGrp.remove(take_o);
	    take_o.set({
		left: (take_o.relObjCoords.x + markedFabricGrp.grpCoords.x),
		top: (take_o.relObjCoords.y + markedFabricGrp.grpCoords.y)
	    });
	    canvas.add(take_o);
	    separates[i] = take_o;
	}
	canvas.renderAll();
	return separates;
    }
};
