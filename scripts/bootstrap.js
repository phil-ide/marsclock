	const remote = require('electron').remote;
	const { ipcRenderer } = require('electron');
	const {dialog} = require('electron').remote;
	const si = require('systeminformation');

	const ldopts = {hour: '2-digit', minute:'2-digit'};
	const pdopts = {second:'2-digit'};

	const fs = require('fs');
	const path = require('path');

	const resources = remote.getGlobal('respath');

    const status_code_text = [
    					{text: "Waiting to launch", code: "#ccc"}, 	// 0
    					{text: "In transit", code: "#ccc"},			// 1
    					{text: "active", code: "#0f0"},				// 2
    					{text: "ended", code: "#0b67c8"},			// 3
    					{text: "failed", code: "#f00"},				// 4
    					{text: "coords", code: "transparent"},		// 5
					{text: "", code: "transparent"},			// 6
					{text: "Future landing site", code: "#ccc"}
    					];
    const vtypes = [
    					"lander",
    					"rover",
    					"helicopter",
					"crater",
					"surface feature"
    				];

	var ocRenderer = require('electron').ipcRenderer;
	randomizerValue = -1;

	remoteTai = remote.getGlobal('config').tai; // redefine

	//config = JSON.parse(fs.readFileSync('config.json'));
	//conslog(remote.getGlobal('config'));

	config = remote.getGlobal('config');
	object 	= config.obj;
	code 	= config.code;
	skinName = config.skin;
	skinDir = 'skins/'+skinName+'/';
	refreshRate = 100;

	if( config.hasOwnProperty('refreshRate') ) refreshRate = config.refreshRate;


	//changeCSS('style/'+config.skin+'.css', 0);
	changeCSS('skin.css', 1);

	//skin = JSON.parse(fs.readFileSync('skins/'+config.skin+'.json'));
	//skin = JSON.parse(fs.readFileSync(skinDir+'skin.json'));

	skin = JSON.parse(infile(skinDir+'skin.json'));

	// background properties
	if( !skin.hasOwnProperty('bgimg') || skin.bgimg == 'none' ) config.bgforce = true;
	if( !skin.hasOwnProperty('seconds') ) skin.seconds = true;
	if( !skin.hasOwnProperty('name') ) skin.name = skinName;

	img = skin.bgimg;
	
	if( config.bgforce ){
		img = config.background.image.substr( 0, 4 ) == 'http' ? config.background.image : "../../"+config.background.image;
		if( config.background.type == 'rand' ){
			conslog('refresh='+config.slideshow_refresh+' minutes');
			conslog('randomizing');
			window.setInterval( function(){
				randomizerValue = getRndInteger( 0, config.abglist.length, randomizerValue );
				p = config.abglist[randomizerValue];
				if( p.substr( 0, 4 ) != 'http' ){
					p = '../..'+p;
				}
				changeBGImage( p );
			}, (config.slideshow_refresh*60000) );
		}
	}

	changeBGImage( img );

	var piri = {};

	//var experiments = JSON.parse(fs.readFileSync(path.join( resources, 'mission_data.json')));
	var experiments = JSON.parse(infile('mission_data.json'));
	records = experiments.header.records;
	dataversion = experiments.header.version;

	experiments = experiments.data;

	if( !config.useCoords ){
		for( i = 0; i < records; i++ ){
			if( experiments[i].code == code ){
				piri = experiments[i];
				i = records;
			}
		}
	}
	else {
		piri = config.coordinates;
		piri.msd_offset = 0;
		piri.status = 5;
		piri.location = piri.mcname;
		piri.code = false;
	}

	piri.chart = calculateMarsChartNumber(piri.actual_lat, piri.actual_lon)[5];
	experiments = "";
	document.getElementById('dver').textContent = dataversion;
	document.getElementById('rcount').textContent = records;
	var status = piri.status;

	addZoomControls = false;

	// are we using a background or a map?
	if( config.background.type != "skin" && config.background.type != "bgimg" ){
		// it's one of the map options
		if( config.background.type == "mcmap" ){
			mc = config.coordinates.mc;
			var chart = calculateMarsChartNumber(piri.actual_lat, piri.actual_lon);
			mc = chart[5];
			mc = '../../images/maps/mola/mc'+padlb(mc.toString(),2)+'.png';
			changeBGImage( mc );
			if( isLowerHalf( chart, piri.actual_lat ) ){
				document.body.style.backgroundPosition = "bottom left";
			}
		}
		else if( config.background.type == "tcmap" ){
			mc = config.coordinates.mc;
			var chart = calculateMarsChartNumber(piri.actual_lat, piri.actual_lon);
			mc = chart[5];
			mc = '../../images/maps/tc/mc'+padlb(mc.toString(),2)+'.jpg';
			changeBGImage( mc );
			if( isLowerHalf( chart, piri.actual_lat ) ){
				document.body.style.backgroundPosition = "bottom left";
			}
		}

		else /*if( config.background.type == "vkmap" )*/{
			document.addEventListener("DOMContentLoaded", function(event) { 
				/*
				var gdiv = document.createElement('script');
				gdiv.id = "meltdown";
				gdiv.setAttribute('type',"text/javascript");
				gdiv.setAttribute('src', '../../js/map.js');
				gdiv.onload=loaded;
				//gdiv.innerHTML = fs.readFileSync('../../scripts/viking.js');
				document.getElementsByTagName('body')[0].appendChild(gdiv);
				
				conslog('test');
				*/
				//css = fs.readFileSync('skins/'+config.skin+'/map.css');
				//document.getElementById('altmapstyle').innerHTML = css;
				
				/*
				conslog(document.getElementById('name_enclosure').style.left);
				document.getElementById('name_enclosure').style.left = 60;
				conslog(document.getElementById('name_enclosure').style.left);
				//document.getElementById('loca_enc').style.width = document.getElementById('loca_enc').style.width-60;
				
				document.getElementById('loca_enc').style.left += 60;
				conslog(document.getElementById('loca_enc').style);
				*/
				//conslog(document.getElementById('name_enclosure').style.width);
				//s.left += 60;
				//document.getElementById('loca_enc').style.width = (parseInt(document.getElementById('loca_enc').style.width) - 60)+'px';
				

			  //do work
			});

		}
	}

	if( piri.location == "" || piri.location == null ){
		piri.location = calculateMarsChartNumber(piri.actual_lat, piri.actual_lon)[4];
	}

	if( !piri.code ){
		// it's a location
		document.getElementById('mission_enclosure').remove();
	}

	if( addZoomControls ){
		document.addEventListener("DOMContentLoaded", function(event) { 
			// make sure there is a way to access the admin screen
			var gdiv = document.createElement('div');
			gdiv.className = 'zoom'; // we don't use this, but it gives a skin-maker an opportunity to do stuff
			gdiv.id = 'zoom';
			gdiv.innerHTML = "<span style='cursor: hand;' onClick='incScale();' data-scale=1><b>+</b></span>";
			document.getElementsByTagName('div')[0].appendChild(gdiv);
		  //do work
		});
	}

