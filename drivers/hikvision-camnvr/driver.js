// Driver.js
'use strict';

const Homey = require('homey');
const net = require('net');
const Hikhelper = require('./hik.js');
var HikvisionAPI = require('node-hikvision-api').hikvisionApi;

class HikvisionDriver extends Homey.Driver {

    onInit() { 
        this.log('Init driver');

        this.registerFlowCards();

       

        new Homey.FlowCardAction('zoom')
        .register()
        .registerRunListener(( args, state ) => {     
                    if (args.device) {
                        return Promise.resolve(args.device.ptzZoom(args.zoomnumber, args.channel));
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
			console.log(data);
            Hikhelper.GetDeviceName(data.address,data.username,data.password,data.port,data.ssl,data.strict).then( result => {
                console.log(result);
                callback(false,result);
            })
            .catch( err => {
                console.log(err);
                callback(err,err);
            });    
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
