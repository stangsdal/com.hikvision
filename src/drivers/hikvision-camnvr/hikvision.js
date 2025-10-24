#!/usr/bin/nodejs
// hikvision HTTP API Module

const  	events 		= require('events');
const 	util		= require('util');
const 	request 	= require('request');
const   xml2js 		= require('xml2js');


// Define Globals
var	TRACE		= false;
var	BASEURI		= false;
var	parser 		= new xml2js.Parser();

// Module Loader
var hikvisionApi = function(options) {
	events.EventEmitter.call(this)
	this.client = this.connect(options)
	if (options.log)	TRACE = options.log;
	var protocol = options.ssl == true ? 'https://' : 'http://';
	BASEURI = protocol + options.host + ':' + options.port
	this.activeEvents	= { };
	this.triggerActive = false
};

util.inherits(hikvisionApi, events.EventEmitter);

// Attach to camera
hikvisionApi.prototype.connect = function(options) {
	var self = this;
	if(client)	client.abort();
	var protocol = options.ssl == true ? 'https://' : 'http://';
	BASEURI = protocol + options.host + ':' + options.port;
	var opts = { 
          'url' : BASEURI + '/ISAPI/Event/notification/alertStream',
          'forever' : true,
	       'strictSSL' : options.strict,
		   'rejectUnauthorized': options.strict,
          'headers': {'Accept':'multipart/x-mixed-replace'}
          };
	// Connect
        var client = request(opts).auth(options.user,options.pass,false);

	client.on('socket', function() {		
	handleConnection(self, options);
	});

	client.on('data', function(data) {
		handleData(self, data)
	});

	client.on('close', function() {		// Try to reconnect after 30s
	console.log('close');
	    setTimeout(function() { self.connect(options) }, 30000 );
		handleEnd(self)
	});

		client.on('error', function(err) {		
	    console.log('error');
		console.log(err);
		setTimeout(function() { self.connect(options) }, 60000 );
		handleError(self, err)
	});
	
	
process.on('uncaughtException', function (err) {
  console.error(err.stack);
});

	
}

// Handle alarms
function handleData(self, data) {
	parser.parseString(data, function(err, result) {
		if (result && result['EventNotificationAlert'] !== undefined) {
			var code = result['EventNotificationAlert']['eventType'][0]
			var action = result['EventNotificationAlert']['eventState'][0]
			if (result['EventNotificationAlert']['channelID']) var index = parseInt(result['EventNotificationAlert']['channelID'][0])
			if (result['EventNotificationAlert']['dynChannelID']) var index = parseInt(result['EventNotificationAlert']['dynChannelID'][0])
			var count = parseInt(result['EventNotificationAlert']['activePostCount'][0])
			// give codes returned by camera prettier and standardized description
			if (code === 'IO')               code = 'AlarmLocal';
			if (code === 'VMD')              code = 'VideoMotion';
			if (code === 'linedetection')    code = 'LineDetection';
			if (code === 'fielddetection')   code = 'IntrusionDetection';
			if (code === 'videoloss')        code = 'VideoLoss';
			if (code === 'shelteralarm')     code = 'VideoBlind';
			if (action === 'active')       action = 'Start'
			if (action === 'inactive')     action = 'Stop'

			// create and event identifier for each received event
			var eventIdentifier = code + index

			// Count 0 seems to indicate everything is fine and nothing is wrong, used as a heartbeat
			// if triggerActive is true, lets step through the activeEvents
			// If activeEvents has something, lets end those events and clear activeEvents and reset triggerActive
			if (count == 0) {
				if (self.triggerActive == true) {
					for(var i in self.activeEvents) {
						if(self.activeEvents.hasOwnProperty(i)){
							var eventDetails = self.activeEvents[i]
							if (TRACE)	console.log('Ending Event: ' + i + ' - ' + eventDetails["code"] + ' - ' + ((Date.now() - eventDetails["lasttimestamp"])/1000));
							self.emit("alarm", eventDetails["code"],'Stop', eventDetails["index"]);
						}
					}
					self.activeEvents	= {};
					self.triggerActive = false

				} else {
					// should be the most common result
					// Nothing interesting happening and we haven't seen any events
					if (TRACE)	self.emit("alarm", code,action,index);
				}
			}

			// if the first instance of an eventIdentifier, lets emit it, 
			// add to activeEvents and set triggerActive
			else if (typeof self.activeEvents[eventIdentifier] == 'undefined' || self.activeEvents[eventIdentifier] == null){
				var eventDetails = { }
				eventDetails["code"] = code
				eventDetails["index"] = index
				eventDetails["lasttimestamp"] = Date.now();

				self.activeEvents[eventIdentifier] = eventDetails
				self.emit("alarm", code,action,index);
				self.triggerActive = true

			// known active events
			} else {
				if (TRACE)	console.log('    Skipped Event: ' + code + ' ' + action + ' ' + index + ' ' + count );

				// Update lasttimestamp
				var eventDetails = { }
				eventDetails["code"] = code
				eventDetails["index"] = index
				eventDetails["lasttimestamp"] = Date.now();
				self.activeEvents[eventIdentifier] = eventDetails

				// step through activeEvents
				// if we haven't seen it in more than 2 seconds, lets end it and remove from activeEvents
				for(var i in self.activeEvents) {
					if(self.activeEvents.hasOwnProperty(i)){
						var eventDetails = self.activeEvents[i]
						if (((Date.now() - eventDetails["lasttimestamp"])/1000) > 2) {
							if (TRACE)	console.log('    Ending Event: ' + i + ' - ' + eventDetails["code"] + ' - ' + ((Date.now() - eventDetails["lasttimestamp"])/1000));
							self.emit("alarm", eventDetails["code"],'Stop', eventDetails["index"]);
							delete self.activeEvents[i]
						}
					}
				}
			}
		}
	});
}

// Handle connection
function handleConnection(self, options) {
	if (TRACE)	console.log('Connected to ' + options.host + ':' + options.port)
    	//self.socket = socket;
	self.emit("socket");
}

// Handle connection ended
function handleEnd(self) {
	if (TRACE)	console.log("Connection closed!");
	self.emit("end");
}

// Handle Errors
function handleError(self, err) {
	if (TRACE)	console.log("Connection error: " + err);
	self.emit("error", err);
}

// Prototype to see if string starts with string
String.prototype.startsWith = function (str){
	return this.slice(0, str.length) == str;
};





exports.hikvisionApi = hikvisionApi;
