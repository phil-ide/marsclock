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
	conslog('lat/lon'+lat+'/'+lon);
	var r = marscharts.find(function (m) {
		if( lat >= 0 ) return (lat >= m[0] && lat <= m[1] && lon >= m[2] && lon <= m[3]);
		else return (lat <= m[0] && lat >= m[1] && lon >= m[2] && lon <= m[3]);
	});
	conslog(r);
	return [r[5], r[4]];
}


