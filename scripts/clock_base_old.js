//##################################################
// Ls                 0     30     60     90     120    150    180    210    240   300    330    360/0
// month              1      2      3      4      5      6      7      8      9     10     11     12
// dust storm                                         ===============================================
// sol range start   0.0   61.2  126.6  193.3  257.8  317.5  371.9  421.6  468.5  514.6  562.0  612.9
// sol range ends   61.2  126.6  193.3  257.8  317.5  371.9  421.6  468.5  514.6  562.0  612.0  668.6
// duration (sols)  61.2   65.4   66.7   64.5   59.7   54.4   49.7   46.9   46.1   47.4   50.9   55.7
// aphelion Ls = 71 (month 3)  perihelion Ls = 251 (month 9)
martian_months = [ 61, 126, 193, 257, 317, 371, 421, 468, 514, 562, 612, 668 ];

mars_moment = 1.027491261574074;

martian_day = 88775.244147;
martian_year = 668.6 * martian_day;
martian_sec = martian_day / 86400;
martian_min = martian_sec * 60;
martian_hour = martian_sec * 3600;
elysium_offset = martian_hour*15;

prime_meridian = false;

// add leap seconds (last update 2017)
// last checked 202-06-06
// https://hpiers.obspm.fr/eoppc/bul/bulc/bulletinc.dat
// http://maia.usno.navy.mil/ser7/tai-utc.dat
// ftp://hpiers.obspm.fr/iers/bul/bulc/bulletinc.dat
TTUTC = 32.184;



document.addEventListener("DOMContentLoaded", function(event) { 
	// make sure there is a way to access the admin screen
	var gdiv = document.createElement('div');
	gdiv.className = 'gear'; // we don't use this, but it gives a skin-maker an opportunity to do stuff
	gdiv.id = 'gear';
	gdiv.style.zIndex = 10;
	gdiv.innerHTML = '<a href="../../admin/admin.html"><img src="../../images/gears-png-file-3c.png" /></a>';
	document.getElementsByTagName('body')[0].appendChild(gdiv);
	// now do the ugly stuff
	if( config.skin != "skin_001" ){
		document.getElementById('sundata').remove();
	}
});

function info(t){
	document.getElementById('info').textContent += "\n"+t;
}

function preClock(){
	piri.actual_lat_norm = normaliseNorthSouth(piri.actual_lat);
	piri.actual_lon_norm = normaliseEastWest(piri.actual_lon);
	piri.lat_norm = normaliseNorthSouth(piri.lat);
	piri.lon_norm = normaliseEastWest(piri.lon);

	if( skin.hasOwnProperty("degdecimals") && skin.degdecimals > -1 ){
		// -1 or less means use all.
		piri.actual_lat_norm[0] = piri.actual_lat_norm[0].toFixed(skin.degdecimals);
		piri.actual_lon_norm[0] = piri.actual_lon_norm[0].toFixed(skin.degdecimals);
		piri.lat_norm[0] = piri.lat_norm[0].toFixed(skin.degdecimals);
		piri.lon_norm[0] = piri.lon_norm[0].toFixed(skin.degdecimals);
	}
	document.getElementById('locinfo').textContent = piri.location;
	document.getElementById('name').textContent = piri.name;
    mission_notes = "";
	if( piri.notes != null ){
		mission_notes = piri.notes;
	}
	document.getElementById("notes").textContent = mission_notes;

	if( piri.code ){
	    document.getElementById('code').textContent = piri.code;
		document.getElementById('active_date').textContent = piri.active_date;
		document.getElementById('agency').textContent = piri.agency_name;
		document.getElementById('vtype').textContent = piri.vehicle_type;
	}

}

