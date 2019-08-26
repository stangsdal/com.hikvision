'use strict';

const Homey = require('homey');
const request = require('request');

class HikvisionDriver extends Homey.Driver {

    onInit() { 
        this.log('Init driver');

        this.registerFlowCards();

       

        new Homey.FlowCardAction('ptzcontinuous')
        .register()
        .registerRunListener(( args, state ) => {     
                    if (args.device) {
                        return Promise.resolve(args.device.ptzZoom(args.pannumber,args.tiltnumber,args.zoomnumber, args.channel));
                    }
                    return Promise.resolve( true );         
        })  
 
		
      

    }

    registerFlowCards() {
        this._triggers = {
			trgOnConnected: new Homey.FlowCardTriggerDevice('OnConnected').register(),
			trgOnDisconnected: new Homey.FlowCardTriggerDevice('OnDisconnected').register(),
			trgOnError: new Homey.FlowCardTriggerDevice('OnError').register(),
			trgTVideoMotionStart: new Homey.FlowCardTriggerDevice('VideoMotionStart').register(),
			trgVideoMotionStop: new Homey.FlowCardTriggerDevice('VideoMotionStop').register(),
			trgAlarmLocalStart: new Homey.FlowCardTriggerDevice('AlarmLocalStart').register(),
			trgAlarmLocalStop: new Homey.FlowCardTriggerDevice('AlarmLocalStop').register(),
			trgVideoLossStart: new Homey.FlowCardTriggerDevice('VideoLossStart').register(),
			trgVideoLossStop: new Homey.FlowCardTriggerDevice('VideoLossStop').register(),
			trgVideoBlindStart: new Homey.FlowCardTriggerDevice('VideoBlindStart').register(),
			trgVideoBlindStop: new Homey.FlowCardTriggerDevice('VideoBlindStop').register(),
			trgLineDetectionStart: new Homey.FlowCardTriggerDevice('LineDetectionStart').register(),
			trgLineDetectionStop: new Homey.FlowCardTriggerDevice('LineDetectionStop').register(),
			trgIntrusionDetectionStart: new Homey.FlowCardTriggerDevice('IntrusionDetectionStart').register(),
			trgIntrusionDetectionStop: new Homey.FlowCardTriggerDevice('IntrusionDetectionStop').register(),			
		};
    }

    onPair(socket) {
        socket.on('testConnection', function(data, callback) {

			
        var protocol = data.ssl == true ? 'https://' : 'http://';
		var checkconnect = request({url: protocol + data.address + ':' + data.port + '/ISAPI/System/deviceInfo', strictSSL: data.strict, rejectUnauthorized: data.strict, timeout: 5000},function (error, response, body) {
			if(body){
			console.log("## start test connection ##");
			console.log(protocol + data.address + data.port + data.strict + data.username);
			console.log(body);
			var deviceName = body.match("<deviceName>(.*)</deviceName>");
			var deviceID = body.match("<deviceID>(.*)</deviceID>");
	        console.log(response.statusCode);
            if ((error) || (response.statusCode !== 200)) {
			    var deviceCallback = {};
				deviceCallback.name = "";
				deviceCallback.id = "";
                if (response.statusCode)
				{
				deviceCallback.error = response.statusCode;
				callback(error, deviceCallback);
				}
                else
				{ 
			    deviceCallback.error = 404;
				callback(error, deviceCallback);
				}
            } else {
				
			var deviceCallback = {};
				deviceCallback.name = deviceName[1];
				deviceCallback.id = deviceID[1];
				deviceCallback.error = "";
               callback(false, deviceCallback);
            }
			}
			else
			{
			var deviceCallback = {};
				deviceCallback.name = "";
				deviceCallback.id = "";
				deviceCallback.error = 404;
				callback(true, deviceCallback);
			}
        }).auth(data.username,data.password,false);
		
		

        });
    }

    // this is the easiest method to overwrite, when only the template 'Drivers-Pairing-System-Views' is being used.
    onPairListDevices( data, callback ) {
        this.log("list devices");

        var devices = [];

        console.log(data);

        callback(null,'dfdf');


    }
	
	
	}



module.exports = HikvisionDriver;
