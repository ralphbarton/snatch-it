snCore.Popup = {

    //Properties of this class...
    popup_in_foreground: false,

    //Methods of this class...
    
    calcModalScale: function(){
	
	//things that scale with the Tile Size
	var ts = Math.round(snCore.Tile.stdDimention);
	var cr = ts * 0.30; // corner radius
	var fsz = ts * 0.50; // master font size

	//set style properties that depend on tile size...
	$("#modal_dark_sheet").css("font-size", fsz+"px");
	$("#modal-content").css("border-radius", cr+"px");
	$("#modal-header").css("border-radius", cr+"px "+cr+"px 0 0");
	$("#modal-footer").css("border-radius", "0 0 "+cr+"px "+cr+"px");
	$("#modal-body").css("max-height", snCore.Basic.canv_H * 0.8+"px");

	//change the scale associated with those words with a black haze.
	$('.blacken').css({"text-shadow":"0px 0px "+fsz*0.05+"px black, 0px 0px "+fsz*0.1+"px black"});
    },

    generate_scores_table_html_element: function(){

	// 1. Generate an Array representing Ranked players' scores
	var player_scores_list = [];
	for(var i = 0; i < players.length; i++){
	    // 1.1 Calculate the score
	    var player_i_score = 0;
	    for(var j = 0; j < players[i].words.length; j++){
		player_i_score += Math.max(1,players[i].words[j].length-2);
	    }
	    // 1.2 push into array
	    player_scores_list.push({
		p_index: i,
		score: player_i_score
	    });
	}

	// 1.3 put into descending order..
	function comparePlayers(a, b) {
	    return a.score - b.score;
	}
	player_scores_list.sort(comparePlayers);
	player_scores_list.reverse();

	// 2. Generate an HTML element for the scores data
	
	// 2.1 Generate the shell
	var table_shell = $("<table />").append(
	    $("<tr />").append(
		$("<th />").addClass("scores scores-underline").html("Name"),
		$("<th />").addClass("scores scores-underline").html("Score")
	    )
	);

	// 2.2 Generate the content
	var psl_length = player_scores_list.length;
	// these variables need to be outside the map operation... (is this hacky from a functional programming point of view?)
	var rank_counter = 0;
	var n_highlight = 0;

	// Apply a 'map' function to the ordered list of players, for a list of HTML 'row' objects...
	var rows_of_players = player_scores_list.map(function(PSL_i){// objects are {p_index: 0, score: 0}
	    rank_counter++;
	    var lastR = rank_counter >= psl_length;
	    var Plr = players[PSL_i.p_index];
	    var incl_me = snCore.Event.game_ended ? Plr.was_connected_at_completion : (!Plr.is_disconnected);
	    var highlight = (n_highlight < 3) && incl_me;
	    if(highlight){n_highlight++;}

	    return $("<tr />").append(
		$("<td />").addClass("scores pl-name" + (lastR ? "" : " scores-underline"))
		    .html(rank_counter + ". " + Plr.name),

		$("<td />").addClass("scores pl-score" + (highlight ? " blacken":"")+ (lastR ? "" : " scores-underline"))
		    .html(PSL_i.score.toString())
		    .css({
			"font-weight": (highlight ? 800:100),
			"color": (highlight ? Plr.color : 'black')
		    })
	    );
	});

	return table_shell.append(rows_of_players);
    },

    modal_content_updater_timeout: undefined,
    myChart: undefined,
    openModal: function(type){
	var Title = "my Title";
	var Body = "my content id";
	var Footer = "my footer id";
	var Closable = true;

	if(type=="scores"){
	    
	    Title = snCore.Event.game_ended ? "Game Finished" : "Players";
	    Body = "modal-body-scores-table";
	    Footer = snCore.Controls.client_indicated_finished ? "modal-footer-close-replay" : "modal-footer-simple-close"; 

	    // dynamically change content by regenerating the scores table...
	    $("#scores-table-container").html(this.generate_scores_table_html_element());

	}else if(type=="options"){

	    Title = "Options";
	    Body = "modal-body-options-menu";
	    Footer = "modal-footer-simple-close";
	    
	    //dynamic.
	    initiate_copy_box();
	    var homeURL = window.location.href.split('join')[0];
	    $("#download-log-link-a").attr("href", homeURL + "db_events=" + db_uID);

	}else if(type=="connection"){

	    Title = "Connectivity Problem";
	    Body = "modal-body-slow-connection";
	    Footer = "modal-footer-rejoin";
	    Closable = false;

	    //dynamic.
	    function update_latency_html(){
		var L = snCore.Latency.GetTimeCurrentlyWaited();

		switch(L.m_key) {
		case "turn":
		    //bluish
		    $(".loader").css("color", "#3B3369");
		    break;
		case "snatch":
		    //greenish
		    $(".loader").css("color", "#336956");
		    break;
		default:
		    //redish
		    $(".loader").css("color", "#693346");
		} 

		var LAT = L.latency;
		if(LAT < 60){
		    $("#connection-latency").html(LAT.toFixed(0));
		    snCore.Popup.modal_content_updater_timeout = setTimeout(update_latency_html, 1000);
		}else{
		    snCore.Popup.openModal("connection_1min");
		}
	    }
	    update_latency_html();//herby start the chain...	    

	}else if(type=="connection_1min"){

	    Title = "Connection Lost";
	    Body = "modal-body-lost-connection";
	    Footer = "modal-footer-rejoin";
	    Closable = false;

	    //dynamic.
	    function update_latency2_html(){
		var L = snCore.Latency.GetTimeCurrentlyWaited();

		$("#connection-latency-2").html(fuzzyTime( L.latency*1000) );
		snCore.Popup.modal_content_updater_timeout = setTimeout(update_latency2_html, 5000);
	    }
	    update_latency2_html();//herby start the chain...	    

	}else if(type=="rules"){
	    Title = "Instructions";
	    Body = "modal-body-flickity-rules";
	    Footer = "modal-footer-back-and-close";

	    flkty_rules.select(0);//revert to page 1

	}else if(type=="stats"){
	    Title = "Game Stats";
	    Body = "modal-body-flickity-stats";
	    Footer = snCore.Controls.client_indicated_finished ? "modal-footer-close-replay" : "modal-footer-simple-close"; 

	    // I want the 'stats' window to be more-or-less as big as it can be within the screen
	    var div_w = snCore.Basic.canv_W * 0.95;
	    var div_h = Math.min(div_w, snCore.Basic.canv_H * 0.78);
	    var div_h_inr = div_h - 34;
	    function px(x){return x+ "px";}
	    $("#modal-body-flickity-stats").css("width", px(div_w)).css("height", px(div_h));
	    $(".stats-container").css("width", px(div_w)).css("height", px(div_h_inr));
	    $(".stats-cell").css("width", px(div_w)).css("height", px(div_h_inr));

	    //The idea here is we dynamically reinitialise the flickity so that it takes the correct size...
	    if(flkty_stats != undefined){flkty_stats.destroy();}
	    flkty_stats = new Flickity('.stats-container', {accessibility: false});

	    $("#myChart-container").css("width", px(div_w-140)).css("height", px(div_h_inr-30)).css("margin", "15px");

	    GAME_GRAPHING_STATS_REQUEST();
	}


	//Inject the Title
	$("#box-title").html(Title);
	//Setting Modal BODY
	this.setVisibleModalContent("#modal-body", Body);
	this.setVisibleModalContent("#modal-footer", Footer);
	this.activateModal(Closable);//it does not matter to run this function if a model is already present.

	//record which popup is currently on display...
	this.popup_in_foreground = type;

    },

    setChart: function(data){
	
	console.log(JSON.stringify(data, null, 2));
/*
	var data = {
	    datasets: [{
		label: 'Sam',
		borderColor: 'rgba(255,99,132,1)',
		data: [{
		    x: (new Date("2016-07-29T22:38:44.120Z")-new Date("2016-07-29T22:38:44.120Z")),
		    y: 0
		}, {
		    x: (new Date("2016-07-29T22:38:46.680Z")-new Date("2016-07-29T22:38:44.120Z")),
		    y: 10
		}, {
		    x: (new Date("2016-07-29T22:38:49.336Z")-new Date("2016-07-29T22:38:44.120Z")),
		    y: 5
		}]
	    },{
		label: 'Dave',
		steppedLine: true,
		borderColor: 'rgba(54, 162, 235, 1)',
		data: [{
		    x: (new Date("2016-07-29T22:38:44.120Z")-new Date("2016-07-29T22:38:44.120Z")),
		    y: 2
		}, {
		    x: (new Date("2016-07-29T22:38:46.680Z")-new Date("2016-07-29T22:38:44.120Z")),
		    y: 4
		}, {
		    x: (new Date("2016-07-29T22:38:49.336Z")-new Date("2016-07-29T22:38:44.120Z")),
		    y: 9
		}]
	    }]
	};
*/

	//NOW create chart contents...
	if(this.myChart == undefined){
	    var ctx = document.getElementById("myChart");
	    this.myChart = new Chart(ctx, {
		type: 'line',
		data: data,
		options: {
		    scales: {
			xAxes: [{
			    type: 'time',
			    time: {
				unit: 'second',
				displayFormats: {
				    second: 'm:ss'
				}
			    },
			    scaleLabel: {
				display: true,
				labelString: 'minutes of play'
			    }
			}]
		    },
		    legend: {
			position: 'bottom',
			display: true
		    },
		    title: {
			display: true,
			text: "Scores Plot",
			fontSize: 28
		    },
		    maintainAspectRatio: false,
		    responsive: true
		}
	    });
	}else{
	    // use of a timeout here seems slightly hacky, but resolves an issue related to
	    // canvas size needing to be adjusted after render...
	    setTimeout(function(){snCore.Popup.myChart.resize();}, 50);
	}

    },

    // Generic stuff required for presence of the modal
    activateModal: function(Closable){

	// 1. Reveal the DIV which is the dark background with message on it
	var ds = document.getElementById("modal_dark_sheet");
	ds.style["display"] = "block";
	//ds.style["background-color"] = "rgba(0, 0, 0, 0.75)";

	if(Closable){
	    // 2. clicking the background closes the message
	    // the behavior takes half a second to become active (Touchscreen niggle fix)
	    ds.onclick = undefined;
	    setTimeout(function(){
		ds.onclick = function(event) {
		    if (event.target == ds) {
			snCore.Popup.hideModal();
		    }
		};
	    }, 500);

	    // 3. the x button closes the window...
	    $("#close").css("display", "inline");
	    document.getElementById("close").onclick = function() {
		snCore.Popup.hideModal();
	    };
	}else{
	    ds.onclick = undefined;
	    $("#close").css("display", "none");
	}

	// 4. set the scale correctly:
	this.calcModalScale();

    },

    hideModal: function(){
	$("#modal_dark_sheet").css("display", "none");
	clearTimeout(this.modal_content_updater_timeout);
	this.popup_in_foreground = false;
    },

    setVisibleModalContent: function(section, content_id){
	$(section).children().each(function(){
	    var div_id = $(this).attr('id');
	    var set_disp = "none";
	    if(div_id == content_id){
		set_disp = "block";
	    }
	    $(this).css("display", set_disp);
	});
    },

    gotoHomePage: function(){
	var homeURL = window.location.href.split('join')[0];
	window.location.href = homeURL;
	
    },

    sendSettingChange: function(){
	/* the 6 settings we have currently are...

	   uOpt_challenge
	   uOpt_stem
	   uOpt_turns <select>
	   uOpt_flippy
	   uOpt_dictionary <select>
	   uOpt_penalty
	*/

	var settings_grab = {
	    //1.
	    uOpt_challenge: $("#uOpt_challenge").is(":checked"),
	    //2.
	    uOpt_stem: $("#uOpt_stem").is(":checked"),
	    //3. <select>
	    uOpt_turns: $('#uOpt_turns').val(),
	    //4.
	    uOpt_flippy: $("#uOpt_flippy").is(":checked"),
	    //5. <select>
	    uOpt_dictionary: $('#uOpt_dictionary').val(),
	    //6.
	    uOpt_penalty: $("#uOpt_penalty").is(":checked"),
	};

	//transmit over websocket...
	GAME_SETTINGS_CHANGE(settings_grab);
    },

    recieveSettingChange: function(sOb){
	//1.
	$('#uOpt_challenge').prop('checked', sOb.uOpt_challenge);
	//2.
	$('#uOpt_stem').prop('checked', sOb.uOpt_stem);
	//3. <select>
	$("#uOpt_turns").val(sOb.uOpt_turns);
	//4.
	$('#uOpt_flippy').prop('checked', sOb.uOpt_flippy);
	//5. <select>
	$("#uOpt_dictionary").val(sOb.uOpt_dictionary);
	//6.
	$('#uOpt_penalty').prop('checked', sOb.uOpt_penalty);
    }

};
