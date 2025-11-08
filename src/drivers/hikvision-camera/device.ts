import Homey = require('homey');
import request = require('request');

interface CameraSettings {
  channel: number;
  name: string;
  nvrDeviceId: string;
  nvrAddress: string;
  nvrPort: number;
  nvrSsl: boolean;
  nvrStrict: boolean;
  nvrUsername: string;
  nvrPassword: string;
}

class HikvisionCameraDevice extends Homey.Device {
  private settings!: CameraSettings;
  private image?: Homey.Image;
  private connectionCheckInterval?: any;

  override async onInit(): Promise<void> {
    this.log(`Init camera device: ${this.getName()}`);
    this.settings = this.getSettings() as CameraSettings;
    
    await this.setCapabilityValue('camera_status', false);
    await this.setCapabilityValue('motion_detected', false);
    
    this.setupCameraImage();
    this.startConnectionCheck();
  }

  override async onSettings({
    oldSettings: _oldSettings,
    newSettings,
    changedKeys: _changedKeys
  }: {
    oldSettings: CameraSettings;
    newSettings: CameraSettings;
    changedKeys: string[];
  }): Promise<boolean> {
    this.settings = newSettings;
    this.setupCameraImage();
    return true;
  }

  override async onAdded(): Promise<void> {
    this.log('Camera device added');
  }

  override async onDeleted(): Promise<void> {
    this.log('Camera device deleted');
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }
  }

  async setupCameraImage(): Promise<void> {
    try {
      this.image = await this.homey.images.createImage();
      
      this.image.setStream(async (stream: any) => {
        const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
        const streamUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/Streaming/channels/${this.settings.channel}01/picture`;
        
        request({
          url: streamUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          timeout: 5000,
        })
          .auth(this.settings.nvrUsername, this.settings.nvrPassword, false)
          .pipe(stream);
      });

      await this.setCameraImage('camera_live', this.settings.name, this.image);
    } catch (error) {
      this.error('Error setting up camera image:', error);
    }
  }

  startConnectionCheck(): void {
    // Check camera status every 30 seconds
    this.connectionCheckInterval = setInterval(() => {
      this.checkCameraStatus();
    }, 30000);

    // Initial check
    this.checkCameraStatus();
  }

  async checkCameraStatus(): Promise<void> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const statusUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/InputProxy/channels/${this.settings.channel}/status`;
      
      request({
        url: statusUrl,
        strictSSL: this.settings.nvrStrict,
        rejectUnauthorized: this.settings.nvrStrict,
        timeout: 5000,
      }, async (error: any, response: any, body: string) => {
        const isOnline = !error && response && response.statusCode === 200;
        
        await this.setCapabilityValue('camera_status', isOnline);
        
        if (isOnline) {
          await this.setAvailable();
        } else {
          await this.setUnavailable('Camera offline');
        }
      }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      
    } catch (error) {
      this.error('Error checking camera status:', error);
      await this.setCapabilityValue('camera_status', false);
      await this.setUnavailable('Connection error');
    }
  }

  async ptzControl(pan: number, tilt: number, zoom: number): Promise<boolean> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const ptzUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/PTZCtrlProxy/channels/${this.settings.channel}/continuous`;
      
      const body = `<?xml version="1.0" encoding="UTF-8"?><PTZData><pan>${pan}</pan><tilt>${tilt}</tilt><zoom>${zoom}</zoom></PTZData>`;
      
      return new Promise((resolve) => {
        request.put({
          url: ptzUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          body: body,
          timeout: 5000,
        }, (error: any, response: any, responseBody: string) => {
          const success = !error && response && response.statusCode === 200 && responseBody.trim() === 'OK';
          resolve(success);
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });
    } catch (error) {
      this.error('Error controlling PTZ:', error);
      return false;
    }
  }

  async takeSnapshot(): Promise<boolean> {
    try {
      if (this.image) {
        // Refresh the camera image
        await this.setCameraImage('camera_live', this.settings.name, this.image);
        return true;
      }
      return false;
    } catch (error) {
      this.error('Error taking snapshot:', error);
      return false;
    }
  }

  // Method to handle alarm events from the NVR
  handleAlarmEvent(code: string, action: string): void {
    this.log(`Camera ${this.settings.channel} alarm: ${code} - ${action}`);
    
    // Update motion detection capability
    if (code === 'VideoMotion') {
      const motionActive = action === 'Start';
      this.setCapabilityValue('motion_detected', motionActive).catch(this.error);
      
      // Trigger camera-specific flow cards
      const triggerCard = motionActive ? 'camera_motion_start' : 'camera_motion_stop';
      this.homey.flow.getDeviceTriggerCard(triggerCard)
        .trigger(this)
        .catch(this.error);
    }

    // Handle other alarm types
    if (code === 'VideoLoss') {
      const triggerCard = action === 'Start' ? 'camera_video_loss_start' : 'camera_video_loss_stop';
      this.homey.flow.getDeviceTriggerCard(triggerCard)
        .trigger(this)
        .catch(this.error);
    }

    if (code === 'VideoBlind') {
      const triggerCard = action === 'Start' ? 'camera_video_blind_start' : 'camera_video_blind_stop';
      this.homey.flow.getDeviceTriggerCard(triggerCard)
        .trigger(this)
        .catch(this.error);
    }

    if (code === 'LineDetection') {
      const triggerCard = action === 'Start' ? 'camera_line_detection_start' : 'camera_line_detection_stop';
      this.homey.flow.getDeviceTriggerCard(triggerCard)
        .trigger(this)
        .catch(this.error);
    }

    if (code === 'IntrusionDetection') {
      const triggerCard = action === 'Start' ? 'camera_intrusion_start' : 'camera_intrusion_stop';
      this.homey.flow.getDeviceTriggerCard(triggerCard)
        .trigger(this)
        .catch(this.error);
    }

    if (code === 'AlarmLocal') {
      const triggerCard = action === 'Start' ? 'camera_alarm_start' : 'camera_alarm_stop';
      this.homey.flow.getDeviceTriggerCard(triggerCard)
        .trigger(this)
        .catch(this.error);
    }
  }
}

export = HikvisionCameraDevice;