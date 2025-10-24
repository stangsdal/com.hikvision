import Homey = require('homey');
import request = require('request');
import xml2js = require('xml2js');
const parser = new xml2js.Parser();
const HikvisionAPI = require('./hikvision.js').hikvisionApi;

interface DeviceSettings {
    ssl: boolean;
    address: string;
    port: number;
    strict: boolean;
    username: string;
    password: string;
}

interface Token {
    channelID: number;
}

let hikApi: any = null;

class HikCamera extends Homey.Device {
    private name!: string;
    private settings!: DeviceSettings;
    private image?: Homey.Image;
    private image2?: Homey.Image;
    private image3?: Homey.Image;
    private image4?: Homey.Image;
    private image5?: Homey.Image;
    private image6?: Homey.Image;
    private image7?: Homey.Image;
    private image8?: Homey.Image;
    private image9?: Homey.Image;
    private image10?: Homey.Image;
    private image11?: Homey.Image;
    private image12?: Homey.Image;
    private image13?: Homey.Image;
    private image14?: Homey.Image;
    private image15?: Homey.Image;
    private image16?: Homey.Image;

    override async onInit(): Promise<void> {
        this.name = this.getName();
        this.log(`Init device ${this.name}`);
        this.settings = this.getSettings() as DeviceSettings;
	    await this.setCapabilityValue("hik_status", false);
        this.upDateCapabilities();
        this.ConnectToHik();
    }

    async upDateCapabilities(): Promise<void> {
	    const me = this;
        this.log('Updating Capabilities');
        const protocol = this.settings.ssl === true ? 'https://' : 'http://';
        request({
            url: protocol + this.settings.address + ':' + this.settings.port + '/ISAPI/System/deviceInfo', 
            strictSSL: this.settings.strict, 
            rejectUnauthorized: this.settings.strict
        }, (error: any, response: any, body: string) => {
			if (body) {
                const softwareVersion = body.match("<firmwareVersion>(.*)</firmwareVersion>");
                const deviceType = body.match("<deviceType>(.*)</deviceType>");
                
                if (!(error) && (response.statusCode === 200) && softwareVersion && deviceType) {
                    me.setCapabilityValue("hik_type", deviceType[1]).catch(me.error);
                    me.setCapabilityValue("hik_version", softwareVersion[1]).catch(me.error);
                    console.log('deviceType: '+ deviceType[1] + ' softwareVersion: '+ softwareVersion[1]);
                }
            }
        }).auth(this.settings.username, this.settings.password, false);
    }

    override async onSettings({ oldSettings, newSettings, changedKeys }: { 
        oldSettings: DeviceSettings; 
        newSettings: DeviceSettings; 
        changedKeys: string[] 
    }): Promise<boolean> {
        this.settings = newSettings;
        this.upDateCapabilities();
        this.ConnectToHik();
        return true;
    }

    override async onAdded(): Promise<void> {
        this.log('device added');
    }

    override async onDeleted(): Promise<void> {
        this.log('device deleted');
    }

