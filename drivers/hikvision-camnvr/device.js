'use strict';

const Homey = require('homey');
const request = require('request');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();
const HikvisionAPI = require('./hikvision.js').hikvisionApi;

var hikApi = null;

class HikCamera extends Homey.Device {

    async onInit() {
        this.name = this.getName();
        this.log(`Init device ${this.name}`);
        this.settings = this.getSettings();
	    this.setCapabilityValue("hik_status", false);
        this.driver = await this._getDriver();
        this.upDateCapabilities();
        this.ConnectToHik();
    }

	async _getDriver() {
		return new Promise((resolve) => {
			const driver = this.getDriver();
			driver.ready(() => resolve(driver));
		});
	}

    async upDateCapabilities()
    {
	const me = this;
    this.log('Updating Capabilities');
    var protocol = this.settings.ssl == true ? 'https://' : 'http://';
        request({url: protocol + this.settings.address + ':' + this.settings.port + '/ISAPI/System/deviceInfo', strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict},function (error, response, body) {
			if(body){
			var softwareVersion = body.match("<firmwareVersion>(.*)</firmwareVersion>");
			var deviceType = body.match("<deviceType>(.*)</deviceType>");
			}
            if ((error) || (response.statusCode !== 200)) {
            } else {
             me.setCapabilityValue("hik_type", deviceType[1]);
			 me.setCapabilityValue("hik_version", softwareVersion[1]);
			   console.log('deviceType: '+ deviceType[1] + ' softwareVersion: '+ softwareVersion[1]);
            }
        }).auth(this.settings.username,this.settings.password,false);



		
}


    onSettings( oldSettingsObj, newSettingsObj, changedKeysArr, callback ) {

        this.settings = newSettingsObj;


        this.upDateCapabilities();
        this.ConnectToHik();
        callback( null, true );
    }

    onAdded() {
        this.log('device added');
    }

    onDeleted() {
        this.log('device deleted');
    }

    ConnectToHik() {
const me = this;
this.setAvailable();
		this.getChannels()
    	.then(reschannelName => {
    		   	this.channelOnline(reschannelName);
				}).catch(this.error)

        
   		
		var options = {
    host	: this.settings.address,
    port 	: this.settings.port,
    ssl 	: this.settings.ssl,
    strict 	: this.settings.strict,
    user 	: this.settings.username,
    pass 	: this.settings.password,
    log 	: false,
};
 
hikApi = new HikvisionAPI(options);   
   hikApi.on('socket', function(){ 
	me.handleConnection('connect');
	me.driver._triggers.trgOnConnected.trigger(me).catch(me.error);
   });
   hikApi.on('close', function(){ 
	me.handleConnection('disconnect')
	me.driver._triggers.trgOnDisconnected.trigger(me).catch(me.error);
   });
   hikApi.on('error', function(){ 
	me.handleConnection('error')
	me.driver._triggers.trgOnError.trigger(me).catch(me.error);
   });	  
hikApi.on('alarm', function(code, action, index) {
			   const token = 
			   {
				channelID: index 
				};
				 if (code === 'VideoMotion' && action === 'Start') {
                me.driver._triggers.trgTVideoMotionStart.trigger(me, token).catch(me.error);
            }
            if (code === 'VideoMotion' && action === 'Stop') {
                me.driver._triggers.trgVideoMotionStop.trigger(me, token).catch(me.error); 
            }
            if (code === 'AlarmLocal' && action === 'Start'){
                me.driver._triggers.trgAlarmLocalStart.trigger(me, token).catch(me.error); 
            }
            if (code === 'AlarmLocal' && action === 'Stop')	{
                me.driver._triggers.trgAlarmLocalStop.trigger(me, token).catch(me.error);
            }	
            if (code === 'VideoLoss' && action === 'Start')	{
                me.driver._triggers.trgVideoLossStart.trigger(me, token).catch(me.error);
            }	
            if (code === 'VideoLoss' && action === 'Stop')	{
                me.driver._triggers.trgVideoLossStop.trigger(me, token).catch(me.error);
            }	
            if (code === 'VideoBlind' && action === 'Start'){
                me.driver._triggers.trgVideoBlindStart.trigger(me, token).catch(me.error);
            }	
            if (code === 'VideoBlind' && action === 'Stop')	{
                me.driver._triggers.trgVideoBlindStop.trigger(me, token).catch(me.error);
            }
            if (code === 'LineDetection' && action === 'Start'){
                me.driver._triggers.trgLineDetectionStart.trigger(me, token).catch(me.error);
            }	
            if (code === 'LineDetection' && action === 'Stop')	{
                me.driver._triggers.trgLineDetectionStop.trigger(me, token).catch(me.error);
            }

			
				
});

      
    };
	

handleConnection(options){
if(options === 'disconnect')
{
this.setCapabilityValue("hik_status", false);
}
if(options === 'error')
{
console.log('setunavailable');
this.setUnavailable(Homey.__("error"));
}
if(options == 'connect')
{
this.setCapabilityValue("hik_status", true);
}
}