function getRndInteger(min, max, r) {
	var v = r;
  	while(v == r ){
  		v = Math.floor(Math.random() * (max - min) + min);
  	}
  	return v;
}

function calculateMarsChartNumber(lat, lon){
	// each chart in form of [lower_lat, higher_lat, lower_long, higher-long, mars-chart-name]
	// longitude is in degrees east
	const marscharts = [
						[ 65,  90,   0, 360, "Mare Boreum"		,  1],		// Mare Boreum - north polar
						[ 30,  65, 180, 240, "Diacria"			,  2],		// Diacria - north intermediary
						[ 30,  65, 240, 300, "Arcadia"			,  3],		// Arcadia
						[ 30,  65, 300, 360, "Mare Acidalium"	,  4],		// Mare Acidalium
						[ 30,  65,   0,  60, "Ismenius Lacus"	,  5],		// Ismenius Lacus
						[ 30,  65,  60, 120, "Casius"			,  6],		// Casius
						[ 30,  65, 120, 180, "Cebrenia"			,  7],		// Cebrenia
						[  0,  30, 180, 225, "Amazonis"			,  8], 		// Amazonis - north equatorial
						[  0,  30, 225, 270, "Tharsis"			,  9],		// Tharsis
						[  0,  30, 270, 315, "Lunae Palus"		, 10],		// Lunae Palus
						[  0,  30, 315, 360, "Oxia Palus"		, 11],		// Oxia Palus
						[  0,  30,   0,  45, "Arabia"			, 12],		// Arabia
						[  0,  30,  45,  90, "Syrtis Major"		, 13],		// Syrtis Major
						[  0,  30,  90, 135, "Amenthes"			, 14],		// Amenthes
						[  0,  30, 135, 180, "Elysium"			, 15],		// Elysium
						[  0, -30, 180, 225, "Memnonia"			, 16], 		// Memnonia - south equatorial
						[  0, -30, 225, 270, "Phoenicis"		, 17],		// Phoenicis
						[  0, -30, 270, 315, "Coprates"			, 18],		// Coprates
						[  0, -30, 315, 360, "Margartifer Sinus", 19],		// Margartifer Sinus
						[  0, -30,   0,  45, "Sinus Sabaeus"	, 20],		// Sinus Sabaeus
						[  0, -30,  45,  90, "Iapygia"			, 21],		// Iapygia
						[  0, -30,  90, 135, "Mare Tyrrhenum"	, 22],		// Mare Tyrrhenum
						[  0, -30, 135, 180, "Aeolis"			, 23],		// Aeolis
						[-30, -65, 180, 240, "Phaethontis"		, 24],		// Phaethontis - south intermediary
						[-30, -65, 240, 300, "Thaumasia"		, 25],		// Thaumasia
						[-30, -65, 300, 360, "Argyre"			, 26],		// Argyre
						[-30, -65,   0,  60, "Noachis"			, 27],		// Noachis
						[-30, -65,  60, 120, "Hellas"			, 28],		// Hellas
						[-30, -65, 120, 180, "Eridania"			, 29],		// Eridania
						[-65, -90,   0, 360, "Mare Austral"		, 30]		// Mare Austral - south polar
	];
	// convert longitude to east-only coords
	if( lon < 0 ) lon = 360 - lon;
	var i = 0;
	var vect = -1;
	var ret = [-1,"none"];
	var r = marscharts.find(function (m) {
		if( lat >= 0 ) return (lat >= m[0] && lat <= m[1] && lon >= m[2] && lon <= m[3]);
		else return (lat <= m[0] && lat >= m[1] && lon >= m[2] && lon <= m[3]);
	});
	//return [r[5], r[4]];
	return r;
}

