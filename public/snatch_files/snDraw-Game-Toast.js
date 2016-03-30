snDraw.Game.Toast = {

    bottomPx: undefined,
    ToastArray: [],

    boundDimention: function(value, px_total, frac){
	if(frac.max != undefined){
	    value = Math.min(value, frac.max * px_total);
	}
	if(frac.min != undefined){
	    value = Math.max(value, frac.min * px_total);
	}
	return value
    },

    showToast: function(my_string){
	
	var CP = players[client_player_index];
	var DIM = snDraw.Game.tileSize;
	var no_words = CP.words.length == 0;

	var toast_top = CP.y_next_word + (no_words ? 0 : snDraw.Game.v_spacer + DIM * 0.25) + DIM * 0.25;
	var toast_width = this.boundDimention(DIM * 8, snDraw.canv_W, {min: 0.6, max: 0.9});
	var toast_left = (snDraw.canv_W - toast_width)/2;
	var toast_height = DIM * 0.8;

	//temporary
	if(this.bottomPx == undefined){
	    this.bottomPx = toast_top;
	}

	var ToastText_raw = new fabric.Text(my_string, {
	    left: toast_left + DIM * 0.3,
	    top: this.bottomPx + DIM * 0.1,//hack
	    width: toast_width - DIM * 0.6,
	    fill: 'rgba(255,255,255,0.7)',
	    fontSize: DIM * 0.42
	});
	var ToastText = wrapCanvasText(ToastText_raw, canvas, toast_width - DIM * 0.6, DIM * 2, 'left');

	var ToastBox = new fabric.Rect({
	    left: toast_left,
	    top: this.bottomPx,//hack
	    width: toast_width,
	    height: ToastText.getHeight() + + DIM * 0.2,
	    fill: 'rgba(0,0,192,0.5)',
	    rx: DIM * 0.4,
	    ry: DIM * 0.4,
	    shadow: 'rgba(100,0,0,0.2) 5px 10px 7px'
	});
	
	var objects = [ToastBox, ToastText];

	var ToastObj = new fabric.Group( objects, {
	    hasControls: false,
	    hasBorders: false,
	    selectable: false
	});

	this.bottomPx += 1.1 * toast_height;
	var toast_duration = 6000;
	setTimeout(function(){
	    canvas.remove(ToastObj);
	    canvas.renderAll();
	}, toast_duration);

	canvas.add(ToastObj);
	canvas.renderAll();

    }
}