  ptzZoom(pan,tilt,zoom,channel)  {
    	var self = this;
var PTZurl = this.getCapabilityValue('hik_type') == "NVR" ? ":" + this.settings.port + "/ISAPI/ContentMgmt/PTZCtrlProxy/channels/"+ channel +"/continuous" : ":" + this.settings.port + "/ISAPI/PTZCtrl/channels/"+ channel +"/continuous";
var protocol = this.settings.ssl == true ? 'https://' : 'http://';
	request.put({url: protocol + this.settings.address + PTZurl, strictSSL: this.settings.strict,  rejectUnauthorized: this.settings.strict, body: '<?xml version="1.0" encoding="UTF-8"?><PTZData><pan>'+ pan +'</pan><tilt>'+ tilt +'</tilt><zoom>'+ zoom +'</zoom></PTZData>'}, function (error, response, body) {
		if ((error) || (response.statusCode !== 200) || (body.trim() !== "OK")) {
			return false;
		}
		else
		{
		return true;
		}
	}).auth(this.settings.username,this.settings.password,false);
}






getChannels()  {
var self = this;
return new Promise((resolve) => {
if(this.getCapabilityValue('hik_type') === 'IPCamera')
{
console.log("initsinglecam");
self.initiatecams(1, "Camera");
}
else
{
var protocol = this.settings.ssl == true ? 'https://' : 'http://';

//get camera names
request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/ContentMgmt/InputProxy/channels", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}, function (error, response, body) {
		if ((error) || (response.statusCode !== 200)) {
		self.initiatecams(1, "Camera");
		}
		else
		{
			parser.parseString(body, function(err, result) {
				var i;
				var reschannelID;
				var reschannelName = [];
			for (i in result['InputProxyChannelList']['InputProxyChannel']) {
reschannelID = result['InputProxyChannelList']['InputProxyChannel'][i]['id'];
reschannelName[reschannelID] = result['InputProxyChannelList']['InputProxyChannel'][i]['name'];
}
resolve(reschannelName);
			});
		}
	}).auth(this.settings.username,this.settings.password,false);
}
  })
}   

