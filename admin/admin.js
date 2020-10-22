const fs = require('fs');
const path = require('path');
const remote = require('electron').remote;
const resources = remote.getGlobal('respath');
var ocRenderer = require('electron').ipcRenderer;


var skins = [];
var bgimgs = [];
cur_config = {};
mission_data = {};
locations = {};
marscharts = [];

locDeleted = false;
winDimAlter = false;

var curtab = "sbarskins";
var curblk = "section_skins";

document.addEventListener("DOMContentLoaded", function(event) { 
	if( remote.getGlobal('isArm7l') ) hideCursor();
});

ocRenderer.on('load-complete', (event, arg) => {
	//conslog('abort from save');
	if( winDimAlter ){
		ocRenderer.send('relaunch');
	}
	else {
		abort();
	}
});


function hideCursor(){
    document.body.style.cursor = "none"; 
}

function piMarsVer(){
	return remote.getGlobal('piMarsVer');
}

function piMarsSubVer(){
	return piMarsVer()+'.'+remote.getGlobal('piMarsSubver');
}

function piMarsBuild(){
	return piMarsSubVer()+'.'+remote.getGlobal('piMarsBuild');
}


function flatten(lists) {
  return lists.reduce((a, b) => a.concat(b), []);
}

function getDirectories(srcpath) {
	var sp = path.join( resources, srcpath );
  return fs.readdirSync(sp)
    .map(file => path.join(sp, file))
    .filter(spath => fs.statSync(spath).isDirectory());
}
/*
function getDirectoriesRecursive(srcpath) {
  return [srcpath, ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive))];
}
*/

function toggleVis(el){
    document.getElementById(el).classList.toggle('mars_th');
}

function infile( file ){
	var fpath = path.join( resources, file );
	return fs.readFileSync( fpath, {encoding:'utf8', flag:'r'} );
}
function outfile( file, data ){
	return fs.writeFileSync( path.join( resources, file ), data );
}