function isLowerHalf( chart, lat ){
	var half = (chart[1] - chart[0])/2;
	return lat < half;
}

function loaded(){
	conslog('loaded: viking');
}
function conslog( data ){
    ocRenderer.send('console', data);
}

cwidth = 100;
cheight = 100;

cuur_x = 0;
cuur_y = 0;

function incScale(){
	var o = document.getElementsByTagName('body')[0];
	conslog('jj');
	cwidth += 10;
	cheight += 4;
	o.style.width = cwidth+'%';
	o.style.height = cheight+'%';
}

var canvas = document.getElementById('scpaint');
var ctx = canvas.getContext("2d");
var daybarTop = 0; //canvas.height;///3;
var pix = 1440/canvas.width; // pixels per minute
const deg45 = (45 * Math.PI/180);
var ctxx = canvas.width/2;
var ctxy = canvas.height/2;
//conslog(pix);

document.getElementById('sunclock').style.zIndex = -1;

if( document.getElementById('cpu') ){
	cpudiv = document.getElementById('cpu');
	si.version(); // force initialisation of the package
	si.cpuTemperature(cpuCb);
	window.setInterval( function(){
		si.cpuTemperature(cpuCb);
		//si.cpu().then(data => conslog(data))
	}, 1000*30); // once per 30 secs
}
/*
cpudiv = document.createElement('div');
cpudiv.className = 'cpu'; // we don't use this, but it gives a skin-maker an opportunity to do stuff
cpudiv.id = 'cpu';
document.getElementById('mass_container').appendChild(cpudiv);
*/

//conslog('si v: '+si.version());


// cpu temp

//setTimeout(hideCursor,1000);
preClock();
MartianTime();
window.setInterval( function(){
		MartianTime();
	}, (refreshRate) );


function cpuCb(o){
	//conslog(o);
	//conslog(o.cores.length);
	if( o.main )
		cpudiv.innerHTML = parseInt(o.main)+'&deg;C';

}

function infile( file ){
  return fs.readFileSync( path.join( resources, file ), {encoding:'utf8', flag:'r'} );
}