channelOnline(reschannelName) {
var self = this;
var protocol = this.settings.ssl == true ? 'https://' : 'http://';
//get camera online
request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/ContentMgmt/InputProxy/channels/status", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}, function (error, response, body) {
		if ((error) || (response.statusCode !== 200)) {
		for (i in reschannelName) {
		self.initiatecams(i, reschannelName[i]);
			return true;
		}
		}
		else
		{
			parser.parseString(body, function(err, result) {
				var i;
				var reschannelID = 0;
				var reschannelOnline;
			for (i in result['InputProxyChannelStatusList']['InputProxyChannelStatus']) {

reschannelID = result['InputProxyChannelStatusList']['InputProxyChannelStatus'][i]['id'][0];
reschannelOnline = result['InputProxyChannelStatusList']['InputProxyChannelStatus'][i]['online'][0];
if (reschannelOnline === "true")
{
self.initiatecams(reschannelID, reschannelName[reschannelID]);
}
}
console.log("InputProxy/status");
console.log(body);	
			});
		return true;
		}
	}).auth(this.settings.username,this.settings.password,false);	

}
   
   
initiatecams(camID, camName)  {

var protocol = this.settings.ssl == true ? 'https://' : 'http://';	  
	  
if(camID == 1){	 
 this.image = new Homey.Image();
    this.image.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image.register()
    	.then(() => {
    		   	return this.setCameraImage('Camera 1',  Homey.__("[1] " + camName), this.image );
				}).catch(this.error);
}
if(camID == 2){	  
 this.image2 = new Homey.Image();
    this.image2.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image2.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 2',  Homey.__("[2] " + camName), this.image2 ); 
				}).catch(this.error);
}
if(camID == 3){	  
 this.image3 = new Homey.Image();
    this.image3.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image3.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 3',  Homey.__("[3] " + camName), this.image3 ); 
				}).catch(this.error);
}
if(camID == 4){	  
 this.image4 = new Homey.Image();
    this.image4.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image4.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 4',  Homey.__("[4] " + camName), this.image4 ); 
				}).catch(this.error);
}
if(camID == 5){	  
 this.image5 = new Homey.Image();
    this.image5.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image5.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 5',  Homey.__("[5] " + camName), this.image5 ); 
				}).catch(this.error);
}
if(camID == 6){	  
 this.image6 = new Homey.Image();
    this.image6.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image6.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 6',  Homey.__("[6] " + camName), this.image6 ); 
				}).catch(this.error);
}
if(camID == 7){	  
 this.image7 = new Homey.Image();
    this.image7.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image7.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 7',  Homey.__("[7] " + camName), this.image7 ); 
				}).catch(this.error);
}
if(camID == 8){	  
 this.image8 = new Homey.Image();
    this.image8.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image8.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 8',  Homey.__("[8] " + camName), this.image8 ); 
				}).catch(this.error);
}
if(camID == 9){	  
 this.image9 = new Homey.Image();
    this.image9.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image9.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 9',  Homey.__("[9] " + camName), this.image9 ); 
				}).catch(this.error);
}
if(camID == 10){	  
 this.image10 = new Homey.Image();
    this.image10.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image10.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 10',  Homey.__("[10] " + camName), this.image10 ); 
				}).catch(this.error);
}
if(camID == 11){	  
 this.image11 = new Homey.Image();
    this.image11.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image11.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 11',  Homey.__("[11] " + camName), this.image11 ); 
				}).catch(this.error);
}
if(camID == 12){	  
 this.image12 = new Homey.Image();
    this.image12.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image12.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 12',  Homey.__("[12] " + camName), this.image12 ); 
				}).catch(this.error);
}
if(camID == 13){	  
 this.image13 = new Homey.Image();
    this.image13.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image13.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 13',  Homey.__("[13] " + camName), this.image13 ); 
				}).catch(this.error);
}
if(camID == 14){	  
 this.image14 = new Homey.Image();
    this.image14.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image14.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 14',  Homey.__("[14] " + camName), this.image14 ); 
				}).catch(this.error);
}
if(camID == 15){	  
 this.image15 = new Homey.Image();
    this.image15.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image15.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 15',  Homey.__("[15] " + camName), this.image15 ); 
				}).catch(this.error);
}
if(camID == 16){	  
 this.image16 = new Homey.Image();
    this.image16.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image16.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 16',  Homey.__("[16] " + camName), this.image16 ); 
				}).catch(this.error);
}



} 
   
   
    
}

module.exports = HikCamera;
