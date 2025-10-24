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
        this.upDateCapabilities();
        this.ConnectToHik();
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


    async onSettings( { oldSettings, newSettings, changedKeys } ) {

        this.settings = newSettings;


        this.upDateCapabilities();
        this.ConnectToHik();
        return true;
    }

    onAdded() {
        this.log('device added');
    }

    onDeleted() {
        this.log('device deleted');
    }

    ConnectToHik() {
const me = this;
		this.getChannels()
    	.then(async reschannelName => {
    		   	await this.channelOnline(reschannelName);
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
	me.homey.flow.getDeviceTriggerCard('OnConnected').trigger(me).catch(me.error);
   });
   hikApi.on('close', function(){ 
	me.handleConnection('disconnect')
	me.homey.flow.getDeviceTriggerCard('OnDisconnected').trigger(me).catch(me.error);
   });
   hikApi.on('error', function(){ 
	me.handleConnection('error')
	me.homey.flow.getDeviceTriggerCard('OnError').trigger(me).catch(me.error);
   });	  
hikApi.on('alarm', function(code, action, index) {
			   const token = 
			   {
				channelID: index 
				};
				 if (code === 'VideoMotion' && action === 'Start') {
                me.homey.flow.getDeviceTriggerCard('VideoMotionStart').trigger(me, token).catch(me.error);
            }
            if (code === 'VideoMotion' && action === 'Stop') {
                me.homey.flow.getDeviceTriggerCard('VideoMotionStop').trigger(me, token).catch(me.error); 
            }
            if (code === 'AlarmLocal' && action === 'Start'){
                me.homey.flow.getDeviceTriggerCard('AlarmLocalStart').trigger(me, token).catch(me.error); 
            }
            if (code === 'AlarmLocal' && action === 'Stop')	{
                me.homey.flow.getDeviceTriggerCard('AlarmLocalStop').trigger(me, token).catch(me.error);
            }	
            if (code === 'VideoLoss' && action === 'Start')	{
                me.homey.flow.getDeviceTriggerCard('VideoLossStart').trigger(me, token).catch(me.error);
            }	
            if (code === 'VideoLoss' && action === 'Stop')	{
                me.homey.flow.getDeviceTriggerCard('VideoLossStop').trigger(me, token).catch(me.error);
            }	
            if (code === 'VideoBlind' && action === 'Start'){
                me.homey.flow.getDeviceTriggerCard('VideoBlindStart').trigger(me, token).catch(me.error);
            }	
            if (code === 'VideoBlind' && action === 'Stop')	{
                me.homey.flow.getDeviceTriggerCard('VideoBlindStop').trigger(me, token).catch(me.error);
            }
            if (code === 'LineDetection' && action === 'Start'){
                me.homey.flow.getDeviceTriggerCard('LineDetectionStart').trigger(me, token).catch(me.error);
            }	
            if (code === 'LineDetection' && action === 'Stop')	{
                me.homey.flow.getDeviceTriggerCard('LineDetectionStop').trigger(me, token).catch(me.error);
            }
            if (code === 'IntrusionDetection' && action === 'Start'){
                me.homey.flow.getDeviceTriggerCard('IntrusionDetectionStart').trigger(me, token).catch(me.error);
            }	
            if (code === 'IntrusionDetection' && action === 'Stop')	{
                me.homey.flow.getDeviceTriggerCard('IntrusionDetectionStop').trigger(me, token).catch(me.error);
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
this.setCapabilityValue("hik_status", false);
this.setUnavailable(this.homey.__("error"));
}
if(options == 'connect')
{
this.setAvailable();
this.setCapabilityValue("hik_status", true);
}
}


//relative ptz
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






async getChannels()  {
var self = this;
return new Promise(async (resolve) => {
if(this.getCapabilityValue('hik_type') === 'IPCamera')
{
console.log("initsinglecam");
await self.initiatecams(1, "Camera");
}
else
{
var protocol = this.settings.ssl == true ? 'https://' : 'http://';

//get camera names
request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/ContentMgmt/InputProxy/channels", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}, async function (error, response, body) {
		if ((error) || (response.statusCode !== 200)) {
		await self.initiatecams(1, "Camera");
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

async channelOnline(reschannelName) {
var self = this;
var protocol = this.settings.ssl == true ? 'https://' : 'http://';
//get camera online
request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/ContentMgmt/InputProxy/channels/status", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}, async function (error, response, body) {
		if ((error) || (response.statusCode !== 200)) {
		for (i in reschannelName) {
		await self.initiatecams(i, reschannelName[i]);
			return true;
		}
		}
		else
		{
			parser.parseString(body, async function(err, result) {
				var i;
				var reschannelID = 0;
				var reschannelOnline;
			for (i in result['InputProxyChannelStatusList']['InputProxyChannelStatus']) {

reschannelID = result['InputProxyChannelStatusList']['InputProxyChannelStatus'][i]['id'][0];
reschannelOnline = result['InputProxyChannelStatusList']['InputProxyChannelStatus'][i]['online'][0];
if (reschannelOnline === "true")
{
await self.initiatecams(reschannelID, reschannelName[reschannelID]);
}
}
			});
		return true;
		}
	}).auth(this.settings.username,this.settings.password,false);	

}
   
   
async initiatecams(camID, camName)  {

var protocol = this.settings.ssl == true ? 'https://' : 'http://';	  
	  
if(camID == 1){	 
 this.image = await this.homey.images.createImage();
    this.image.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    return this.setCameraImage('Camera 1',  this.homey.__("[1] " + camName), this.image );
}
if(camID == 2){	  
 this.image2 = await this.homey.images.createImage();
    this.image2.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    return this.setCameraImage('Camera 2',  this.homey.__("[2] " + camName), this.image2 );
}
if(camID == 3){	  
 this.image3 = await this.homey.images.createImage();
    this.image3.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    return this.setCameraImage('Camera 3',  this.homey.__("[3] " + camName), this.image3 );
}
if(camID == 4){	  
 this.image4 = await this.homey.images.createImage();
    this.image4.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    return this.setCameraImage('Camera 4',  this.homey.__("[4] " + camName), this.image4 );
}
if(camID == 5){	  
 this.image5 = await this.homey.images.createImage();
    this.image5.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    return this.setCameraImage('Camera 5',  this.homey.__("[5] " + camName), this.image5 );
}
if(camID == 6){	  
 this.image6 = await this.homey.images.createImage();
    this.image6.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    return this.setCameraImage('Camera 6',  this.homey.__("[6] " + camName), this.image6 );
}
if(camID == 7){	  
 this.image7 = await this.homey.images.createImage();
    this.image7.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    return this.setCameraImage('Camera 7',  this.homey.__("[7] " + camName), this.image7 );
}
if(camID == 8){	  
 this.image8 = await this.homey.images.createImage();
    this.image8.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    return this.setCameraImage('Camera 8',  this.homey.__("[8] " + camName), this.image8 );
}
if(camID == 9){	  
 this.image9 = await this.homey.images.createImage();
    this.image9.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    return this.setCameraImage('Camera 9',  this.homey.__("[9] " + camName), this.image9 );
}
if(camID == 10){	  
 this.image10 = await this.homey.images.createImage();
    this.image10.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    return this.setCameraImage('Camera 10',  this.homey.__("[10] " + camName), this.image10 );
}
if(camID == 11){	  
 this.image11 = await this.homey.images.createImage();
    this.image11.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    return this.setCameraImage('Camera 11',  this.homey.__("[11] " + camName), this.image11 );
}
if(camID == 12){	  
 this.image12 = await this.homey.images.createImage();
    this.image12.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    return this.setCameraImage('Camera 12',  this.homey.__("[12] " + camName), this.image12 );
}
if(camID == 13){	  
 this.image13 = await this.homey.images.createImage();
    this.image13.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    return this.setCameraImage('Camera 13',  this.homey.__("[13] " + camName), this.image13 );
}
if(camID == 14){	  
 this.image14 = await this.homey.images.createImage();
    this.image14.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    return this.setCameraImage('Camera 14',  this.homey.__("[14] " + camName), this.image14 );
}
if(camID == 15){	  
 this.image15 = await this.homey.images.createImage();
    this.image15.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    return this.setCameraImage('Camera 15',  this.homey.__("[15] " + camName), this.image15 );
}
if(camID == 16){	  
 this.image16 = await this.homey.images.createImage();
    this.image16.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    return this.setCameraImage('Camera 16',  this.homey.__("[16] " + camName), this.image16 );
}



} 
   
   
    
}

module.exports = HikCamera;
