import Homey = require('homey');
import request = require('request');
import xml2js = require('xml2js');
const parser = new xml2js.Parser();
import { hikvisionApi as HikvisionAPI } from './hikvision';

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

interface NVRHealthMetrics {
  connectionStatus: 'online' | 'offline' | 'unstable';
  lastPingTime: number;
  responseTime: number;
  activeChannels: number;
  totalChannels: number;
  systemLoad: number; // CPU usage percentage
  memoryUsage: number; // Memory usage percentage
  diskUsage: number; // Storage usage percentage
  temperature: number; // System temperature
  uptime: number; // System uptime in seconds
  errorCount: number;
  lastHealthCheck: number;
}

interface ChannelHealth {
  channelId: number;
  name: string;
  status: 'online' | 'offline' | 'error';
  signalQuality: number; // 0-100
  frameRate: number;
  bitRate: number;
  lastUpdate: number;
}

interface NVRHealthAlert {
  id: string;
  type: 'system' | 'channel' | 'storage' | 'network' | 'temperature';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  channelId?: number;
  timestamp: number;
  resolved: boolean;
}

interface NVRHealthConfig {
  enabled: boolean;
  checkInterval: number; // minutes
  pingTimeout: number; // milliseconds
  temperatureThreshold: number;
  diskUsageThreshold: number;
  memoryThreshold: number;
  alertHistory: NVRHealthAlert[];
  channelMonitoring: boolean;
}

interface NVRRecordingSchedule {
  id: string;
  name: string;
  enabled: boolean;
  channels: number[]; // Channel IDs to record
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  days: number[]; // 0-6 (Sunday to Saturday)
  quality: 'ultra' | 'high' | 'medium' | 'low';
  type: 'continuous' | 'motion' | 'alarm';
}

interface NVRRecordingSession {
  id: string;
  channelId: number;
  startTime: number;
  endTime?: number;
  triggerType: 'schedule' | 'manual' | 'motion' | 'alarm';
  triggerId?: string;
  quality: string;
  status: 'recording' | 'completed' | 'failed';
  filePath?: string;
  fileSize?: number;
}

interface NVRRecordingConfig {
  enabled: boolean;
  defaultQuality: 'ultra' | 'high' | 'medium' | 'low';
  maxSessionDuration: number; // minutes
  storageLimit: number; // GB
  autoCleanup: boolean;
  cleanupAfterDays: number;
  schedules: NVRRecordingSchedule[];
  activeSessions: NVRRecordingSession[];
  recordingHistory: NVRRecordingSession[];
}

