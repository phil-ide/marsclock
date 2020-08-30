/*
    Core system
*/
const __OC_DEV_MODE__ = true;
const { app, BrowserWindow, Menu, MenuItem, ipcMain, dialog, clientRequest, net, clipboard, globalShortcut, webContents, webFrame } = require('electron');
const nativeImage = require('electron').nativeImage;
const VirtualKeyboard = require('electron-virtual-keyboard');
const https = require('https');
const {SocksClient} = require('socks');
const fs = require('fs');
const path = require('path');
const jsftp = require('jsftp');
var os = require('os');

var release = os.release().split('v7');
resources = '';
resourcesBase = '';

if( __OC_DEV_MODE__ ){
    //resources = path.normalize(__dirname+'/..');
    resources = path.normalize(__dirname);
}
else {
    //resources = path.normalize(process.resourcesPath+'/..');
    resources = path.normalize(process.resourcesPath+'/app');
}

conslog(resources);

let vkb; // keep virtual keyboard reference around to reuse.

global.isArm7l = release.length > 1;
conslog('arm: '+global.isArm7l);

/*#######################*/
global.piMarsVer    = "1.0";
global.piMarsSubver = "0";
global.piMarsBuild  = "1018";
global.respath = resources;

global.config = JSON.parse(infile('config.json'));
global.firstBoot = true;
global.bootProceed = false;
global.tdata = {};

Date.prototype.addDays=function(d){return new Date(this.valueOf()+864E5*d);};

/*#######################*/
// make sure we get the previous bulletinc before we attempt to get the next one
readBulletinC();

app.disableHardwareAcceleration();

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    };
});

ipcMain.on('console', (event, arg ) => {
    conslog(arg);
});

ipcMain.on('reload', (event, arg ) => {
    global.config = JSON.parse(arg);
    event.sender.send('load-complete', 'pong');
});

ipcMain.on('ready-to-skin', (event, arg ) => {
    // main window is 
    preliminaryStartup();
    event.sender.send('loadskin');
});

function conslog(data){
    console.log(data);
}
function preliminaryStartup(){
    setInterval( checkForNewMissionData, 86400*1000, 'interval' );
    checkForNewMissionData('immediate');
}

function createWindow(){
    // app is ready, so set timer
    size = global.config.window;
    var options = { width: size.width, height: size.height, frame: false, kiosk: global.isArm7l, backgroundColor: "#282923", webPreferences: {devTools: true, zoomFactor: 1, nodeIntegration: true} };
    // Create the browser window.
    win = new BrowserWindow( options );
    win.name = 'main';
    win.loadFile('root-0.html'); // page will load but won't load skin until instructed to do so

    // give the window rendering host a virtual keyboard 
    // note this isn't the current page, it's the host that pages are loaded into
    // so we're giving this kb to any page that needs it
    vkb = new VirtualKeyboard(win.webContents);

    // just in case, 'cos voodoo happens
    // (so we counter with wizardry)
  	win.webContents.on('crashed', (e) => {
  	    app.relaunch();
  	    app.quit();
  	});

    ipcMain.on('relaunch', (event, arg ) => {
        app.relaunch();
        app.quit();
    });

}

function date2LocalTime(date){
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  var dateLocal = new Date(date.getTime() - offsetMs);
  return dateLocal.toISOString().slice(0, 19).replace("T", " ");
}

function dNextUpdateMessage(i){
    d = new Date();
    m = d.getMonth();
    d = d.addDays(1);
    // check bulltinc on 1st of month 4 times per year *after* the leap second has been substracted
    // always check when we first boot up
    if( (global.firstBoot || d.getDate() == 1) && (global.firstBoot || m == 0 || m == 6 || m == 3 || m == 9) ){
        check4LeapSecondBulletin();
        //check4LeapSecondBulletin2();
    }
    else {
        global.firstBoot = false;
        global.bootProceed = true;
    }
}


