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
		};
    }

    onPair(socket) {
        socket.on('testConnection', function(data, callback) {

			
        var protocol = data.ssl == true ? 'https://' : 'http://';
        request({url: protocol + data.address + ':' + data.port + '/ISAPI/System/deviceInfo', strictSSL: data.strict, rejectUnauthorized: data.strict},function (error, response, body) {
			if(body){
			var deviceName = body.match("<deviceName>(.*)</deviceName>");
			var deviceID = body.match("<deviceID>(.*)</deviceID>");
	
            if ((error) || (response.statusCode !== 200)) {
                if (response.statusCode) 
				callback(response.statusCode);
                else 
                    callback('404');
            } else {
				
			var deviceCallback = {};
				deviceCallback.name = deviceName[1];
				deviceCallback.id = deviceID[1];
               callback(false, deviceCallback);
            }
			}
			else
			{
			callback('404');
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