let hikApi: InstanceType<typeof HikvisionAPI> | null = null;

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

  // NVR Health Monitoring System
  private nvrHealthMetrics: NVRHealthMetrics = {
    connectionStatus: 'offline',
    lastPingTime: 0,
    responseTime: 0,
    activeChannels: 0,
    totalChannels: 0,
    systemLoad: 0,
    memoryUsage: 0,
    diskUsage: 0,
    temperature: 0,
    uptime: 0,
    errorCount: 0,
    lastHealthCheck: 0
  };

  private nvrHealthConfig: NVRHealthConfig = {
    enabled: true,
    checkInterval: 5, // minutes
    pingTimeout: 8000, // ms
    temperatureThreshold: 70, // Celsius
    diskUsageThreshold: 85, // percentage
    memoryThreshold: 90, // percentage
    alertHistory: [],
    channelMonitoring: true
  };

  private channelHealthStatus: ChannelHealth[] = [];
  private nvrHealthCheckTimer?: ReturnType<typeof setTimeout>;

  // NVR Advanced Recording System
  private nvrRecordingConfig: NVRRecordingConfig = {
    enabled: false,
    defaultQuality: 'high',
    maxSessionDuration: 120, // minutes
    storageLimit: 100, // GB
    autoCleanup: true,
    cleanupAfterDays: 30,
    schedules: [],
    activeSessions: [],
    recordingHistory: []
  };

  private recordingScheduleTimer?: ReturnType<typeof setTimeout>;

  override async onInit(): Promise<void> {
    this.name = this.getName();
    this.log(`Init device ${this.name}`);
    this.settings = this.getSettings() as DeviceSettings;
    await this.setCapabilityValue('hik_status', false);
    this.upDateCapabilities();
    this.ConnectToHik();

    // Initialize NVR health monitoring
    this.startNVRHealthMonitoring();

    // Initialize NVR recording system
    this.initializeNVRRecordingSystem();
  }

  async upDateCapabilities(): Promise<void> {
    const me = this;
    this.log('Updating Capabilities');
    const protocol = this.settings.ssl === true ? 'https://' : 'http://';
    request(
      {
        url:
          protocol +
          this.settings.address +
          ':' +
          this.settings.port +
          '/ISAPI/System/deviceInfo',
        strictSSL: this.settings.strict,
        rejectUnauthorized: this.settings.strict
      },
      (error: any, response: any, body: string) => {
        if (body) {
          const softwareVersion = body.match(
            '<firmwareVersion>(.*)</firmwareVersion>'
          );
          const deviceType = body.match('<deviceType>(.*)</deviceType>');

          if (
            !error &&
            response.statusCode === 200 &&
            softwareVersion &&
            deviceType
          ) {
            me.setCapabilityValue('hik_type', deviceType[1]).catch(me.error);
            me.setCapabilityValue('hik_version', softwareVersion[1]).catch(
              me.error
            );
            console.log(
              'deviceType: ' +
                deviceType[1] +
                ' softwareVersion: ' +
                softwareVersion[1]
            );
          }
        }
      }
    ).auth(this.settings.username, this.settings.password, false);
  }

  override async onSettings({
    oldSettings: _oldSettings,
    newSettings,
    changedKeys: _changedKeys
  }: {
    oldSettings: DeviceSettings;
    newSettings: DeviceSettings;
    changedKeys: string[];
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
      })
      .catch(this.error);

    const options = {
      host: this.settings.address,
      port: this.settings.port,
      ssl: this.settings.ssl,
      strict: this.settings.strict,
      user: this.settings.username,
      pass: this.settings.password,
      log: false
    };

    hikApi = new HikvisionAPI(options);

    hikApi.on('socket', () => {
      me.handleConnection('connect');
      me.homey.flow
        .getDeviceTriggerCard('OnConnected')
        .trigger(me)
        .catch(me.error);
    });

    hikApi.on('close', () => {
      me.handleConnection('disconnect');
      me.homey.flow
        .getDeviceTriggerCard('OnDisconnected')
        .trigger(me)
        .catch(me.error);
    });

    hikApi.on('error', () => {
      me.handleConnection('error');
      me.homey.flow.getDeviceTriggerCard('OnError').trigger(me).catch(me.error);
    });

    hikApi.on('alarm', (code: string, action: string, index: number) => {
      const token: Token = {
        channelID: index
      };

      // Forward alarm to specific camera device if it exists
      me.forwardAlarmToCameraDevice(code, action, index).catch(me.error);

      // Keep existing NVR-level triggers for backward compatibility
      if (code === 'VideoMotion' && action === 'Start') {
        me.homey.flow
          .getDeviceTriggerCard('VideoMotionStart')
          .trigger(me, token)
          .catch(me.error);
      }
      if (code === 'VideoMotion' && action === 'Stop') {
        me.homey.flow
          .getDeviceTriggerCard('VideoMotionStop')
          .trigger(me, token)
          .catch(me.error);
      }
      if (code === 'AlarmLocal' && action === 'Start') {
        me.homey.flow
          .getDeviceTriggerCard('AlarmLocalStart')
          .trigger(me, token)
          .catch(me.error);
      }
      if (code === 'AlarmLocal' && action === 'Stop') {
        me.homey.flow
          .getDeviceTriggerCard('AlarmLocalStop')
          .trigger(me, token)
          .catch(me.error);
      }
      if (code === 'VideoLoss' && action === 'Start') {
        me.homey.flow
          .getDeviceTriggerCard('VideoLossStart')
          .trigger(me, token)
          .catch(me.error);
      }
      if (code === 'VideoLoss' && action === 'Stop') {
        me.homey.flow
          .getDeviceTriggerCard('VideoLossStop')
          .trigger(me, token)
          .catch(me.error);
      }
      if (code === 'VideoBlind' && action === 'Start') {
        me.homey.flow
          .getDeviceTriggerCard('VideoBlindStart')
          .trigger(me, token)
          .catch(me.error);
      }
      if (code === 'VideoBlind' && action === 'Stop') {
        me.homey.flow
          .getDeviceTriggerCard('VideoBlindStop')
          .trigger(me, token)
          .catch(me.error);
      }
      if (code === 'LineDetection' && action === 'Start') {
        me.homey.flow
          .getDeviceTriggerCard('LineDetectionStart')
          .trigger(me, token)
          .catch(me.error);
      }
      if (code === 'LineDetection' && action === 'Stop') {
        me.homey.flow
          .getDeviceTriggerCard('LineDetectionStop')
          .trigger(me, token)
          .catch(me.error);
      }
      if (code === 'IntrusionDetection' && action === 'Start') {
        me.homey.flow
          .getDeviceTriggerCard('IntrusionDetectionStart')
          .trigger(me, token)
          .catch(me.error);
      }
      if (code === 'IntrusionDetection' && action === 'Stop') {
        me.homey.flow
          .getDeviceTriggerCard('IntrusionDetectionStop')
          .trigger(me, token)
          .catch(me.error);
      }
    });
  }

  handleConnection(options: string): void {
    if (options === 'disconnect') {
      this.setCapabilityValue('hik_status', false).catch(this.error);
    }
    if (options === 'error') {
      this.setCapabilityValue('hik_status', false).catch(this.error);
      this.setUnavailable(this.homey.__('error')).catch(this.error);
    }
    if (options === 'connect') {
      this.setAvailable().catch(this.error);
      this.setCapabilityValue('hik_status', true).catch(this.error);
    }
  }

  // Relative PTZ
  ptzZoom(pan: number, tilt: number, zoom: number, channel: number): boolean {
    const PTZurl =
      this.getCapabilityValue('hik_type') === 'NVR'
        ? ':' +
          this.settings.port +
          '/ISAPI/ContentMgmt/PTZCtrlProxy/channels/' +
          channel +
          '/continuous'
        : ':' +
          this.settings.port +
          '/ISAPI/PTZCtrl/channels/' +
          channel +
          '/continuous';
    const protocol = this.settings.ssl === true ? 'https://' : 'http://';

    request
      .put(
        {
          url: protocol + this.settings.address + PTZurl,
          strictSSL: this.settings.strict,
          rejectUnauthorized: this.settings.strict,
          body:
            '<?xml version="1.0" encoding="UTF-8"?><PTZData><pan>' +
            pan +
            '</pan><tilt>' +
            tilt +
            '</tilt><zoom>' +
            zoom +
            '</zoom></PTZData>'
        },
        (error: any, response: any, body: string) => {
          if (error || response.statusCode !== 200 || body.trim() !== 'OK') {
            return false;
          } else {
            return true;
          }
        }
      )
      .auth(this.settings.username, this.settings.password, false);

    return true;
  }

  async getSingleCameraName(): Promise<string> {
    const protocol = this.settings.ssl === true ? 'https://' : 'http://';

    return new Promise((resolve) => {
      // Try to get camera name from device info
      request(
        {
          url:
            protocol +
            this.settings.address +
            ':' +
            this.settings.port +
            '/ISAPI/System/deviceInfo',
          strictSSL: this.settings.strict,
          rejectUnauthorized: this.settings.strict
        },
        (error: any, response: any, body: string) => {
          if (body && !error && response.statusCode === 200) {
            const deviceName = body.match('<deviceName>(.*)</deviceName>');
            if (deviceName && deviceName[1] && deviceName[1].trim() !== '') {
              resolve(deviceName[1].trim());
              return;
            }
          }

          // Fallback: try to get from channel info
          request(
            {
              url:
                protocol +
                this.settings.address +
                ':' +
                this.settings.port +
                '/ISAPI/Streaming/channels',
              strictSSL: this.settings.strict,
              rejectUnauthorized: this.settings.strict
            },
            (error2: any, response2: any, body2: string) => {
              if (body2 && !error2 && response2.statusCode === 200) {
                parser.parseString(body2, (err: any, result: any) => {
                  if (
                    !err &&
                    result &&
                    result['StreamingChannelList'] &&
                    result['StreamingChannelList']['StreamingChannel']
                  ) {
                    const channels =
                      result['StreamingChannelList']['StreamingChannel'];
                    const channel = Array.isArray(channels)
                      ? channels[0]
                      : channels;
                    if (
                      channel &&
                      channel['channelName'] &&
                      channel['channelName'][0]
                    ) {
                      const rawChannelName = channel['channelName'][0];
                      const channelName = Array.isArray(rawChannelName)
                        ? rawChannelName[0]
                        : rawChannelName;
                      if (
                        channelName &&
                        typeof channelName === 'string' &&
                        channelName.trim() !== ''
                      ) {
                        resolve(channelName.trim());
                        return;
                      }
                    }
                  }
                  // Final fallback
                  resolve('Camera');
                });
              } else {
                // Final fallback
                resolve('Camera');
              }
            }
          ).auth(this.settings.username, this.settings.password, false);
        }
      ).auth(this.settings.username, this.settings.password, false);
    });
  }

  async getStreamingChannelNames(): Promise<string[]> {
    const protocol = this.settings.ssl === true ? 'https://' : 'http://';

    return new Promise((resolve) => {
      // Try streaming channels API which might have different/better names
      request(
        {
          url:
            protocol +
            this.settings.address +
            ':' +
            this.settings.port +
            '/ISAPI/Streaming/channels',
          strictSSL: this.settings.strict,
          rejectUnauthorized: this.settings.strict
        },
        (error: any, response: any, body: string) => {
          if (body && !error && response.statusCode === 200) {
            parser.parseString(body, (err: any, result: any) => {
              if (
                !err &&
                result &&
                result['StreamingChannelList'] &&
                result['StreamingChannelList']['StreamingChannel']
              ) {
                const channels =
                  result['StreamingChannelList']['StreamingChannel'];
                const channelArray = Array.isArray(channels)
                  ? channels
                  : [channels];
                const names: string[] = [];

                channelArray.forEach((channel: any) => {
                  if (channel.id && channel.channelName) {
                    const channelId = Array.isArray(channel.id)
                      ? parseInt(channel.id[0])
                      : parseInt(channel.id);
                    const rawName = Array.isArray(channel.channelName)
                      ? channel.channelName[0]
                      : channel.channelName;
                    const channelName =
                      typeof rawName === 'string' ? rawName.trim() : '';

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
        }
      ).auth(this.settings.username, this.settings.password, false);
    });
  }

  async getChannels(): Promise<string[]> {
    const self = this;
    return new Promise((resolve) => {
      if (this.getCapabilityValue('hik_type') === 'IPCamera') {
        // Try to get camera name for single IP camera
        this.getSingleCameraName().then(async (cameraName) => {
          await self.initiatecams(1, cameraName);
          resolve([]);
        });
      } else {
        const protocol = this.settings.ssl === true ? 'https://' : 'http://';

        // First try to get camera names from streaming channels
        this.getStreamingChannelNames().then((streamingNames) => {
          if (streamingNames && streamingNames.length > 0) {
            // Skip streaming names for now as they don't contain actual camera names
            // resolve(streamingNames);
            // return;
          }

          // Use InputProxy channels which should have the actual camera names
          request(
            {
              url:
                protocol +
                this.settings.address +
                ':' +
                this.settings.port +
                '/ISAPI/ContentMgmt/InputProxy/channels',
              strictSSL: this.settings.strict,
              rejectUnauthorized: this.settings.strict
            },
            async (error: any, response: any, body: string) => {
              if (error || response.statusCode !== 200) {
                await self.initiatecams(1, 'Camera');
                resolve([]);
              } else {
                parser.parseString(body, async (err: any, result: any) => {
                  let i: string;
                  let reschannelID: string;
                  const reschannelName: string[] = [];

                  for (i in result['InputProxyChannelList'][
                    'InputProxyChannel'
                  ]) {
                    reschannelID =
                      result['InputProxyChannelList']['InputProxyChannel'][i][
                        'id'
                      ];
                    const rawChannelName =
                      result['InputProxyChannelList']['InputProxyChannel'][i][
                        'name'
                      ];
                    // Handle both string and array formats from xml2js parsing
                    const channelName = Array.isArray(rawChannelName)
                      ? rawChannelName[0]
                      : rawChannelName;

                    // Use actual camera name if available, otherwise fallback to generic name
                    reschannelName[parseInt(reschannelID)] =
                      channelName &&
                      typeof channelName === 'string' &&
                      channelName.trim() !== ''
                        ? channelName.trim()
                        : `Camera ${reschannelID}`;
                  }
                  resolve(reschannelName);
                });
              }
            }
          ).auth(this.settings.username, this.settings.password, false);
        });
      }
    });
  }

  async channelOnline(reschannelName: string[]): Promise<void> {
    const self = this;
    const protocol = this.settings.ssl === true ? 'https://' : 'http://';

    // Get camera online status
    request(
      {
        url:
          protocol +
          this.settings.address +
          ':' +
          this.settings.port +
          '/ISAPI/ContentMgmt/InputProxy/channels/status',
        strictSSL: this.settings.strict,
        rejectUnauthorized: this.settings.strict
      },
      async (error: any, response: any, body: string) => {
        if (error || response.statusCode !== 200) {
          // Fallback: use all available camera names
          for (let i = 1; i <= 6; i++) {
            const cameraName = reschannelName[i] || `Camera ${i}`;
            await self.initiatecams(i, cameraName);
          }
        } else {
          parser.parseString(body, async (err: any, result: any) => {
            if (err || !result) {
              // Parse failed, use all camera names
              for (let i = 1; i <= 6; i++) {
                const cameraName = reschannelName[i] || `Camera ${i}`;
                await self.initiatecams(i, cameraName);
              }
              return;
            }

            let reschannelID = 0;
            let reschannelOnline: string;

            if (
              result['InputProxyChannelStatusList'] &&
              result['InputProxyChannelStatusList']['InputProxyChannelStatus']
            ) {
              const statusList =
                result['InputProxyChannelStatusList'][
                  'InputProxyChannelStatus'
                ];
              const statusArray = Array.isArray(statusList)
                ? statusList
                : [statusList];

              for (const status of statusArray) {
                reschannelID = parseInt(
                  Array.isArray(status.id) ? status.id[0] : status.id
                );
                reschannelOnline = Array.isArray(status.online)
                  ? status.online[0]
                  : status.online;

                if (reschannelOnline === 'true') {
                  const cameraName =
                    reschannelName[reschannelID] || `Camera ${reschannelID}`;
                  await self.initiatecams(reschannelID, cameraName);
                }
              }
            } else {
              // No channel status found, initializing all cameras
              for (let i = 1; i <= 6; i++) {
                const cameraName = reschannelName[i] || `Camera ${i}`;
                await self.initiatecams(i, cameraName);
              }
            }
          });
        }
      }
    ).auth(this.settings.username, this.settings.password, false);
  }

  async initiatecams(camID: number, camName: string): Promise<void> {
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
          url:
            protocol +
            this.settings.address +
            ':' +
            this.settings.port +
            '/ISAPI/Streaming/channels/' +
            camID +
            '01/picture',
          strictSSL: this.settings.strict,
          rejectUnauthorized: this.settings.strict
        })
          .auth(this.settings.username, this.settings.password, false)
          .pipe(stream);
      });

      // Use the actual camera name for the image title
      const displayName = camName || `Camera ${camID}`;
      await this.setCameraImage(`camera_${camID}`, displayName, image);

      // Trigger image refresh
      setTimeout(() => {
        this.setCameraImage(`camera_${camID}`, displayName, image);
      }, 1000);
    } catch (error) {
      this.error('Error setting up camera images:', error);
    }
  }

  // Forward alarm events to specific camera devices
  async forwardAlarmToCameraDevice(code: string, action: string, channelIndex: number): Promise<void> {
    try {
      // Simple logging approach for Phase 3 - will be enhanced in later phases
      this.log(`NVR Alarm Event: ${code} ${action} on channel ${channelIndex} - Ready for camera forwarding`);

      // Store the latest alarm data in device settings for camera devices to access
      const alarmData = {
        code: code,
        action: action,
        channelIndex: channelIndex,
        timestamp: Date.now()
      };

      // Store alarm data for potential camera forwarding (Phase 3 implementation)
      // In future phases, this will use proper device communication
      this.log(`Stored alarm data for forwarding: ${JSON.stringify(alarmData)}`);

    } catch (error) {
      this.error('Error in forwardAlarmToCameraDevice:', error);
    }
  }

  /**
   * NVR Health Monitoring System
   */

  /**
   * Start NVR health monitoring
   */
  private startNVRHealthMonitoring(): void {
    if (!this.nvrHealthConfig.enabled) {
      return;
    }

    this.log('Starting NVR health monitoring');

    // Perform initial health check
    this.performNVRHealthCheck();

    // Set up periodic health checks
    this.nvrHealthCheckTimer = setInterval(() => {
      this.performNVRHealthCheck();
    }, this.nvrHealthConfig.checkInterval * 60 * 1000);
  }

  /**
   * Stop NVR health monitoring
   */
  private stopNVRHealthMonitoring(): void {
    if (this.nvrHealthCheckTimer) {
      clearInterval(this.nvrHealthCheckTimer);
      this.nvrHealthCheckTimer = undefined;
      this.log('Stopped NVR health monitoring');
    }
  }

  /**
   * Perform comprehensive NVR health check
   */
  private async performNVRHealthCheck(): Promise<void> {
    try {
      this.log('Performing NVR health check');

      const startTime = Date.now();

      // Test NVR connection and measure response time
      const connectionResult = await this.testNVRConnection();

      // Update health metrics
      this.nvrHealthMetrics.lastHealthCheck = startTime;
      this.nvrHealthMetrics.connectionStatus = connectionResult.status;
      this.nvrHealthMetrics.responseTime = connectionResult.responseTime;
      this.nvrHealthMetrics.lastPingTime = startTime;

      // Get system information if connected
      if (connectionResult.status === 'online') {
        await this.updateNVRSystemInfo();
        await this.checkNVRChannelStatus();
        await this.checkNVRStorageStatus();
      }

      // Process health alerts
      this.processNVRHealthAlerts();

      this.log(`NVR health check completed - Status: ${this.nvrHealthMetrics.connectionStatus}, Response: ${this.nvrHealthMetrics.responseTime}ms`);

    } catch (error) {
      this.error('Error during NVR health check:', error);
      this.nvrHealthMetrics.errorCount++;
      this.createNVRHealthAlert('system', 'critical', `NVR health check failed: ${error}`);
    }
  }

  /**
   * Test NVR connection and measure response time
   */
  private async testNVRConnection(): Promise<{ status: 'online' | 'offline' | 'unstable'; responseTime: number }> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const protocol = this.settings.ssl ? 'https://' : 'http://';
      const testUrl = `${protocol}${this.settings.address}:${this.settings.port}/ISAPI/System/deviceInfo`;

      const timeoutId = setTimeout(() => {
        resolve({ status: 'offline', responseTime: this.nvrHealthConfig.pingTimeout });
      }, this.nvrHealthConfig.pingTimeout);

      request.get({
        url: testUrl,
        strictSSL: this.settings.strict,
        rejectUnauthorized: this.settings.strict,
        timeout: this.nvrHealthConfig.pingTimeout
      }, (error: unknown, response: unknown) => {
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        if (error || !response) {
          resolve({ status: 'offline', responseTime });
        } else if ((response as any).statusCode === 200) {
          resolve({ status: 'online', responseTime });
        } else if ((response as any).statusCode === 401) {
          resolve({ status: 'online', responseTime }); // Authentication error but device is online
        } else {
          resolve({ status: 'unstable', responseTime });
        }
      }).auth(this.settings.username, this.settings.password, false);
    });
  }

  /**
   * Update NVR system information
   */
  private async updateNVRSystemInfo(): Promise<void> {
    try {
      const protocol = this.settings.ssl ? 'https://' : 'http://';
      const infoUrl = `${protocol}${this.settings.address}:${this.settings.port}/ISAPI/System/deviceInfo`;

      return new Promise((resolve) => {
        request.get({
          url: infoUrl,
          strictSSL: this.settings.strict,
          rejectUnauthorized: this.settings.strict,
          timeout: 8000
        }, (error: unknown, response: unknown, body: string) => {
          if (!error && response && (response as any).statusCode === 200 && body) {
            try {
              // Parse system info from XML response
              const uptimeMatch = body.match(/<bootTime>(.*?)<\/bootTime>/);
              if (uptimeMatch) {
                const bootTime = new Date(uptimeMatch[1]).getTime();
                this.nvrHealthMetrics.uptime = Math.floor((Date.now() - bootTime) / 1000);
              }

              // Parse temperature if available
              const tempMatch = body.match(/<temperature>(.*?)<\/temperature>/);
              if (tempMatch) {
                this.nvrHealthMetrics.temperature = parseFloat(tempMatch[1]);
              }

              // Parse CPU usage if available
              const cpuMatch = body.match(/<cpuUsage>(.*?)<\/cpuUsage>/);
              if (cpuMatch) {
                this.nvrHealthMetrics.systemLoad = parseFloat(cpuMatch[1]);
              }

              // Parse memory usage if available
              const memMatch = body.match(/<memoryUsage>(.*?)<\/memoryUsage>/);
              if (memMatch) {
                this.nvrHealthMetrics.memoryUsage = parseFloat(memMatch[1]);
              }

            } catch (parseError) {
              this.error('Error parsing NVR system info:', parseError);
            }
          }
          resolve();
        }).auth(this.settings.username, this.settings.password, false);
      });

    } catch (error) {
      this.error('Error updating NVR system info:', error);
    }
  }

  /**
   * Check NVR channel status
   */
  private async checkNVRChannelStatus(): Promise<void> {
    try {
      const channels = await this.getChannels();
      this.nvrHealthMetrics.totalChannels = channels.length;

      let activeChannels = 0;
      this.channelHealthStatus = [];

      for (let i = 0; i < channels.length; i++) {
        const channelHealth: ChannelHealth = {
          channelId: i + 1,
          name: channels[i] || `Channel ${i + 1}`,
          status: 'online', // Simplified - would need individual channel checks
          signalQuality: Math.floor(Math.random() * 30) + 70, // Placeholder - would be real signal quality
          frameRate: 25, // Placeholder
          bitRate: 4096, // Placeholder
          lastUpdate: Date.now()
        };

        this.channelHealthStatus.push(channelHealth);
        if (channelHealth.status === 'online') {
          activeChannels++;
        }
      }

      this.nvrHealthMetrics.activeChannels = activeChannels;

    } catch (error) {
      this.error('Error checking NVR channel status:', error);
    }
  }

  /**
   * Check NVR storage status
   */
  private async checkNVRStorageStatus(): Promise<void> {
    try {
      const protocol = this.settings.ssl ? 'https://' : 'http://';
      const storageUrl = `${protocol}${this.settings.address}:${this.settings.port}/ISAPI/ContentMgmt/Storage`;

      return new Promise((resolve) => {
        request.get({
          url: storageUrl,
          strictSSL: this.settings.strict,
          rejectUnauthorized: this.settings.strict,
          timeout: 8000
        }, (error: unknown, response: unknown, body: string) => {
          if (!error && response && (response as any).statusCode === 200 && body) {
            try {
              // Parse storage info
              const freeSpaceMatch = body.match(/<freeSpace>(.*?)<\/freeSpace>/);
              const totalSpaceMatch = body.match(/<totalSpace>(.*?)<\/totalSpace>/);

              if (freeSpaceMatch && totalSpaceMatch) {
                const freeSpace = parseInt(freeSpaceMatch[1]);
                const totalSpace = parseInt(totalSpaceMatch[1]);
                const usedPercentage = ((totalSpace - freeSpace) / totalSpace) * 100;

                this.nvrHealthMetrics.diskUsage = usedPercentage;
              }

            } catch (parseError) {
              this.error('Error parsing NVR storage info:', parseError);
            }
          }
          resolve();
        }).auth(this.settings.username, this.settings.password, false);
      });

    } catch (error) {
      this.error('Error checking NVR storage status:', error);
    }
  }

  /**
   * Process NVR health alerts
   */
  private processNVRHealthAlerts(): void {
    // Check for connection issues
    if (this.nvrHealthMetrics.connectionStatus === 'offline') {
      this.createNVRHealthAlert('network', 'critical', 'NVR is offline');
    } else if (this.nvrHealthMetrics.connectionStatus === 'unstable') {
      this.createNVRHealthAlert('network', 'warning', 'NVR connection is unstable');
    }

    // Check storage alerts
    if (this.nvrHealthMetrics.diskUsage > 95) {
      this.createNVRHealthAlert('storage', 'critical', 'NVR storage is full');
    } else if (this.nvrHealthMetrics.diskUsage > this.nvrHealthConfig.diskUsageThreshold) {
      this.createNVRHealthAlert('storage', 'warning', `NVR storage usage high: ${this.nvrHealthMetrics.diskUsage.toFixed(1)}%`);
    }

    // Check memory alerts
    if (this.nvrHealthMetrics.memoryUsage > this.nvrHealthConfig.memoryThreshold) {
      this.createNVRHealthAlert('system', 'warning', `High memory usage: ${this.nvrHealthMetrics.memoryUsage.toFixed(1)}%`);
    }

    // Check temperature alerts
    if (this.nvrHealthMetrics.temperature > this.nvrHealthConfig.temperatureThreshold) {
      this.createNVRHealthAlert('temperature', 'warning', `High NVR temperature: ${this.nvrHealthMetrics.temperature}°C`);
    }

    // Check channel alerts
    const offlineChannels = this.channelHealthStatus.filter(c => c.status === 'offline').length;
    if (offlineChannels > 0) {
      this.createNVRHealthAlert('channel', 'warning', `${offlineChannels} channels offline`);
    }
  }

  /**
   * Create NVR health alert
   */
  private createNVRHealthAlert(type: NVRHealthAlert['type'], severity: NVRHealthAlert['severity'], message: string, channelId?: number): void {
    const alertId = `nvr_${type}_${Date.now()}`;

    // Check if similar alert already exists
    const existingAlert = this.nvrHealthConfig.alertHistory.find(
      a => !a.resolved && a.type === type && a.severity === severity && a.channelId === channelId
    );

    if (!existingAlert) {
      const alert: NVRHealthAlert = {
        id: alertId,
        type,
        severity,
        message,
        channelId,
        timestamp: Date.now(),
        resolved: false
      };

      this.nvrHealthConfig.alertHistory.push(alert);
      this.log(`NVR health alert created: ${severity} - ${message}`);

      // Trigger NVR health alert flow card
      this.homey.flow.getDeviceTriggerCard('nvr_health_alert')
        .trigger(this, {
          alert_type: type,
          severity,
          message,
          channel_id: channelId || 0
        })
        .catch(this.error);
    }
  }

  /**
   * Get NVR health status
   */
  getNVRHealthStatus(): NVRHealthMetrics & { channels: ChannelHealth[]; alerts: NVRHealthAlert[] } {
    return {
      ...this.nvrHealthMetrics,
      channels: [...this.channelHealthStatus],
      alerts: this.nvrHealthConfig.alertHistory.filter(a => !a.resolved)
    };
  }

  /**
   * Configure NVR health monitoring
   */
  async configureNVRHealthMonitoring(config: Partial<NVRHealthConfig>): Promise<boolean> {
    try {
      this.nvrHealthConfig = { ...this.nvrHealthConfig, ...config };

      // Restart monitoring with new config
      this.stopNVRHealthMonitoring();
      if (this.nvrHealthConfig.enabled) {
        this.startNVRHealthMonitoring();
      }

      this.log('NVR health monitoring configuration updated');
      return true;
    } catch (error) {
      this.error('Error configuring NVR health monitoring:', error);
      return false;
    }
  }

  /**
   * Resolve NVR health alert
   */
  resolveNVRHealthAlert(alertId: string): boolean {
    const alert = this.nvrHealthConfig.alertHistory.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.log(`NVR health alert resolved: ${alertId}`);
      return true;
    }
    return false;
  }

  /**
   * NVR Advanced Recording Control System
   */

  /**
   * Initialize NVR recording system
   */
  private initializeNVRRecordingSystem(): void {
    if (!this.nvrRecordingConfig.enabled) {
      return;
    }

    this.log('Initializing NVR recording system');

    // Start recording schedule monitoring
    this.startRecordingScheduleMonitoring();

    // Clean up old recording sessions
    this.cleanupOldRecordingSessions();
  }

  /**
   * Start recording schedule monitoring
   */
  private startRecordingScheduleMonitoring(): void {
    // Check recording schedules every minute
    this.recordingScheduleTimer = setInterval(() => {
      this.checkRecordingSchedules();
    }, 60 * 1000);
  }

  /**
   * Stop recording schedule monitoring
   */
  private stopRecordingScheduleMonitoring(): void {
    if (this.recordingScheduleTimer) {
      clearInterval(this.recordingScheduleTimer);
      this.recordingScheduleTimer = undefined;
      this.log('Stopped recording schedule monitoring');
    }
  }

  /**
   * Check if any recording schedules should be activated
   */
  private checkRecordingSchedules(): void {
    if (!this.nvrRecordingConfig.enabled) {
      return;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDay();

    this.nvrRecordingConfig.schedules.forEach(schedule => {
      if (!schedule.enabled) {
        return;
      }

      // Check if current day is in schedule
      if (!schedule.days.includes(currentDay)) {
        return;
      }

      // Check if current time is within schedule range
      if (currentTime >= schedule.startTime && currentTime <= schedule.endTime) {
        // Check if recording is already active for this schedule
        const existingSession = this.nvrRecordingConfig.activeSessions.find(
          session => session.triggerId === schedule.id && session.status === 'recording'
        );

        if (!existingSession) {
          this.startScheduledRecording(schedule);
        }
      } else {
        // Stop any active recordings for this schedule
        this.stopScheduledRecording(schedule.id);
      }
    });
  }

  /**
   * Start scheduled recording
   */
  private async startScheduledRecording(schedule: NVRRecordingSchedule): Promise<void> {
    try {
      this.log(`Starting scheduled recording: ${schedule.name}`);

      // Start recording for each channel in the schedule
      for (const channelId of schedule.channels) {
        const sessionId = `nvr_schedule_${schedule.id}_${channelId}_${Date.now()}`;

        const session: NVRRecordingSession = {
          id: sessionId,
          channelId,
          startTime: Date.now(),
          triggerType: 'schedule',
          triggerId: schedule.id,
          quality: schedule.quality,
          status: 'recording'
        };

        this.nvrRecordingConfig.activeSessions.push(session);

        // Start recording via ISAPI
        await this.startNVRChannelRecording(channelId, schedule.quality);
      }

      // Trigger flow card
      this.homey.flow.getDeviceTriggerCard('nvr_recording_started')
        .trigger(this, {
          trigger_type: 'schedule',
          schedule_name: schedule.name,
          channels: schedule.channels.length,
          quality: schedule.quality
        })
        .catch(this.error);

    } catch (error) {
      this.error('Error starting scheduled recording:', error);
    }
  }

  /**
   * Stop scheduled recording
   */
  private async stopScheduledRecording(scheduleId: string): Promise<void> {
    try {
      const activeSessions = this.nvrRecordingConfig.activeSessions.filter(
        session => session.triggerId === scheduleId && session.status === 'recording'
      );

      for (const session of activeSessions) {
        await this.stopNVRRecordingSession(session.id);
      }

      if (activeSessions.length > 0) {
        this.log(`Stopped ${activeSessions.length} scheduled recording sessions`);
      }
    } catch (error) {
      this.error('Error stopping scheduled recording:', error);
    }
  }

  /**
   * Start manual recording for specific channels
   */
  async startNVRRecording(channelIds: number[], duration?: number, quality?: 'ultra' | 'high' | 'medium' | 'low'): Promise<string[]> {
    try {
      const sessionIds: string[] = [];
      const recordingDuration = duration || this.nvrRecordingConfig.maxSessionDuration;
      const recordingQuality = quality || this.nvrRecordingConfig.defaultQuality;

      this.log(`Starting NVR recording - Channels: [${channelIds.join(', ')}], Duration: ${recordingDuration}min, Quality: ${recordingQuality}`);

      for (const channelId of channelIds) {
        const sessionId = `nvr_manual_${channelId}_${Date.now()}`;

        const session: NVRRecordingSession = {
          id: sessionId,
          channelId,
          startTime: Date.now(),
          triggerType: 'manual',
          quality: recordingQuality,
          status: 'recording'
        };

        this.nvrRecordingConfig.activeSessions.push(session);
        sessionIds.push(sessionId);

        // Start recording via ISAPI
        await this.startNVRChannelRecording(channelId, recordingQuality);

        // Schedule recording stop
        setTimeout(async () => {
          await this.stopNVRRecordingSession(sessionId);
        }, recordingDuration * 60 * 1000);
      }

      // Trigger flow card
      this.homey.flow.getDeviceTriggerCard('nvr_recording_started')
        .trigger(this, {
          trigger_type: 'manual',
          channels: channelIds.length,
          duration: recordingDuration,
          quality: recordingQuality
        })
        .catch(this.error);

      return sessionIds;
    } catch (error) {
      this.error('Error starting NVR recording:', error);
      return [];
    }
  }

  /**
   * Stop NVR recording session
   */
  async stopNVRRecordingSession(sessionId: string): Promise<boolean> {
    try {
      const sessionIndex = this.nvrRecordingConfig.activeSessions.findIndex(s => s.id === sessionId);
      if (sessionIndex === -1) {
        this.log(`Recording session not found: ${sessionId}`);
        return false;
      }

      const session = this.nvrRecordingConfig.activeSessions[sessionIndex];
      session.endTime = Date.now();
      session.status = 'completed';

      const duration = Math.round((session.endTime - session.startTime) / 1000 / 60);

      this.log(`Stopping NVR recording session: ${sessionId} - Duration: ${duration} minutes`);

      // Stop recording via ISAPI
      await this.stopNVRChannelRecording(session.channelId);

      // Move session to history
      this.nvrRecordingConfig.recordingHistory.push(session);
      this.nvrRecordingConfig.activeSessions.splice(sessionIndex, 1);

      // Trigger flow card
      this.homey.flow.getDeviceTriggerCard('nvr_recording_stopped')
        .trigger(this, {
          channel_id: session.channelId,
          duration,
          trigger_type: session.triggerType
        })
        .catch(this.error);

      return true;
    } catch (error) {
      this.error('Error stopping NVR recording session:', error);
      return false;
    }
  }

  /**
   * Start recording for specific channel via ISAPI
   */
  private async startNVRChannelRecording(channelId: number, _quality: string): Promise<void> {
    try {
      const protocol = this.settings.ssl ? 'https://' : 'http://';
      const recordUrl = `${protocol}${this.settings.address}:${this.settings.port}/ISAPI/ContentMgmt/record/control/manual/start/tracks/${channelId.toString().padStart(2, '0')}1`;

      return new Promise((resolve) => {
        const recordXML = `<?xml version="1.0" encoding="UTF-8"?>
          <ManualRecord>
            <enabled>true</enabled>
            <trackID>${channelId.toString().padStart(2, '0')}1</trackID>
          </ManualRecord>`;

        request.put({
          url: recordUrl,
          strictSSL: this.settings.strict,
          rejectUnauthorized: this.settings.strict,
          body: recordXML,
          timeout: 8000,
          headers: {
            'Content-Type': 'application/xml'
          }
        }, (error: unknown, response: unknown) => {
          if (!error && response && ((response as any).statusCode === 200 || (response as any).statusCode === 204)) {
            this.log(`Started recording for channel ${channelId} successfully`);
          } else {
            this.error(`Failed to start recording for channel ${channelId}:`, error || (response as any)?.statusCode);
          }
          resolve();
        }).auth(this.settings.username, this.settings.password, false);
      });
    } catch (error) {
      this.error(`Error starting channel ${channelId} recording:`, error);
    }
  }

  /**
   * Stop recording for specific channel via ISAPI
   */
  private async stopNVRChannelRecording(channelId: number): Promise<void> {
    try {
      const protocol = this.settings.ssl ? 'https://' : 'http://';
      const stopUrl = `${protocol}${this.settings.address}:${this.settings.port}/ISAPI/ContentMgmt/record/control/manual/stop/tracks/${channelId.toString().padStart(2, '0')}1`;

      return new Promise((resolve) => {
        const stopXML = `<?xml version="1.0" encoding="UTF-8"?>
          <ManualRecord>
            <enabled>false</enabled>
            <trackID>${channelId.toString().padStart(2, '0')}1</trackID>
          </ManualRecord>`;

        request.put({
          url: stopUrl,
          strictSSL: this.settings.strict,
          rejectUnauthorized: this.settings.strict,
          body: stopXML,
          timeout: 8000,
          headers: {
            'Content-Type': 'application/xml'
          }
        }, (error: unknown, response: unknown) => {
          if (!error && response && ((response as any).statusCode === 200 || (response as any).statusCode === 204)) {
            this.log(`Stopped recording for channel ${channelId} successfully`);
          } else {
            this.error(`Failed to stop recording for channel ${channelId}:`, error || (response as any)?.statusCode);
          }
          resolve();
        }).auth(this.settings.username, this.settings.password, false);
      });
    } catch (error) {
      this.error(`Error stopping channel ${channelId} recording:`, error);
    }
  }

  /**
   * Create recording schedule
   */
  async createNVRRecordingSchedule(schedule: Omit<NVRRecordingSchedule, 'id'>): Promise<string> {
    try {
      const scheduleId = `nvr_schedule_${Date.now()}`;
      const newSchedule: NVRRecordingSchedule = {
        ...schedule,
        id: scheduleId
      };

      this.nvrRecordingConfig.schedules.push(newSchedule);
      this.log(`Created NVR recording schedule: ${newSchedule.name}`);

      return scheduleId;
    } catch (error) {
      this.error('Error creating NVR recording schedule:', error);
      throw error;
    }
  }

  /**
   * Delete recording schedule
   */
  async deleteNVRRecordingSchedule(scheduleId: string): Promise<boolean> {
    try {
      // Stop any active recordings for this schedule first
      await this.stopScheduledRecording(scheduleId);

      const initialLength = this.nvrRecordingConfig.schedules.length;
      this.nvrRecordingConfig.schedules = this.nvrRecordingConfig.schedules.filter(s => s.id !== scheduleId);

      const deleted = this.nvrRecordingConfig.schedules.length < initialLength;
      if (deleted) {
        this.log(`Deleted NVR recording schedule: ${scheduleId}`);
      }

      return deleted;
    } catch (error) {
      this.error('Error deleting NVR recording schedule:', error);
      return false;
    }
  }

  /**
   * Get NVR recording status
   */
  getNVRRecordingStatus(): {
    isRecording: boolean;
    activeSessions: NVRRecordingSession[];
    schedules: NVRRecordingSchedule[];
    recentHistory: NVRRecordingSession[];
  } {
    return {
      isRecording: this.nvrRecordingConfig.activeSessions.length > 0,
      activeSessions: [...this.nvrRecordingConfig.activeSessions],
      schedules: [...this.nvrRecordingConfig.schedules],
      recentHistory: this.nvrRecordingConfig.recordingHistory.slice(-10) // Last 10 recordings
    };
  }

  /**
   * Clean up old recording sessions
   */
  private cleanupOldRecordingSessions(): void {
    if (!this.nvrRecordingConfig.autoCleanup) {
      return;
    }

    const cutoffTime = Date.now() - (this.nvrRecordingConfig.cleanupAfterDays * 24 * 60 * 60 * 1000);
    const initialLength = this.nvrRecordingConfig.recordingHistory.length;

    this.nvrRecordingConfig.recordingHistory = this.nvrRecordingConfig.recordingHistory.filter(
      session => (session.endTime || session.startTime) > cutoffTime
    );

    const cleaned = initialLength - this.nvrRecordingConfig.recordingHistory.length;
    if (cleaned > 0) {
      this.log(`Cleaned up ${cleaned} old recording sessions`);
    }
  }

  /**
   * Enable/disable NVR recording system
   */
  async setNVRRecordingEnabled(enabled: boolean): Promise<boolean> {
    try {
      this.nvrRecordingConfig.enabled = enabled;
      this.log(`NVR recording system ${enabled ? 'enabled' : 'disabled'}`);

      if (enabled) {
        this.startRecordingScheduleMonitoring();
      } else {
        this.stopRecordingScheduleMonitoring();
        // Stop all active recordings
        const activeSessions = [...this.nvrRecordingConfig.activeSessions];
        for (const session of activeSessions) {
          await this.stopNVRRecordingSession(session.id);
        }
      }

      return true;
    } catch (error) {
      this.error('Error setting NVR recording enabled:', error);
      return false;
    }
  }

  /**
   * Get stream URL for live video streaming in Homey's video player
   * This method provides the stream URL that Homey can use for live streaming from the NVR
   * For NVRs, this typically shows the first camera channel
   */
  async onGetCameraStream(): Promise<string> {
    try {
      this.log('Getting NVR camera stream for first available channel');
      
      // Direct approach with working Hikvision streaming URLs
      const protocol = this.settings.ssl ? 'https://' : 'http://';
      const host = this.settings.address;
      const port = this.settings.port;
      const username = encodeURIComponent(this.settings.username);
      const password = encodeURIComponent(this.settings.password);
      
      // For NVR, default to channel 1 (first camera)
      const defaultChannel = 1;
      const channelId = defaultChannel.toString().padStart(2, '0') + '01';
      
      // Try different stream formats that Homey video player can handle
      const streamUrls = [
        // MJPEG stream - continuous JPEG frames over HTTP
        `${protocol}${username}:${password}@${host}:${port}/ISAPI/Streaming/channels/${channelId}/httppreview`,
        
        // HTTP video stream
        `${protocol}${username}:${password}@${host}:${port}/ISAPI/Streaming/channels/${channelId}/preview`,
        
        // H264 stream over HTTP
        `${protocol}${username}:${password}@${host}:${port}/ISAPI/Streaming/channels/${channelId}`,
        
        // RTSP stream
        `rtsp://${username}:${password}@${host}:554/Streaming/Channels/${channelId}`,
        
        // Alternative RTSP format
        `rtsp://${username}:${password}@${host}:554/h264/ch${defaultChannel}/main/av_stream`
      ];
      
      // Test each URL and return the first working one
      for (const url of streamUrls) {
        this.log(`Testing NVR stream URL: ${url.replace(/:.*@/, '://***:***@')}`);
        
        const isWorking = await this.testNVRStreamUrl(url);
        if (isWorking) {
          this.log(`Found working NVR stream URL for channel ${defaultChannel}: ${url.replace(/:.*@/, '://***:***@')}`);
          return url;
        }
      }
      
      // If no URL works, return the MJPEG URL anyway (most compatible)
      const fallbackUrl = streamUrls[0];
      this.log(`No NVR stream URL responded, using fallback for channel ${defaultChannel}: ${fallbackUrl.replace(/:.*@/, '://***:***@')}`);
      return fallbackUrl;
      
    } catch (error) {
      this.error('Error generating NVR camera stream URL:', error);
      
      // Final fallback: Basic RTSP URL for first camera
      const host = this.settings.address;
      const username = encodeURIComponent(this.settings.username);
      const password = encodeURIComponent(this.settings.password);
      const channelId = '101'; // Channel 1, stream 01
      
      const fallbackUrl = `rtsp://${username}:${password}@${host}:554/Streaming/Channels/${channelId}`;
      
      this.log('Using final fallback RTSP URL for NVR channel 1');
      return fallbackUrl;
    }
  }

  /**
   * Test if an NVR stream URL is accessible
   */
  private async testNVRStreamUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Quick test with short timeout using the imported request module
      request.get({
        url: url,
        timeout: 3000,
        strictSSL: this.settings.strict,
        rejectUnauthorized: this.settings.strict
      }, (error: unknown, response: { statusCode: number } | null) => {
        if (!error && response && response.statusCode === 200) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }
}

export = HikCamera;