function checkForNewMissionData( caller ){
  https.get('https://philip-p-ide.uk/updates/mission_version.json', (res) => {
    const { statusCode } = res;
    const contentType = res.headers['content-type'];

    let error;
    // Any 2xx status code signals a successful response but
    // here we're only checking for 200.
    if (statusCode !== 200) {
      error = new Error('Request Failed.\n' +
                        `Status Code: ${statusCode}`);
    } else if (!/^application\/json/.test(contentType)) {
      error = new Error('Invalid content-type.\n' +
                        `Expected application/json but received ${contentType}`);
    }
    if (error) {
      console.error(error.message);
      res.resume();
      return;
    }

    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(rawData);
        if( global.config.update < parsedData.ver ){
          global.tdata.update = parsedData.ver;
          conslog('New Data: '+parsedData.ver );
          fetchNewMissionData();
        }
        else {
          dNextUpdateMessage();
        }
      } catch (e) {
        console.error(e.message);
        dNextUpdateMessage();
      }

    });
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  });
}

function fetchNewMissionData(){

  https.get('https://philip-p-ide.uk/updates/mission_data.json', (res) => {
    const { statusCode } = res;
    const contentType = res.headers['content-type'];

    let error;
    // Any 2xx status code signals a successful response but
    // here we're only checking for 200.
    if (statusCode !== 200) {
      error = new Error('Request Failed.\n' +
                        `Status Code: ${statusCode}`);
    } else if (!/^application\/json/.test(contentType)) {
      error = new Error('Invalid content-type.\n' +
                        `Expected application/json but received ${contentType}`);
    }
    if (error) {
      console.error(error.message);
       res.resume();
      return;
    }

    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(rawData);
        //fs.writeFileSync(path.join( resources, 'mission_data.json' ), rawData);
        outfile( 'mission_data.json', rawData);
        global.config.update = global.tdata.update;
        saveConfig();
        conslog('New Data Saved');
      } catch (e) {
        console.error(e.message);
      }
      dNextUpdateMessage();
    });
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  });
}

function check4LeapSecondBulletin(){
  const chunks = [];
  
  var config = {
      host: 'hpiers.obspm.fr'
  };
  if( global.config.ftp.proxy ){
      config = {
          host: 'hpiers.obspm.fr',
          createSocket: ({port, host}, firstAction) => {
              return SocksClient.createConnection({
                  proxy: {
                      ipaddress: global.config.ftp.ipaddess,
                      port: global.config.ftp.port,
                      type: 5
                  },
                  command: 'connect',
                  destination: {
                      host,
                      port
                  }
              })
          }
      };
  }
  const ftp = new jsftp(config);
  
  ftp.get('/iers/bul/bulc/bulletinc.dat', function(err, stream) {
      if (err) console.error(err.message); // throw err;
      stream.once('close', function() {
          global.buff = chunks.join('');
          processBulletinC();
          updateComplete();
      });
      stream.on('data', (chunk) => {
          chunks.push(chunk.toString());
      });
      stream.resume();
  });
}

function updateComplete(){
    global.firstBoot = false;
    global.bootProceed = true;
    conslog("-- update complete");
}

function readBulletinC(){
    //global.buff = fs.readFileSync('bulletinc.dat',{encoding:'utf8', flag:'r'});
    //global.buff = fs.readFileSync(path.join( resources, 'bulletinc.dat' ),{encoding:'utf8', flag:'r'});
    global.buff = infile('bulletinc.dat');

    processBulletinC();
}

function processBulletinC(){
    var data = global.buff;
    var p = data.split('UTC-TAI = -');
    var p = p[1].split(' s\n')[0]*1;
    if( p > global.config.tai ){
        outfile( 'bulletinc.dat', data ); // preserve data for next boot-up
        global.config.tai = p;
        saveConfig();
        conslog('New Leap Second announced! ('+p+')');
    }
}

function saveConfig(){
    var fdata = JSON.stringify(global.config);
    outfile( 'config.json', fdata );
}

function infile( file ){
  return fs.readFileSync( path.join( resources, file ), {encoding:'utf8', flag:'r'} );
}
function outfile( file, data ){
  return fs.writeFileSync( path.join( resources, file ), data );
}
