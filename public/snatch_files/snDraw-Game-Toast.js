snDraw.Game.Toast = {

    // a note about players[i].saved_x_plotter // TODO write the note...
    n_toasts: 0,
    toast_heights: [],
    ABC: 0,

    newMessage: function(){
	canvas.add(myGroup);
	canvas.renderAll();
    },

    createToastObj: function(){
	var DIM = snDraw.Game.tileSize * 1.35;
	var stroke_px = DIM * 0.1;
	var myZoneSmaller = Math.min(myZoneWidth,myZoneHeight); 
	var font_size =  myZoneSmaller * 0.030;

	var toast_width = myZoneSmaller*0.8;

	var ToastBox = new fabric.Rect({
	    width: toast_width,
	    height: myZoneHeight - DIM * 0.7,
	    fill: '#AAA',
	    stroke: snDraw.Game.fg_col,
	    strokeWidth: stroke_px,
	    rx: DIM * 0.18,
	    ry: DIM * 0.18
	});

	var ToastText = new fabric.Text("Players listing and scores",{
	    left: windowWidth * 0.105,
	    top: DIM * 0.3,
	    fill: 'black',
	    fontWeight: 'bold',
	    fontSize: font_size * 1.85
	});

	var ToastObj = new fabric.Group( objects, {
	    hasControls: false,
	    hasBorders: false,
	    selectable: false,
	    top: DIM * 0.3,
	    left: (myZoneWidth - windowWidth)/2
	});


    }
    removeTopMessage: function(){

    },
    spareFunction: function(){

    },
}