function MartianTime(){
	elysium = piri;
	whatisthetime();
	start = new Date('1955-04-11');
	start = start.getTime()/1000;
	today = new Date();
	curtime = today.getTime()/1000;
	lSubS = curtime;

	TTUTC = 32.184+remote.getGlobal('config').tai;

	//meridian = curtime;

	curtime -= start;
	meridian = curtime;
	//meridian -= start;
	lSubS -= start;

	// Prime Meridian
	year = parseInt(curtime / martian_year);
	mod = parseInt( curtime % martian_year);
	//mod =  parseInt(curtime - (martian_year*year));
	year += 1; // begin on year 1, not zero
	days = parseInt(mod / martian_day);//+1;


    month = getMarsMonth( days );

	time = parseInt(mod - (martian_day*days)) / martian_sec;
	pdays = (time+elysium_offset)/martian_day;
	
	tstring = secs2Time(parseInt(time));

	// Elysium
	zyear = parseInt(meridian / martian_year);
	zmod =  parseInt(meridian - (martian_year*zyear));
	zyear += 1;
	zdays = days //parseInt(zmod / martian_day)+1;

    zmonth = getMarsMonth( zdays );

    ztime = time+(15*60*60);
    if( ztime > martian_day ) ztime -= (24*60*60);
    ztime = parseInt(ztime);
	ztstring = secs2Time(parseInt(ztime));

	var millis = today.getTime();
    var jd_ut = 2440587.5 + (millis / 8.64E7);
    var jd_tt = jd_ut + (TTUTC + 32.184) / 86400;
    var j2000 = jd_tt - 2451545.0;
    var msd = (((j2000 - 4.5) / 1.027491252) + 44796.0 - 0.00096);
    var mtc = (24 * msd) % 24;

    var mjd = modifiedJulianDate( jd_tt );
    var mmsd = msd - 0.00036;

    mtc = (mtc * 3600)-31;
    mtc = parseInt(mtc.toString());

    lSubS = altGetLSubS(j2000);

	var xtstring = secs2Time(mtc);

	mission_count = (parseInt(mmsd.toFixed()) - piri.msd_offset)+1;

    // actual location of InSight (as opposed to the proposed/intended location at 135.97Â°E)
    //xxtc = mtc + (135.6234 * 240);
    xxtc = mtc + calcOffset(piri.actual_lon);
    if( xxtc > 86400 ){
    	xxtc = xxtc % 86400;
    	zdays++;
    	mission_count++;
    	zmonth = getMarsMonth( zdays );

    	if( zmonth == 1 && zdays == 1 ){
    		zyear++;
    	}
    }
    nu_m = getEquationOfCentre(j2000)[0];
    //nu_m = getEquationOfCentre(msd)[0];
    //conslog(lSubS);
    l_s = parseFloat(lSubS);
	mars_eot = 2.861 * sin(2 * l_s) - 0.071 * sin(4 * l_s) + 0.002 * sin(6 * l_s) - nu_m;
	eoth = (mars_eot * 24 / 360)*3600;
	latOffset = 96*piri.actual_lat;

	var h_offset = solar_angle( l_s, nu_m, mars_eot*24/360, jd_tt, piri );

	latOffset = (Math.abs( piri.actual_lat - h_offset )*0.269)*60;

	var red = calcMiddayAndDayLen( jd_tt, piri );

	ltst = xxtc + eoth;

	// #############################
	// if sun and location in the same hemisphere, days are longer, else shorter
	if( (nu_m < 180 && piri.actual_lat > 0) || (nu_m > 180 && piri.actual_lat < 0) ){
		red = -red;
	}

	halfday = parseInt(21600+red);
	noon = parseInt(43200-eoth);

	sunrise = noon-halfday;
	sunset = noon+halfday;
	night = 86400 - (sunset - sunrise);

    colr = status_code_text[piri.status].code;
    //##################################################################################################
    mission_text = '<span style="color: '+colr+';">'+status_code_text[piri.status].text+"</span>";
    //##################################################################################################

    if( piri.status > 1 && piri.status < 4 ){
    	if( piri.status == 2 ){
    		mission_text = "sol "+(parseInt(mmsd.toFixed()) - piri.msd_offset)+" "+mission_text;
    	}
    	else {
   			mission_text = piri.active_date+' '+mission_text;  // use active date until we fix notes
    	}
    }

    if( piri.code ){
	    mclock = mtc + calcOffset(piri.lon);
	    mstatus = "<span style='color: "+status_code_text[piri.status].code+";'>"+status_code_text[piri.status].text+"</span>";

		document.getElementById("mission").innerHTML = secs2Time(parseInt(mclock.toString()));
		document.getElementById('sstat').textContent = mission_count;
		document.getElementById('mstat').innerHTML = mstatus;

		document.getElementById('intended-latitude').textContent = piri.lat_norm[0];
		document.getElementById('intended-longitude').textContent = piri.lon_norm[0];
		document.getElementById('intended-latitude-dir').textContent = piri.lat_norm[1];
		document.getElementById('intended-longitude-dir').textContent = piri.lon_norm[1];
		
		adDate = new Date(piri.active_date);
		adDate = adDate.getTime()/1000;
		adSDate = today.getTime()/1000;
		adDate = adSDate - adDate;

		adTime = (adDate%86400);
		adDays = (adDate - adTime)/86400;
		document.getElementById('active_days').textContent = adDays;
	}
	else if( document.getElementById('vtype') ){
		document.getElementById('vtype').id = 'nvtype';
	}

	xxtc = parseInt(xxtc.toString());
	document.getElementById("actual").innerHTML = secs2Time(xxtc);
	document.getElementById("msd").textContent = mmsd.toFixed(5);
	document.getElementById("mjd").textContent = mjd.toFixed(5);

	// calendar
	document.getElementById("tyear").textContent = zyear;
	document.getElementById("tmonth").textContent = zmonth;
	document.getElementById("tsol").textContent = zdays;

	document.getElementById('lsubs').innerHTML = lSubS;
	document.getElementById('lsubsasdeg').innerHTML = convertDMS( 0, parseFloat(lSubS) )[1];


	document.getElementById('latitude').textContent = piri.actual_lat_norm[0];
	document.getElementById('longitude').textContent = piri.actual_lon_norm[0];
	document.getElementById('latitude-dir').textContent = piri.actual_lat_norm[1];
	document.getElementById('longitude-dir').textContent = piri.actual_lon_norm[1];

	// sunclock stuff
	if( config.skin == "skin_001" ){
		document.getElementById('sunrise').innerHTML = secs2Time(sunrise).substr(0,5);
		document.getElementById('sunset').innerHTML = secs2Time(sunset).substr(0,5);
		document.getElementById('daylen').innerHTML = secs2Time(sunset-sunrise).substr(0,5);
		document.getElementById('night').innerHTML = secs2Time(night).substr(0,5);
		updateSunClock(sunrise, sunset, xxtc);
	}

	// v1.1 skins
	ltst = parseInt(ltst.toString());
	document.getElementById('ltst').innerHTML = secs2Time(ltst);
}

	function solar_angle( l_s, nu_m, eot, jd_tt, piri ){
		var mst = (24*( ((jd_tt - 2451549.5) / 1.0274912517) + 44796.0 - 0.0009626 ))%24;
		var lon = piri.actual_lon;
		if( normaliseEastWest(piri.actual_lon) == "E" ){
			lon = 360 - lon;
		}
		lon = lon*(24/360);
		var lmst = (mst - lon)%24;
		var soldec = asin(0.42565*sin(l_s)) + 0.25 * sin(l_s);
		//conslog(toDegreesMinutesAndSeconds(soldec));

		var ltst = lmst + eot;

		// subsolar longitude
		var subsol = mst*(360/24) + eot + 180;
		var z = acos( sin(soldec) * sin(piri.actual_lat) + cos(soldec) * cos(piri.actual_lat) * cos(piri.actual_lon - subsol) );

		var h_offset = acos( (sin(90-z) - sin(piri.actual_lat) * sin( soldec )) / (cos(piri.actual_lat) * cos( soldec )) );
		var w = (Math.atan(piri.actual_lat)) * Math.tan(soldec);

		var r = 25.19*((90-z)/100);
		if( l_s > 180 ) r = -r;
		//conslog(z);
		//conslog((90-z)/100);
		//conslog(r); /// 0.284 is 1 solar degree in planetocentric coords
		//conslog(h_offset);
		//conslog( acos(w) );
		//conslog( secs2Time(w*3600));
		//conslog(piri.actual_lon - subsol);
		//conslog(subsol);

		//return 90-z;
		return r;
	}

