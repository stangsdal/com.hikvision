'use strict';

const Homey = require('homey');
const request = require('request');

class HikvisionDriver extends Homey.Driver {

    async onInit() { 
        this.log('Init driver');

        this.registerFlowCards();

        this.homey.flow.getActionCard('ptzcontinuous')
        .registerRunListener(async ( args, state ) => {     
                    if (args.device) {
                        return args.device.ptzZoom(args.pannumber,args.tiltnumber,args.zoomnumber, args.channel);
                    }
                    return true;         
        });
    }

    registerFlowCards() {
        this._triggers = {
			trgOnConnected: this.homey.flow.getDeviceTriggerCard('OnConnected'),
			trgOnDisconnected: this.homey.flow.getDeviceTriggerCard('OnDisconnected'),
			trgOnError: this.homey.flow.getDeviceTriggerCard('OnError'),
			trgTVideoMotionStart: this.homey.flow.getDeviceTriggerCard('VideoMotionStart'),
			trgVideoMotionStop: this.homey.flow.getDeviceTriggerCard('VideoMotionStop'),
			trgAlarmLocalStart: this.homey.flow.getDeviceTriggerCard('AlarmLocalStart'),
			trgAlarmLocalStop: this.homey.flow.getDeviceTriggerCard('AlarmLocalStop'),
			trgVideoLossStart: this.homey.flow.getDeviceTriggerCard('VideoLossStart'),
			trgVideoLossStop: this.homey.flow.getDeviceTriggerCard('VideoLossStop'),
			trgVideoBlindStart: this.homey.flow.getDeviceTriggerCard('VideoBlindStart'),
			trgVideoBlindStop: this.homey.flow.getDeviceTriggerCard('VideoBlindStop'),
			trgLineDetectionStart: this.homey.flow.getDeviceTriggerCard('LineDetectionStart'),
			trgLineDetectionStop: this.homey.flow.getDeviceTriggerCard('LineDetectionStop'),
			trgIntrusionDetectionStart: this.homey.flow.getDeviceTriggerCard('IntrusionDetectionStart'),
			trgIntrusionDetectionStop: this.homey.flow.getDeviceTriggerCard('IntrusionDetectionStop'),			
		};
    }

    async onPair(session) {
        session.setHandler('testConnection', async (data) => {
			
        var protocol = data.ssl == true ? 'https://' : 'http://';
		
		return new Promise((resolve, reject) => {
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
					resolve(deviceCallback);
					}
					else
					{ 
					deviceCallback.error = 404;
					resolve(deviceCallback);
					}
				} else {
					
				var deviceCallback = {};
					deviceCallback.name = deviceName[1];
					deviceCallback.id = deviceID[1];
					deviceCallback.error = "";
				   resolve(deviceCallback);
				}
				}
				else
				{
				var deviceCallback = {};
					deviceCallback.name = "";
					deviceCallback.id = "";
					deviceCallback.error = 404;
					resolve(deviceCallback);
				}
			}).auth(data.username,data.password,false);
		});
		

        });
    }

    // this is the easiest method to overwrite, when only the template 'Drivers-Pairing-System-Views' is being used.
    async onPairListDevices( data ) {
        this.log("list devices");

        var devices = [];

        console.log(data);

        return devices;


    }
	
	
	}



module.exports = HikvisionDriver;
