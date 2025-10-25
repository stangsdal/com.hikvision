#!/usr/bin/nodejs
// hikvision HTTP API Module - TypeScript version

import { EventEmitter } from 'events';
import request = require('request');
import xml2js = require('xml2js');

// Types and interfaces
interface HikvisionOptions {
    host: string;
    port: number;
    ssl: boolean;
    strict: boolean;
    user: string;
    pass: string;
    log?: boolean;
}

interface EventDetails {
    code: string;
    index: number;
    lasttimestamp: number;
}

interface ActiveEvents {
    [key: string]: EventDetails;
}

// Define Globals
let TRACE = false;
let BASEURI = '';
const parser = new xml2js.Parser();

// Module Loader
export class HikvisionApi extends EventEmitter {
    private client?: request.Request;
    private activeEvents: ActiveEvents = {};
    private triggerActive = false;

    constructor(options: HikvisionOptions) {
        super();
        this.client = this.connect(options);
        if (options.log) {TRACE = options.log;}
        const protocol = options.ssl === true ? 'https://' : 'http://';
        BASEURI = protocol + options.host + ':' + options.port;
    }

    // Attach to camera
    private connect(options: HikvisionOptions): request.Request {
        const self = this;
        if (this.client) {this.client.abort();}

        const protocol = options.ssl === true ? 'https://' : 'http://';
        BASEURI = protocol + options.host + ':' + options.port;

        const opts: request.Options = {
            url: BASEURI + '/ISAPI/Event/notification/alertStream',
            forever: true,
            strictSSL: options.strict,
            rejectUnauthorized: options.strict,
            headers: { 'Accept': 'multipart/x-mixed-replace' }
        };

        // Connect
        const client = request(opts).auth(options.user, options.pass, false);

        client.on('socket', () => {
            this.handleConnection(self, options);
        });

        client.on('data', (data: Buffer) => {
            this.handleData(self, data);
        });

        client.on('close', () => {
            // Try to reconnect after 30s
            console.log('close');
            setTimeout(() => { self.connect(options); }, 30000);
            this.handleEnd(self);
        });

        client.on('error', (err: Error) => {
            console.log('error');
            console.log(err);
            setTimeout(() => { self.connect(options); }, 60000);
            this.handleError(self, err);
        });

        process.on('uncaughtException', (err: Error) => {
            console.error(err.stack);
        });

        return client;
    }

    // Handle alarms
    private handleData(self: HikvisionApi, data: Buffer): void {
        parser.parseString(data.toString(), (err: any, result: any) => {
            if (result && result['EventNotificationAlert'] !== undefined) {
                let code = result['EventNotificationAlert']['eventType'][0];
                let action = result['EventNotificationAlert']['eventState'][0];
                let index = 0; // Default value

                if (result['EventNotificationAlert']['channelID']) {
                    index = parseInt(result['EventNotificationAlert']['channelID'][0]);
                } else if (result['EventNotificationAlert']['dynChannelID']) {
                    index = parseInt(result['EventNotificationAlert']['dynChannelID'][0]);
                }

                const count = parseInt(result['EventNotificationAlert']['activePostCount'][0]);

                // Give codes returned by camera prettier and standardized description
                if (code === 'IO') {code = 'AlarmLocal';}
                if (code === 'VMD') {code = 'VideoMotion';}
                if (code === 'linedetection') {code = 'LineDetection';}
                if (code === 'fielddetection') {code = 'IntrusionDetection';}
                if (code === 'videoloss') {code = 'VideoLoss';}
                if (code === 'shelteralarm') {code = 'VideoBlind';}
                if (action === 'active') {action = 'Start';}
                if (action === 'inactive') {action = 'Stop';}

                // Create an event identifier for each received event
                const eventIdentifier = code + index;

                // Count 0 seems to indicate everything is fine and nothing is wrong, used as a heartbeat
                // if triggerActive is true, lets step through the activeEvents
                // If activeEvents has something, lets end those events and clear activeEvents and reset triggerActive
                if (count === 0) {
                    if (self.triggerActive === true) {
                        for (const i in self.activeEvents) {
                            if (Object.prototype.hasOwnProperty.call(self.activeEvents, i)) {
                                const eventDetails = self.activeEvents[i];
                                if (TRACE) {
                                    console.log('Ending Event: ' + i + ' - ' + eventDetails.code + ' - ' + ((Date.now() - eventDetails.lasttimestamp) / 1000));
                                }
                                self.emit('alarm', eventDetails.code, 'Stop', eventDetails.index);
                            }
                        }
                        self.activeEvents = {};
                        self.triggerActive = false;
                    } else {
                        // Should be the most common result
                        // Nothing interesting happening and we haven't seen any events
                        if (TRACE) {self.emit('alarm', code, action, index);}
                    }
                }
                // If the first instance of an eventIdentifier, lets emit it,
                // add to activeEvents and set triggerActive
                else if (typeof self.activeEvents[eventIdentifier] === 'undefined' || self.activeEvents[eventIdentifier] === null) {
                    const eventDetails: EventDetails = {
                        code: code,
                        index: index,
                        lasttimestamp: Date.now()
                    };

                    self.activeEvents[eventIdentifier] = eventDetails;
                    self.emit('alarm', code, action, index);
                    self.triggerActive = true;
                }
                // Known active events
                else {
                    if (TRACE) {
                        console.log('    Skipped Event: ' + code + ' ' + action + ' ' + index + ' ' + count);
                    }

                    // Update lasttimestamp
                    const eventDetails: EventDetails = {
                        code: code,
                        index: index,
                        lasttimestamp: Date.now()
                    };
                    self.activeEvents[eventIdentifier] = eventDetails;

                    // Step through activeEvents
                    // if we haven't seen it in more than 2 seconds, lets end it and remove from activeEvents
                    for (const i in self.activeEvents) {
                        if (Object.prototype.hasOwnProperty.call(self.activeEvents, i)) {
                            const eventDetails = self.activeEvents[i];
                            if (((Date.now() - eventDetails.lasttimestamp) / 1000) > 2) {
                                if (TRACE) {
                                    console.log('    Ending Event: ' + i + ' - ' + eventDetails.code + ' - ' + ((Date.now() - eventDetails.lasttimestamp) / 1000));
                                }
                                self.emit('alarm', eventDetails.code, 'Stop', eventDetails.index);
                                delete self.activeEvents[i];
                            }
                        }
                    }
                }
            }
        });
    }

    // Handle connection
    private handleConnection(self: HikvisionApi, options: HikvisionOptions): void {
        if (TRACE) {console.log('Connected to ' + options.host + ':' + options.port);}
        self.emit('socket');
    }

    // Handle connection ended
    private handleEnd(self: HikvisionApi): void {
        if (TRACE) {console.log('Connection closed!');}
        self.emit('end');
    }

    // Handle Errors
    private handleError(self: HikvisionApi, err: Error): void {
        if (TRACE) {console.log('Connection error: ' + err);}
        self.emit('error', err);
    }
}

// Legacy export for compatibility
export const hikvisionApi = HikvisionApi;