function updateSunClock(sunrise, sunset, curtime){
	// ctx is the context of canvas

	// each pixel equates to 7.5 minutes
	// dawn ends 30 mins after sunrise, dusk 30 mins before sunset
	// firstly, reduce times (from seconds) to minutes
	// d_length = (0 |(30/7.5)); // == 4
	//conslog(d_length);
	ctx.fillStyle = '#040536';
	ctx.fillRect( 0, daybarTop, canvas.width, canvas.height );

	daylen = (0 | ((sunset-sunrise)/60)/pix);
	dusktime = (0 | (30/pix));
	daylen -= dusktime*2;

	sunrise = (sunrise/60)+30;
	sunset = (sunset/60)-30;
	curtime /= 60;
	dawn = sunrise-30; // before dawn is night, after is day
	dusk = sunset+30;  // before dusk is day, after is night


	// force integers as we determine pixel offsets
	dawn = (0 | (dawn/pix));
	dusk = (0 | (dusk/pix));
	sunrise = (0 | (sunrise/pix));
	sunset = (0 | (sunset/pix));
	curtime = (0 | (curtime/pix));

	var grd = ctx.createLinearGradient(dawn, 0, sunrise+daylen+dusktime, daybarTop);
	grd.addColorStop(0.0, "#040536");
	grd.addColorStop(0.04, "#c1c01e");
	//grd.addColorStop(0.5, "#fffe00");
	grd.addColorStop(0.5, "#ffffff");
	grd.addColorStop(0.96, "#c1c01e");
	grd.addColorStop(1.0, "#040536");

	ctx.fillStyle = grd;
	ctx.fillRect( dawn, daybarTop, daylen+(dusktime*2), canvas.height );

	// set color of indicator based on whether it is daylight or not
	needleClr = '#fffe00';
	oneedle = '#000';
	needleSize = 8;
	hneedle = 2;
	if( curtime > dawn && curtime < sunset+dusktime ){
		// daylight
		needleClr = '#000';
		oneedle = '#fffe00';
	}

	ctx.strokeStyle = needleClr;
	ctx.beginPath();
	ctx.moveTo(curtime, canvas.height);
	ctx.lineTo(curtime, daybarTop);
	ctx.stroke();
	ctx.closePath();

	ctx.save();
	ctxx = curtime;
	ctx.translate(curtime, needleSize*1.5);
	ctx.rotate(deg45);
	ctx.fillStyle = needleClr;
	ctx.fillRect( -needleSize, -needleSize, needleSize, needleSize );

	ctx.fillStyle = oneedle;
	ctx.fillRect( (-needleSize)+(hneedle), (-needleSize)+(hneedle), hneedle*2, hneedle*2 );
	ctx.restore();
	
}