    ConnectToHik(): void {
        const me = this;
		this.getChannels()
    	.then(async (reschannelName: string[]) => {
    		   	await this.channelOnline(reschannelName);
			}).catch(this.error);
		
		const options = {
            host: this.settings.address,
            port: this.settings.port,
            ssl: this.settings.ssl,
            strict: this.settings.strict,
            user: this.settings.username,
            pass: this.settings.password,
            log: false,
        };
 
        hikApi = new HikvisionAPI(options);   
        
        hikApi.on('socket', () => { 
	        me.handleConnection('connect');
	        me.homey.flow.getDeviceTriggerCard('OnConnected').trigger(me).catch(me.error);
        });
        
        hikApi.on('close', () => { 
	        me.handleConnection('disconnect')
	        me.homey.flow.getDeviceTriggerCard('OnDisconnected').trigger(me).catch(me.error);
        });
        
        hikApi.on('error', () => { 
	        me.handleConnection('error')
	        me.homey.flow.getDeviceTriggerCard('OnError').trigger(me).catch(me.error);
        });
        
        hikApi.on('alarm', (code: string, action: string, index: number) => {
            const token: Token = {
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
    }
	
    handleConnection(options: string): void {
        if (options === 'disconnect') {
            this.setCapabilityValue("hik_status", false).catch(this.error);
        }
        if (options === 'error') {
            console.log('setunavailable');
            this.setCapabilityValue("hik_status", false).catch(this.error);
            this.setUnavailable(this.homey.__("error")).catch(this.error);
        }
        if (options === 'connect') {
            this.setAvailable().catch(this.error);
            this.setCapabilityValue("hik_status", true).catch(this.error);
        }
    }

    // Relative PTZ
    ptzZoom(pan: number, tilt: number, zoom: number, channel: number): boolean {
        const PTZurl = this.getCapabilityValue('hik_type') === "NVR" ? 
            ":" + this.settings.port + "/ISAPI/ContentMgmt/PTZCtrlProxy/channels/"+ channel +"/continuous" : 
            ":" + this.settings.port + "/ISAPI/PTZCtrl/channels/"+ channel +"/continuous";
        const protocol = this.settings.ssl === true ? 'https://' : 'http://';
        
        request.put({
            url: protocol + this.settings.address + PTZurl, 
            strictSSL: this.settings.strict,  
            rejectUnauthorized: this.settings.strict, 
            body: '<?xml version="1.0" encoding="UTF-8"?><PTZData><pan>'+ pan +'</pan><tilt>'+ tilt +'</tilt><zoom>'+ zoom +'</zoom></PTZData>'
        }, (error: any, response: any, body: string) => {
            if ((error) || (response.statusCode !== 200) || (body.trim() !== "OK")) {
                return false;
            } else {
                return true;
            }
        }).auth(this.settings.username, this.settings.password, false);
        
        return true;
    }

    async getSingleCameraName(): Promise<string> {
        const protocol = this.settings.ssl === true ? 'https://' : 'http://';
        
        return new Promise((resolve) => {
            // Try to get camera name from device info
            request({
                url: protocol + this.settings.address + ':' + this.settings.port + '/ISAPI/System/deviceInfo', 
                strictSSL: this.settings.strict, 
                rejectUnauthorized: this.settings.strict
            }, (error: any, response: any, body: string) => {
                if (body && !error && response.statusCode === 200) {
                    const deviceName = body.match("<deviceName>(.*)</deviceName>");
                    if (deviceName && deviceName[1] && deviceName[1].trim() !== '') {
                        resolve(deviceName[1].trim());
                        return;
                    }
                }
                
                // Fallback: try to get from channel info
                request({
                    url: protocol + this.settings.address + ':' + this.settings.port + '/ISAPI/Streaming/channels', 
                    strictSSL: this.settings.strict, 
                    rejectUnauthorized: this.settings.strict
                }, (error2: any, response2: any, body2: string) => {
                    if (body2 && !error2 && response2.statusCode === 200) {
                        parser.parseString(body2, (err: any, result: any) => {
                            if (!err && result && result['StreamingChannelList'] && result['StreamingChannelList']['StreamingChannel']) {
                                const channels = result['StreamingChannelList']['StreamingChannel'];
                                const channel = Array.isArray(channels) ? channels[0] : channels;
                                if (channel && channel['channelName'] && channel['channelName'][0]) {
                                    const rawChannelName = channel['channelName'][0];
                                    const channelName = Array.isArray(rawChannelName) ? rawChannelName[0] : rawChannelName;
                                    if (channelName && typeof channelName === 'string' && channelName.trim() !== '') {
                                        resolve(channelName.trim());
                                        return;
                                    }
                                }
                            }
                            // Final fallback
                            resolve("Camera");
                        });
                    } else {
                        // Final fallback
                        resolve("Camera");
                    }
                }).auth(this.settings.username, this.settings.password, false);
            }).auth(this.settings.username, this.settings.password, false);
        });
    }

    async getStreamingChannelNames(): Promise<string[]> {
        const protocol = this.settings.ssl === true ? 'https://' : 'http://';
        
        return new Promise((resolve) => {
            // Try streaming channels API which might have different/better names
            request({
                url: protocol + this.settings.address + ':' + this.settings.port + '/ISAPI/Streaming/channels', 
                strictSSL: this.settings.strict, 
                rejectUnauthorized: this.settings.strict
            }, (error: any, response: any, body: string) => {
                if (body && !error && response.statusCode === 200) {
                    console.log("Streaming channels response:", body);
                    parser.parseString(body, (err: any, result: any) => {
                        if (!err && result && result['StreamingChannelList'] && result['StreamingChannelList']['StreamingChannel']) {
                            const channels = result['StreamingChannelList']['StreamingChannel'];
                            const channelArray = Array.isArray(channels) ? channels : [channels];
                            const names: string[] = [];
                            
                            channelArray.forEach((channel: any) => {
                                if (channel.id && channel.channelName) {
                                    const channelId = Array.isArray(channel.id) ? parseInt(channel.id[0]) : parseInt(channel.id);
                                    const rawName = Array.isArray(channel.channelName) ? channel.channelName[0] : channel.channelName;
                                    const channelName = typeof rawName === 'string' ? rawName.trim() : '';
                                    
                                    console.log(`Streaming channel ${channelId}: "${channelName}"`);
                                    
                                    if (channelName && channelName !== '') {
                                        names[channelId] = channelName;
                                    }
                                }
                            });
                            
                            if (names.length > 0) {
                                resolve(names);
                                return;
                            }
                        }
                        resolve([]);
                    });
                } else {
                    resolve([]);
                }
            }).auth(this.settings.username, this.settings.password, false);
        });
    }

    async getChannels(): Promise<string[]> {
        const self = this;
        return new Promise(async (resolve) => {
            if (this.getCapabilityValue('hik_type') === 'IPCamera') {
                console.log("initsinglecam");
                // Try to get camera name for single IP camera
                const cameraName = await this.getSingleCameraName();
                await self.initiatecams(1, cameraName);
                resolve([]);
            } else {
                const protocol = this.settings.ssl === true ? 'https://' : 'http://';

                // First try to get camera names from streaming channels
                this.getStreamingChannelNames().then((streamingNames: string[]) => {
                    if (streamingNames && streamingNames.length > 0) {
                        console.log("Using streaming channel names:", streamingNames);
                        // Skip streaming names for now as they don't contain actual camera names
                        // resolve(streamingNames);
                        // return;
                    }
                    
                    // Use InputProxy channels which should have the actual camera names
                    request({
                        url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/ContentMgmt/InputProxy/channels", 
                        strictSSL: this.settings.strict, 
                        rejectUnauthorized: this.settings.strict
                    }, async (error: any, response: any, body: string) => {
                        if ((error) || (response.statusCode !== 200)) {
                            console.log("InputProxy channels failed, using default camera name");
                            await self.initiatecams(1, "Camera");
                            resolve([]);
                        } else {
                            console.log("InputProxy channels response:", body);
                            parser.parseString(body, async (err: any, result: any) => {
                                let i: string;
                                let reschannelID: string;
                                const reschannelName: string[] = [];
                                
                                for (i in result['InputProxyChannelList']['InputProxyChannel']) {
                                    reschannelID = result['InputProxyChannelList']['InputProxyChannel'][i]['id'];
                                    const rawChannelName = result['InputProxyChannelList']['InputProxyChannel'][i]['name'];
                                    // Handle both string and array formats from xml2js parsing
                                    const channelName = Array.isArray(rawChannelName) ? rawChannelName[0] : rawChannelName;
                                    
                                    // Debug logging to see what names we're getting
                                    console.log(`Channel ${reschannelID}: raw="${JSON.stringify(rawChannelName)}", processed="${channelName}"`);
                                    
                                    // Use actual camera name if available, otherwise fallback to generic name
                                    reschannelName[parseInt(reschannelID)] = channelName && 
                                        typeof channelName === 'string' && 
                                        channelName.trim() !== '' ? 
                                        channelName.trim() : `Camera ${reschannelID}`;
                                        
                                    console.log(`Channel ${reschannelID} final name: "${reschannelName[parseInt(reschannelID)]}"`);
                                }
                                resolve(reschannelName);
                            });
                        }
                    }).auth(this.settings.username, this.settings.password, false);
                });
            }
        });
    }   

    async channelOnline(reschannelName: string[]): Promise<void> {
        const self = this;
        const protocol = this.settings.ssl === true ? 'https://' : 'http://';
        
        // Get camera online status
        request({
            url: protocol  + this.settings.address + ":" + this.settings.port + "/ISAPI/ContentMgmt/InputProxy/channels/status", 
            strictSSL: this.settings.strict, 
            rejectUnauthorized: this.settings.strict
        }, async (error: any, response: any, body: string) => {
            if ((error) || (response.statusCode !== 200)) {
                console.log("Channel status failed, using all available camera names");
                for (let i = 1; i <= 6; i++) {
                    const cameraName = reschannelName[i] || `Camera ${i}`;
                    console.log(`Fallback: Initializing camera ${i} with name: "${cameraName}"`);
                    await self.initiatecams(i, cameraName);
                }
            } else {
                console.log("Channel status response:", body);
                parser.parseString(body, async (err: any, result: any) => {
                    if (err || !result) {
                        console.log("Failed to parse channel status, using all camera names");
                        for (let i = 1; i <= 6; i++) {
                            const cameraName = reschannelName[i] || `Camera ${i}`;
                            await self.initiatecams(i, cameraName);
                        }
                        return;
                    }
                    
                    let reschannelID = 0;
                    let reschannelOnline: string;
                    
                    if (result['InputProxyChannelStatusList'] && result['InputProxyChannelStatusList']['InputProxyChannelStatus']) {
                        const statusList = result['InputProxyChannelStatusList']['InputProxyChannelStatus'];
                        const statusArray = Array.isArray(statusList) ? statusList : [statusList];
                        
                        for (const status of statusArray) {
                            reschannelID = parseInt(Array.isArray(status.id) ? status.id[0] : status.id);
                            reschannelOnline = Array.isArray(status.online) ? status.online[0] : status.online;
                            
                            console.log(`Channel ${reschannelID} online status: ${reschannelOnline}`);
                            
                            if (reschannelOnline === "true") {
                                const cameraName = reschannelName[reschannelID] || `Camera ${reschannelID}`;
                                console.log(`Initializing online camera ${reschannelID} with name: "${cameraName}"`);
                                await self.initiatecams(reschannelID, cameraName);
                            }
                        }
                    } else {
                        console.log("No channel status found, initializing all cameras");
                        for (let i = 1; i <= 6; i++) {
                            const cameraName = reschannelName[i] || `Camera ${i}`;
                            await self.initiatecams(i, cameraName);
                        }
                    }
                });
            }
        }).auth(this.settings.username, this.settings.password, false);	
    }
   
    async initiatecams(camID: number, camName: string): Promise<void> {
        console.log(`Initiating camera ${camID} with name: "${camName}"`);
        const protocol = this.settings.ssl === true ? 'https://' : 'http://';	  
        
        try {
            let image: Homey.Image;
            
            switch (camID) {
                case 1:
                    this.image = await this.homey.images.createImage();
                    image = this.image;
                    break;
                case 2:
                    this.image2 = await this.homey.images.createImage();
                    image = this.image2;
                    break;
                case 3:
                    this.image3 = await this.homey.images.createImage();
                    image = this.image3;
                    break;
                case 4:
                    this.image4 = await this.homey.images.createImage();
                    image = this.image4;
                    break;
                case 5:
                    this.image5 = await this.homey.images.createImage();
                    image = this.image5;
                    break;
                case 6:
                    this.image6 = await this.homey.images.createImage();
                    image = this.image6;
                    break;
                case 7:
                    this.image7 = await this.homey.images.createImage();
                    image = this.image7;
                    break;
                case 8:
                    this.image8 = await this.homey.images.createImage();
                    image = this.image8;
                    break;
                case 9:
                    this.image9 = await this.homey.images.createImage();
                    image = this.image9;
                    break;
                case 10:
                    this.image10 = await this.homey.images.createImage();
                    image = this.image10;
                    break;
                case 11:
                    this.image11 = await this.homey.images.createImage();
                    image = this.image11;
                    break;
                case 12:
                    this.image12 = await this.homey.images.createImage();
                    image = this.image12;
                    break;
                case 13:
                    this.image13 = await this.homey.images.createImage();
                    image = this.image13;
                    break;
                case 14:
                    this.image14 = await this.homey.images.createImage();
                    image = this.image14;
                    break;
                case 15:
                    this.image15 = await this.homey.images.createImage();
                    image = this.image15;
                    break;
                case 16:
                    this.image16 = await this.homey.images.createImage();
                    image = this.image16;
                    break;
                default:
                    this.log(`Camera ${camID} not supported (max 16 cameras)`);
                    return;
            }
            
            image.setStream(async (stream: any) => {
                request({
                    url: protocol + this.settings.address + ":" + this.settings.port + "/ISAPI/Streaming/channels/" + camID + "01/picture", 
                    strictSSL: this.settings.strict, 
                    rejectUnauthorized: this.settings.strict
                }).auth(this.settings.username, this.settings.password, false).pipe(stream);
            });
            
            await this.setCameraImage(`${camName || `Camera ${camID}`}`, this.homey.__(`[${camID}] ${camName || `Camera ${camID}`}`), image);
            console.log(`Set camera image for ${camID}: name="${camName || `Camera ${camID}`}", description="${this.homey.__(`[${camID}] ${camName || `Camera ${camID}`}`)}"`);
            
        } catch (error) {
            this.error('Error setting up camera images:', error);
        }
    } 
}

export = HikCamera;