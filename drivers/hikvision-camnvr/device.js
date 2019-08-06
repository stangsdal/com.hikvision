// Device.js
'use strict';

const Homey = require('homey');
const request = require('request');
const xml2js = require('xml2js');
const Hikhelper = require('./hik.js');
var	parser 		= new xml2js.Parser();
var HikvisionAPI = require('node-hikvision-api').hikvisionApi;

var hikApi = null;

class HikCamera extends Homey.Device {

    async onInit() {
        this.name = this.getName();
        this.log(`Init device ${this.name}`);

        this.settings = this.getSettings();
	    this.setUnavailable(Homey.__("disconnect"));



        this.driver = await this._getDriver();
    

        this.upDateCapabilities();
		this.getChannels();
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
        this.log('Updating Capabilities');
        await  Hikhelper.GetDeviceType(this.settings.address,this.settings.username,this.settings.password,this.settings.port,this.settings.ssl,this.settings.strict).then( result => {
            this.setCapabilityValue("hik_type",result);
        }).catch( err => {
            this.log(err);
        });

        await Hikhelper.GetSoftwareVersion(this.settings.address,this.settings.username,this.settings.password,this.settings.port,this.settings.ssl,this.settings.strict).then( result => {
            this.setCapabilityValue("hik_version", result);
        })
        .catch( err => {
            this.log(err);
        });     
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
	me.handleConnection("connect")
   });
   hikApi.on('close', function(){ 
	me.handleConnection("disconnect")
   });
   hikApi.on('error', function(){ 
	me.handleDeviceConnection("error")
   });	  
hikApi.on('alarm', function(code, action, index) {
			   const token = 
			   {
				channelID: index 
				};
				 if (code === 'VideoMotion' && action === 'Start') {
                me.driver._triggers.trgTVideoMotionStart.trigger(me, token).catch(me.error).then(me.log);
            }
            if (code === 'VideoMotion' && action === 'Stop') {
                me.driver._triggers.trgVideoMotionStop.trigger(me, token).catch(me.error).then(me.log); 
            }
            if (code === 'AlarmLocal' && action === 'Start'){
                me.driver._triggers.trgAlarmLocalStart.trigger(me, token).catch(me.error).then(me.log); 
            }
            if (code === 'AlarmLocal' && action === 'Stop')	{
                me.driver._triggers.trgAlarmLocalStop.trigger(me, token).catch(me.error).then(me.log);
            }	
            if (code === 'VideoLoss' && action === 'Start')	{
                me.driver._triggers.trgVideoLossStart.trigger(me, token).catch(me.error).then(me.log);
            }	
            if (code === 'VideoLoss' && action === 'Stop')	{
                me.driver._triggers.trgVideoLossStop.trigger(me, token).catch(me.error).then(me.log);
            }	
            if (code === 'VideoBlind' && action === 'Start'){
                me.driver._triggers.trgVideoBlindStart.trigger(me, token).catch(me.error).then(me.log);
            }	
            if (code === 'VideoBlind' && action === 'Stop')	{
                me.driver._triggers.trgVideoBlindStop.trigger(me, token).catch(me.error).then(me.log);
            }
            if (code === 'LineDetection' && action === 'Start'){
                me.driver._triggers.trgLineDetectionStart.trigger(me, token).catch(me.error).then(me.log);
            }	
            if (code === 'LineDetection' && action === 'Stop')	{
                me.driver._triggers.trgLineDetectionStop.trigger(me, token).catch(me.error).then(me.log);
            }

			
				
});

      
    };
	

handleConnection(options){
if(options == "disconnect")
{
this.setUnavailable(Homey.__("disconnect"));
}
if(options == "error")
{
this.setUnavailable(Homey.__("error"));
}
if(options == "connect")
{
this.setAvailable();
}
}

  ptzZoom(multiple, channel)  {
    	var self = this;
var PTZurl = this.getCapabilityValue('hik_type') == "NVR" ? ":" + this.settings.port + "/ISAPI/ContentMgmt/PTZCtrlProxy/channels/"+ channel +"/continuous" : ":" + this.settings.port + "/ISAPI/PTZCtrl/channels/"+ channel +"/continuous";
var protocol = this.settings.ssl == true ? 'https://' : 'http://';
	request.put({url: protocol + this.settings.address + PTZurl, strictSSL: this.settings.strict, body: '<?xml version="1.0" encoding="UTF-8"?><PTZData><zoom>'+ multiple +'</zoom></PTZData>'}, function (error, response, body) {
					console.log(PTZurl + multiple);
		if ((error) || (response.statusCode !== 200) || (body.trim() !== "OK")) {
			return false;
		}
		else
		{
			console.log(PTZurl + multiple);
		return true;
		}
	}).auth(this.settings.username,this.settings.password,false);
}