function calcMiddayAndDayLen(jd_tt, piri){
	var j2000 = jd_tt - 2451545.0;
    var msd = (((j2000 - 4.5) / 1.027491252) + 44796.0 - 0.00096);
    var mtc = (24 * msd) % 24;
    var offset = 0;
    var nu_m;
    var mars_eot;
    var h_offset;
    var latOffset;

    offset = 43200 - mtc;

    mtc += offset;
    j2000 += (offset * 1.027491252);
    jd_tt += (offset * 1.027491252);

    l_s = parseFloat(parseFloat(altGetLSubS(j2000)).toFixed(2));
    nu_m = getEquationOfCentre(j2000)[0];
    mars_eot = 2.861 * sin(2 * l_s) - 0.071 * sin(4 * l_s) + 0.002 * sin(6 * l_s) - nu_m;

    h_offset = parseFloat(solar_angle( l_s, nu_m, mars_eot*(24/360), jd_tt, piri ).toFixed(3));

    latOffset = Math.abs( piri.actual_lat - h_offset );

    var reduction = (latOffset*24)/2;

    return reduction+120; // add adjustment for solar diameter and refraction
}

function toDegreesMinutesAndSeconds(coordinate) {
    var absolute = Math.abs(coordinate);
    var degrees = Math.floor(absolute);
    var minutesNotTruncated = (absolute - degrees) * 60;
    var minutes = Math.floor(minutesNotTruncated);
    //var seconds = Math.floor((minutesNotTruncated - minutes) * 60);
    seconds = (minutesNotTruncated - minutes) * 60;

    return degrees + "&deg; " + minutes + "\' " + seconds.toFixed(1)+"\"";
}