function adminPrepare(){

	// clone the current configuration so any changes are not permanent unless a SAVE is requested
	// this allows the user to abandon (undo) any changes they might have made
	
	cur_config = JSON.parse(JSON.stringify(remote.getGlobal('config')));
	mission_data = JSON.parse(infile('mission_data.json'));
	locations = JSON.parse(infile('coordinates.json'));

	dirs = getDirectories('skins');
	dl = dirs.length;

	dirs.forEach( function(d) {
		var files = fs.readdirSync(d);
		var sconfig = JSON.parse(fs.readFileSync(d+'/skin.json', {encoding:'utf8', flag:'r'} ));
		skins.push([d, sconfig.name, sconfig.bgimg, path.parse(d).base]);
	});

	var skname_li = "";
	skins.forEach( function(a, i) {
		if( a[1] !== "Template" ){
			var sel = (a[3] == cur_config.skin) ? " checked" : "";
			var img = resources+"/skins/"+a[3]+'/'+a[2];
			if( a[2].substring(0,4) == 'http' ){
				img = a[2];
				bgimgs.push(img);
			}
			else {
				bgimgs.push(img);
			}
			skname_li += "<label for='skin"+i+"'><img src='"+img+"' width=100px> <input type=radio name=skin id=skin"+i+" value='"+a[3]+"'"+sel+"> "+a[1]+"</label><br>";
		}		
	});

	var files = fs.readdirSync(resources+'/images/backgrounds');
	files.forEach( function(a) {
		var e = a.substr(-4).toLowerCase();
		if(  e == '.png' || e == '.jpg' || e == '.bmp' ){
			bgimgs.push(resources+'/images/backgrounds/'+a);
		}
	});


	bglist = "";
	//conslog("def="+cur_config.defimg);
	abglist = [];
	bgimgs.forEach( function(a, i) {
		var sel = (a.replace(resources,'') == cur_config.background.image) ? " checked" : "";
		if( a.substring(0,4) == 'http' ){
			bglist += "<label for='bg"+i+"'><img src='"+a+"' width=100px> <input type=radio name=bgskin id=bg"+i+" value='"+a+"' "+sel+"></label><br>";
		}
		else {
			bglist += "<label for='bg"+i+"'><img src='"+a+"' width=100px> <input type=radio name=bgskin id=bg"+i+" value='"+a+"' "+sel+"></label><br>";
		}
		abglist.push(a.replace(resources,''));
		//conslog(a);
	});

	cur_config.abglist = abglist;
	if( !cur_config.hasOwnProperty('refreshRate') ) cur_config.refreshRate = 100;
	var rrate = "";
	rrate += "<option value=100"+(cur_config.refreshRate == 100 ? " selected" : "")+">10/s</option>"+
	         "<option value=200"+(cur_config.refreshRate == 200 ? " selected" : "")+">5/s</option>"+
	         "<option value=250"+(cur_config.refreshRate == 250 ? " selected" : "")+">4/s</option>"+
	         "<option value=500"+(cur_config.refreshRate == 500 ? " selected" : "")+">2/s</option>"+
	         "<option value=1000"+(cur_config.refreshRate == 1000 ? " selected" : "")+">1/s</option>"+
	         "<option value=1027"+(cur_config.refreshRate == 1027 ? " selected" : "")+">1/Ms</option>";

	
	var locs = buildLocations();
	
	

	document.getElementById('refrate').innerHTML = rrate;


	//document.getElementById('fmb').checked = cur_config.bgforce;
	document.getElementById('section_skins').innerHTML = skname_li;
	document.getElementById('section_images_images').innerHTML = bglist;
	


	mdata = mission_data.data;
	mtag = "";
	current_mission = cur_config.code;
	mdata.forEach( function(m) {
		var sel = (m.code == current_mission) ? ' selected' : '';
		mtag += '<option value="'+m.code+'"'+sel+'>'+m.name+'</option>';
	});
	document.getElementById('missionlist').innerHTML = mtag;
	//document.getElementById('info').textContent = mtag;

	defbgimg = 0;
	if( cur_config.hasOwnProperty('background') ){
		if( cur_config.background.type == 'skin' ) 			defbgimg = 0;
		else if( cur_config.background.type == 'bgimg' ) 	defbgimg = 1;
		else if( cur_config.background.type == 'mcmap' ) 	defbgimg = 2;
		else if( cur_config.background.type == 'tcmap' ) 	defbgimg = 3;
		else if( cur_config.background.type == 'rand' ) 	defbgimg = 4;
		else if( cur_config.background.type == 'vkmap' ) 	defbgimg = 5;
		else if( cur_config.background.type == 'mchs' ) 	defbgimg = 6;
		else if( cur_config.background.type == 'irday' ) 	defbgimg = 7;
	}
	document.getElementsByName('bgimage')[defbgimg].checked = true;

	// ftp proxy
	// ftpcb, ftpip, ftpport
	if( cur_config.ftp.proxy ) document.getElementById('ftpcb').checked = true;
	document.getElementById('ftpip').value = cur_config.ftp.ipaddress;
	document.getElementById('ftpport').value = cur_config.ftp.port;

	document.getElementById('winw').value = cur_config.window.width;
	document.getElementById('winh').value = cur_config.window.height;

	document.getElementById('slref').value = cur_config.slideshow_refresh;

	//document.getElementById('fetch').classList = 'mars_th';
	toggleVis('section_skins');
	//document.getElementById('section_skins').classList = '';
	curtab = "sbarskins";
	curblk = "section_skins";
}

function buildLocations(){
	var locs = "";
	locations.data.forEach( function(a) {
		var sel = (a.name == cur_config.coordinates.name) ? ' selected' : '';
		locs += "<option value='"+a.name+"'"+sel+">"+a.name+"</option>";
	});
	document.getElementById('presets').innerHTML = locs;
}

function switchBlock(newTab, newBlock){
	if( newTab !== curtab ){
		document.getElementById(curtab).classList.toggle('sidebar_on');
		document.getElementById(newTab).classList.toggle('sidebar_on');

		toggleVis(curblk);
		toggleVis(newBlock);
		//document.getElementById(curblk).classList.toggle('mars_th');
		//document.getElementById(newBlock).classList.toggle('mars_th');

		curtab = newTab;
		curblk = newBlock;
	}
}

function selectSkin(){
	var Anodes = document.getElementsByName('skin');
	var result = Array.from(Anodes)
		       .filter(node => node.checked)
		       .map(node => node.value)
		       .pop();
	//cur_config.skin = result.substr(6);
	cur_config.skin = result;
	//conslog("skin="+result);
}

function selectBackgroundImage(){
	var Anodes = document.getElementsByName('bgskin');
	var result = Array.from(Anodes)
		       .filter(node => node.checked)
		       .map(node => node.value)
		       .pop();
	cur_config.background.image = result.replace(resources,'');

	//conslog('bgimg = '+result);
	//conslog("skin="+cur_config.skin);
}

function setBgImageSrc(){
	var Anodes = document.getElementsByName('bgimage');
	var result = Array.from(Anodes)
		       .filter(node => node.checked)
		       .map(node => node.value)
		       .pop();
	cur_config.bgforce = (result == 'bgimg' || result == 'rand');
	cur_config.background.type = result;
}