getChannels()  {
var self = this;
var protocol = this.settings.ssl == true ? 'https://' : 'http://';
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}, function (error, response, body) {
		if ((error) || (response.statusCode !== 200)) {
		self.initiatecams(1);
			return true;
		}
		else
		{
			parser.parseString(body, function(err, result) {
				var i;
				var reschannelID = 0;
				var lastchannelID;
			for (i in result['StreamingChannelList']['StreamingChannel']) {
reschannelID = result['StreamingChannelList']['StreamingChannel'][i]['Video'][0]['dynVideoInputChannelID'][0];
if (reschannelID != 0 && reschannelID != lastchannelID)
{
self.initiatecams(reschannelID);
lastchannelID = reschannelID;
}

}
			
			});
		return true;
		}
	}).auth(this.settings.username,this.settings.password,false);
}
   

   
initiatecams(camID)  {
console.log(camID);	
var protocol = this.settings.ssl == true ? 'https://' : 'http://';	  
	  
if(camID == 1){	 
 this.image = new Homey.Image();
    this.image.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image.register()
    	.then(() => {
    		   	return this.setCameraImage('Camera 1',  Homey.__("Camera 1"), this.image );
				}).catch(this.error);
}
if(camID == 2){	  
 this.image2 = new Homey.Image();
    this.image2.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image2.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 2',  Homey.__("Camera 2"), this.image2 ); 
				}).catch(this.error);
}
if(camID == 3){	  
 this.image3 = new Homey.Image();
    this.image3.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image3.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 3',  Homey.__("Camera 3"), this.image3 ); 
				}).catch(this.error);
}
if(camID == 4){	  
 this.image4 = new Homey.Image();
    this.image4.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image4.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 4',  Homey.__("Camera 4"), this.image4 ); 
				}).catch(this.error);
}
if(camID == 5){	  
 this.image5 = new Homey.Image();
    this.image5.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image5.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 5',  Homey.__("Camera 5"), this.image5 ); 
				}).catch(this.error);
}
if(camID == 6){	  
 this.image6 = new Homey.Image();
    this.image6.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image6.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 6',  Homey.__("Camera 6"), this.image6 ); 
				}).catch(this.error);
}
if(camID == 7){	  
 this.image7 = new Homey.Image();
    this.image7.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image7.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 7',  Homey.__("Camera 7"), this.image7 ); 
				}).catch(this.error);
}
if(camID == 8){	  
 this.image8 = new Homey.Image();
    this.image8.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image8.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 8',  Homey.__("Camera 8"), this.image8 ); 
				}).catch(this.error);
}
if(camID == 9){	  
 this.image9 = new Homey.Image();
    this.image9.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image9.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 9',  Homey.__("Camera 9"), this.image9 ); 
				}).catch(this.error);
}
if(camID == 10){	  
 this.image10 = new Homey.Image();
    this.image10.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image10.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 10',  Homey.__("Camera 10"), this.image10 ); 
				}).catch(this.error);
}
if(camID == 11){	  
 this.image11 = new Homey.Image();
    this.image11.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image11.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 11',  Homey.__("Camera 11"), this.image11 ); 
				}).catch(this.error);
}
if(camID == 12){	  
 this.image12 = new Homey.Image();
    this.image12.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image12.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 12',  Homey.__("Camera 12"), this.image12 ); 
				}).catch(this.error);
}
if(camID == 13){	  
 this.image13 = new Homey.Image();
    this.image13.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image13.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 13',  Homey.__("Camera 13"), this.image13 ); 
				}).catch(this.error);
}
if(camID == 14){	  
 this.image14 = new Homey.Image();
    this.image14.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image14.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 14',  Homey.__("Camera 14"), this.image14 ); 
				}).catch(this.error);
}
if(camID == 15){	  
 this.image15 = new Homey.Image();
    this.image15.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image15.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 15',  Homey.__("Camera 15"), this.image15 ); 
				}).catch(this.error);
}
if(camID == 16){	  
 this.image16 = new Homey.Image();
    this.image16.setStream(async (stream) => {
	request({url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/"+ camID +"01/picture", strictSSL: this.settings.strict, rejectUnauthorized: this.settings.strict}).auth(this.settings.username,this.settings.password,false).pipe(stream);
    });
    this.image16.register()
    	.then(() => {
    		    return this.setCameraImage('Camera 16',  Homey.__("Camera 16"), this.image16 ); 
				}).catch(this.error);
}



} 
   
   
    
}

module.exports = HikCamera;