function normaliseEastWest( lon ){
	var dir = 'E';
	if( lon < 0 ){
		dir = 'W';
		lon = Math.abs(lon);
	}
	return [lon,dir];
}

function normaliseNorthSouth( lat ){
	var dir = 'N';
	if( lat < 0 ) dir = 'S';
	lat = Math.abs(lat)%90;
	return [lat,dir];
}

function convertDMS(lat, lng, card = false) {
    var latitude = toDegreesMinutesAndSeconds(lat);
    var latitudeCardinal = lat >= 0 ? "N" : "S";

    var longitude = toDegreesMinutesAndSeconds(lng);
    var longitudeCardinal = lng >= 0 ? "E" : "W";

    if( !card ){
    	latitudeCardinal = '';
		longitudeCardinal = '';
    }
    return [latitude + " " + latitudeCardinal, longitude + " " + longitudeCardinal];
}

function radians_to_degrees(radians) {
  var pi = Math.PI;
  return radians * (180/pi);
}
function cos(deg) {
    return Math.cos(deg * Math.PI / 180);
}
function sin(deg) {
    return Math.sin(deg * Math.PI / 180);
}
function acos(deg) {
    return Math.acos(deg * Math.PI / 180);
}
function asin(deg) {
    return Math.asin(deg * Math.PI / 180);
}
function xtan(t) {
	return Math.tan(t);
}

function xcos(deg) {
    return Math.cos(deg);
}
function xsin(deg) {
    return Math.sin(deg);
}
function xacos(deg) {
    return Math.acos(deg);
}
function xasin(deg) {
    return Math.asin(deg);
}


function getMarsMonth( d ){
	m = 0;
	i = 0;
	while( martian_months[i] <= d ){
		m += 1;
		i += 1;
	}
	return m+1;
}

// this function courtesy of James Tauber
function altGetLSubS(j2000){
	var r = getEquationOfCentre(j2000);
	var nu_m = r[0];
	var m = r[1];
	var alpha_fms = r[2];
    var nu = nu_m + m;
    var l_s = (alpha_fms + nu_m) % 360;
    l_s += 0.00628; // bring into line with Mars24;
    return toFixed(l_s,5)+"&deg;";//" &nbsp; <span class=greyinfo>("+toFixed(l_s,5)+"&deg;)</span>";
}

function getEquationOfCentre(j2000){
	var m = (19.3870 + 0.52402075 * j2000) % 360;
	var alpha_fms = (270.3863 + 0.52403840 * j2000) % 360;
    var e = (0.09340 + 2.477E-9 * j2000);
    var pbs =
        0.0071 * cos((0.985626 * j2000 /  2.2353) +  49.409) +
        0.0057 * cos((0.985626 * j2000 /  2.7543) + 168.173) +
        0.0039 * cos((0.985626 * j2000 /  1.1177) + 191.837) +
        0.0037 * cos((0.985626 * j2000 / 15.7866) +  21.736) +
        0.0021 * cos((0.985626 * j2000 /  2.1354) +  15.704) +
        0.0020 * cos((0.985626 * j2000 /  2.4694) +  95.528) +
        0.0018 * cos((0.985626 * j2000 / 32.8493) +  49.095);
    var nu_m = (10.691 + 3.0E-7 * j2000) * sin(m) +
        0.623 * sin(2 * m) +
        0.050 * sin(3 * m) +
        0.005 * sin(4 * m) +
        0.0005 * sin(5 * m) +
        pbs;
    return [nu_m, m, alpha_fms];
}