function selectMission(){
	cur_config.code = document.getElementById('missionlist').value;
	cur_config.useCoords = false;
	//conslog(r.value);
}

function defaultWinDim(){
	document.getElementById('winw').value = "800";
	document.getElementById('winh').value = "480";
}

function saveConfig(){
	selectSkin();
	selectBackgroundImage();
	setBgImageSrc();
	cur_config.refreshRate = document.getElementById('refrate').value;
	// ftpcb, ftpip, ftpport
	cur_config.ftp.proxy = document.getElementById('ftpcb').checked;
	cur_config.ftp.ipaddress = document.getElementById('ftpip').value;
	cur_config.ftp.port = document.getElementById('ftpport').value;

	cur_config.window.width = document.getElementById('winw').value*1;
	cur_config.window.height = document.getElementById('winh').value*1;
	cur_config.slideshow_refresh = document.getElementById('slref').value*1;

	if( locDeleted ){
		outfile( 'coordinates.json', JSON.stringify(locations) );
	}
	if( cur_config.window.width != remote.getGlobal('config').window.width || cur_config.window.height != remote.getGlobal('config').window.height ){
		winDimAlter = true;
	}

	var fdata = JSON.stringify(cur_config);
	outfile( 'config.json', fdata );
	ocRenderer.send('reload', fdata);
}

function locationData(){
	if( document.getElementById('lach').value == "" || document.getElementById('loch').value == "" || document.getElementById('locname').value == "" ){
		return; // can't save empty data
	}
	var o = {
		"actual_lat": parseFloat(parseFloat(document.getElementById('lach').value).toFixed(4)),
		"actual_lon": parseFloat(parseFloat(document.getElementById('loch').value).toFixed(4)),
		"lat": parseFloat(parseFloat(document.getElementById('lach').value).toFixed(4)),
		"lon": parseFloat(parseFloat(document.getElementById('loch').value).toFixed(4)),
		"name": document.getElementById('locname').value,
		"code": "",
		"notes": document.getElementById('loctext').value,
		"status": 6,
		"active_date":"",
		"msd_offset":0,
		"vtype":3,
		"sol_0_or_1":0,
		"location":"",
		"agency_name":"",
		"vehicle_type":"crater",
		"status_text":"",
		"system":true
	}
	
	if( o.actual_lat < 0 ) o.actual_lat = 0;
	if( o.actual_lat > 90 ) o.actual_lat = 90;

	if( o.actual_lon < 0 ) o.actual_lon = 0;
	if( o.actual_lon > 180 ) o.actual_lon = 180;

	if( document.getElementById('north').value == 'S' ) o.actual_lat = -o.actual_lat;
	if( document.getElementById('east').value == 'W' ) o.actual_lon = -o.actual_lon;
	o.lat = o.actual_lat;
	o.lon = o.actual_lon;
	var a = calculateMarsChartNumber(o.actual_lat, o.actual_lon);
	o.mc = a[0];
	o.mcname = a[1];
	document.getElementById('lach').value = "";
	document.getElementById('loch').value = "";
	document.getElementById('locname').value = "";
	document.getElementById('loctext').value = "";
	return o;
}

function useLocation(){
	cur_config.coordinates = locationData();
	cur_config.useCoords = true;
}

function findPreset(x){
	return x.name == document.getElementById('presets').value;
}

function useLocPreset(){
	cur_config.coordinates = locations.data.find(function (e) {
		return e.name == document.getElementById('presets').value;
	});
	cur_config.useCoords = true;
}

function delLocPreset(){
	var i = locations.data.findIndex(function (e, n) {
		return e.name == document.getElementById('presets').value;
	});
	if( i > -1 ){
		// darn well better be greater than zero!
		//conslog(i+': '+locations.data[i].name+', '+document.getElementById('presets').value);
		locations.data.splice(i, 1);
		buildLocations();
		locDeleted = true;
		locations.header.records -= 1;
	}

}

function saveAsPreset(){
	var o = locationData();
	locations.data.push(o);
	locations.count++;
	locDeleted = true; // triggers save
	locations.data.sort(function(a,b){
		if( a.name < b.name ) return -1;
		else if( a.name > b.name ) return 1;
		return 0;
	});
	buildLocations();
}

function findMap(x){
	return 
}

function abort(){
	location.replace('../root-0.html');
}

function conslog( data ){
    ocRenderer.send('console', data);
}

function powerOptions(){
	var Anodes = document.getElementsByName('powerradio');
	var result = Array.from(Anodes)
		       .filter(node => node.checked)
		       .map(node => node.value)
		       .pop();
	if( result == 'quit' ){
		ocRenderer.send('quit');
	}
	else {
		ocRenderer.send('power', 'sudo '+result);
	}
}