function getLsubS( d ){
	mmonth = getMarsMonth( d ) - 2;
	if( mmonth < 1 ) mmonth = 10;
	mstart = martian_months[ mmonth ];
	mlength = martian_months[ mmonth+1 ] - mstart;
	mday = 30 / mlength;
	x = (d - mstart);
	x1 = 30*(getMarsMonth( d )-1);
	ret = ((x1+(x*mday)));
	ret -= 0.005; // adjustment to match Mars24
	xret = ret;
	//if( ret.toFixed(2)*1 == ret.toFixed(0)*1 ){
	if( toFixed(ret,2)*1 == toFixed(ret,0)*1 ){
		//ret = ret.toFixed(0);
		ret = toFixed(ret,0);
	}
	else {
		//if( ret.toFixed(2)*1 == ret.toFixed(1)*1 ){
		if( toFixed(ret,2)*1 == toFixed(ret,1)*1 ){
			//ret = ret.toFixed(1);
			ret = toFixed(ret,1);
		}
		else {
			//ret = ret.toFixed(2);
			ret = toFixed(ret,2);
		}
	}
	return ret+"&deg; &nbsp; <span class=greyinfo>("+toFixed(xret,13)+"&deg;)</span>";
}


// 214.7872340425532
// return value like .toFixed() but without rounding
function toFixed(num, fixed) {
    var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
}

function modifiedJulianDate( jd ) {
	//jd = (jd - 2400001);// + 0.50400;
	jd = (jd - 2400001.001) + 0.50400;
	return jd;
}

function secs2Time( seconds ){
	var h = 0;
	var m = 0;
	var s = 0;

	if( seconds >= 3600 ){
		h = parseInt( seconds / 3600 );
		//seconds -= (h*3600);
		seconds = seconds % 3600;
	}
	if( seconds >= 60 ){
		m = parseInt( seconds / 60 );
		//seconds -= (m*60);
		seconds = seconds % 60;
	}

	if( seconds ){
		s = seconds;
	}
	if( skin.seconds )	return tchunk(h)+':'+tchunk(m)+':'+tchunk(s);
	else {
		if( skin.pulse && seconds && seconds % 2){
			return tchunk(h)+'<span class=pulse-show>:</span>'+tchunk(m);
		}
		else {
			return tchunk(h)+'<span class=pulse-hidden>:</span>'+tchunk(m);
		}
	} 

}

function altSecs2Time( seconds ){
	var h = 0;
	var m = 0;
	var s = 0;

	if( seconds > 0 ){
		s = seconds % 60;
		seconds -= s;
	}


	if( seconds > 0 ){
		m = seconds % 60;
		seconds -= m;
	}

	h = seconds;
	return tchunk(h)+':'+tchunk(m)+':'+tchunk(s);
}

function tchunk( x ){
	x = '00'+x.toString();
	return x.slice(-2);
}


function calcOffset(longitude){
	// 4 mins per degree = 240 secs
	return longitude*240;
}

function changeCSS(cssFile, cssLinkIndex){
    var oldlink = document.getElementsByTagName("link").item(cssLinkIndex);

    var newlink = document.createElement("link");
    newlink.setAttribute("rel", "stylesheet");
    newlink.setAttribute("type", "text/css");
    newlink.setAttribute("href", cssFile);

    document.getElementsByTagName("head").item(0).replaceChild(newlink, oldlink);
}

function changeBGImage(newImage){
	document.body.style.background = "url('"+newImage+"')";
	document.body.style.backgroundRepeat = "no-repeat";
	document.body.style.backgroundSize = "cover";
}

function whatisthetime(){
	let t = new Date();
	//main_clock.innerHTML = t.toLocaleTimeString([],ldopts).toLowerCase()+':<div class=secs>'+padl(t.toLocaleTimeString([],pdopts).toLowerCase())+'</div>';
	if( document.getElementById('earth_time') ){
		document.getElementById('earth_time').innerHTML = t.toLocaleTimeString([],ldopts).toLowerCase()+':<div class=secs>'+padlb(t.toLocaleTimeString([],pdopts).toLowerCase())+'</div>';
	}
}
function padl( s, n = 2, p = '0' ){
	r = s;
	if( s.length < n ){
		r = '<span class="dark">'+p.repeat(n-s.length)+'</span>'+s;
	}
	//var r = (p.repeat(n)+s).substr(-n);
	return r;
}
function padlb( s, n = 2, c  = '0'){
	return (c.repeat(n)+s).substr(-n);
}
function hideCursor(){
    document.body.style.cursor = "none"; 
}
