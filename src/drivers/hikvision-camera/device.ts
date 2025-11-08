import Homey = require('homey');
import request = require('request');
import { Writable } from 'stream';

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
  streamQuality: string;
  streamResolution: string;
  refreshRate: number;
  enableSubStream: boolean;
  snapshotResolution: string;
  enableAlarmForwarding: boolean;
  motionSensitivity: string;
  autoSnapshot: boolean;
  alarmCooldown: number;
}

interface StreamInfo {
  mainStreamUrl: string;
  subStreamUrl: string;
  snapshotUrl: string;
  protocol: string;
}

interface StreamingStats {
  connectionStats: ConnectionStats;
  streamInfo: StreamInfo;
  settings: {
    quality: string;
    resolution: string;
    refreshRate: number;
    subStreamEnabled: boolean;
  };
}

interface ConnectionStats {
  lastSuccessfulConnect: number;
  consecutiveFailures: number;
  averageResponseTime: number;
  connectionStrength: number;
}

interface AlarmHistoryEntry {
  timestamp: number;
  type: string;
  action: string;
  duration?: number;
  details?: string;
}

interface AlarmHistory {
  entries: AlarmHistoryEntry[];
  maxEntries: number;
  currentAlarm?: AlarmHistoryEntry;
}

interface PTZPreset {
  id: number;
  name: string;
  pan: number;
  tilt: number;
  zoom: number;
  created: number;
  lastUsed?: number;
}

interface PTZPresetManager {
  presets: PTZPreset[];
  maxPresets: number;
  currentPosition?: { pan: number; tilt: number; zoom: number };
}

class HikvisionCameraDevice extends Homey.Device {
  private settings!: CameraSettings;
  private mainImage?: Homey.Image;
  private subImage?: Homey.Image;
  private connectionCheckInterval?: ReturnType<typeof setTimeout>;
  private imageRefreshInterval?: ReturnType<typeof setTimeout>;
  private connectionStats: ConnectionStats = {
    lastSuccessfulConnect: 0,
    consecutiveFailures: 0,
    averageResponseTime: 0,
    connectionStrength: 0
  };
  private alarmHistory: AlarmHistory = {
    entries: [],
    maxEntries: 100, // Keep last 100 alarm events
    currentAlarm: undefined
  };
  private ptzPresetManager: PTZPresetManager = {
    presets: [],
    maxPresets: 255, // Hikvision supports up to 255 presets
    currentPosition: undefined
  };
  private streamInfo: StreamInfo = {
    mainStreamUrl: '',
    subStreamUrl: '',
    snapshotUrl: '',
    protocol: 'HTTP'
  };

  override async onInit(): Promise<void> {
    this.log(`Init camera device: ${this.getName()}`);
    this.settings = this.getSettings() as CameraSettings;

    // Initialize default settings if not set
    this.initializeDefaultSettings();

    // Set initial capability values
    await this.setCapabilityValue('camera_status', false);
    await this.setCapabilityValue('motion_detected', false);
    await this.setCapabilityValue('recording_status', false);
    await this.setCapabilityValue('stream_quality', this.settings.streamQuality || 'high');
    await this.setCapabilityValue('connection_strength', 0);
    await this.setCapabilityValue('ptz_position', 'Unknown');
    await this.setCapabilityValue('alarm_state', 'Idle');
    await this.setCapabilityValue('last_alarm', 'None');

    // Setup streaming and monitoring
    await this.setupAdvancedStreaming();
    this.startAdvancedConnectionMonitoring();
  }

  private initializeDefaultSettings(): void {
    if (!this.settings.streamQuality) {
      this.settings.streamQuality = 'high';
    }
    if (!this.settings.streamResolution) {
      this.settings.streamResolution = '1920x1080';
    }
    if (!this.settings.refreshRate) {
      this.settings.refreshRate = 5;
    }
    if (this.settings.enableSubStream === undefined) {
      this.settings.enableSubStream = true;
    }
    if (!this.settings.snapshotResolution) {
      this.settings.snapshotResolution = 'high';
    }
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
    await this.setCapabilityValue('stream_quality', this.settings.streamQuality);
    await this.setupAdvancedStreaming();
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
    if (this.imageRefreshInterval) {
      clearInterval(this.imageRefreshInterval);
    }
  }

  private async setupAdvancedStreaming(): Promise<void> {
    try {
      this.buildStreamUrls();
      await this.setupMainStream();

      if (this.settings.enableSubStream) {
        await this.setupSubStream();
      }

      this.startImageRefresh();
    } catch (error) {
      this.error('Error setting up advanced streaming:', error);
    }
  }

  private buildStreamUrls(): void {
    const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
    const baseUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}`;

    // Main stream (usually channel01)
    this.streamInfo.mainStreamUrl = `${baseUrl}/ISAPI/Streaming/channels/${this.settings.channel}01/picture`;

    // Sub stream (usually channel02) - lower quality for better performance
    this.streamInfo.subStreamUrl = `${baseUrl}/ISAPI/Streaming/channels/${this.settings.channel}02/picture`;

    // High quality snapshot URL
    this.streamInfo.snapshotUrl = `${baseUrl}/ISAPI/Streaming/channels/${this.settings.channel}01/picture?snapShotImageType=JPEG`;

    this.streamInfo.protocol = this.settings.nvrSsl ? 'HTTPS' : 'HTTP';
  }

  private async setupMainStream(): Promise<void> {
    try {
      this.mainImage = await this.homey.images.createImage();

      this.mainImage.setStream(async (stream) => {
        this.createStreamRequest(this.streamInfo.mainStreamUrl, stream);
      });

      await this.setCameraImage('camera_main', `${this.settings.name} (Main)`, this.mainImage);
    } catch (error) {
      this.error('Error setting up main stream:', error);
    }
  }

  private async setupSubStream(): Promise<void> {
    try {
      this.subImage = await this.homey.images.createImage();

      this.subImage.setStream(async (stream) => {
        this.createStreamRequest(this.streamInfo.subStreamUrl, stream);
      });

      await this.setCameraImage('camera_sub', `${this.settings.name} (Sub)`, this.subImage);
    } catch (error) {
      this.error('Error setting up sub stream:', error);
    }
  }

  private createStreamRequest(url: string, stream: Writable): void {
    const startTime = Date.now();

    const req = request({
      url: url,
      strictSSL: this.settings.nvrStrict,
      rejectUnauthorized: this.settings.nvrStrict,
      timeout: 10000,
      headers: {
        'User-Agent': 'Homey Hikvision Camera'
      }
    });

    req.auth(this.settings.nvrUsername, this.settings.nvrPassword, false);

    req.on('response', (response) => {
      const responseTime = Date.now() - startTime;
      this.updateConnectionStats(true, responseTime);

      if (response.statusCode === 200) {
        this.log(`Stream connected successfully (${responseTime}ms)`);
      }
    });

    req.on('error', (error) => {
      this.updateConnectionStats(false, Date.now() - startTime);
      this.error('Stream error:', error);
    });

    req.pipe(stream);
  }

  private startImageRefresh(): void {
    // Clear existing interval
    if (this.imageRefreshInterval) {
      clearInterval(this.imageRefreshInterval);
    }

    // Refresh images based on configured refresh rate
    const refreshIntervalMs = (this.settings.refreshRate || 5) * 1000;

    this.imageRefreshInterval = setInterval(() => {
      this.refreshCameraImages();
    }, refreshIntervalMs);
  }

  private async refreshCameraImages(): Promise<void> {
    try {
      if (this.mainImage) {
        await this.setCameraImage('camera_main', `${this.settings.name} (Main)`, this.mainImage);
      }

      if (this.subImage && this.settings.enableSubStream) {
        await this.setCameraImage('camera_sub', `${this.settings.name} (Sub)`, this.subImage);
      }
    } catch (error) {
      this.error('Error refreshing camera images:', error);
    }
  }

  private startAdvancedConnectionMonitoring(): void {
    // Check camera status every 30 seconds
    this.connectionCheckInterval = setInterval(() => {
      this.performAdvancedConnectionCheck();
    }, 30000);

    // Initial check
    this.performAdvancedConnectionCheck();
  }

  private async performAdvancedConnectionCheck(): Promise<void> {
    try {
      const startTime = Date.now();
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const statusUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/InputProxy/channels/${this.settings.channel}/status`;

      request({
        url: statusUrl,
        strictSSL: this.settings.nvrStrict,
        rejectUnauthorized: this.settings.nvrStrict,
        timeout: 8000
      }, async (error, response, _body) => {
        const responseTime = Date.now() - startTime;
        const isOnline = !error && response && response.statusCode === 200;

        this.updateConnectionStats(isOnline, responseTime);
        await this.setCapabilityValue('camera_status', isOnline);

        if (isOnline) {
          await this.setAvailable();
          // Also check if we need to get additional camera info
          await this.updateCameraInfo();
        } else {
          await this.setUnavailable('Camera offline');
        }
      }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);

    } catch (error) {
      this.error('Error in advanced connection check:', error);
      this.updateConnectionStats(false, 0);
      await this.setCapabilityValue('camera_status', false);
      await this.setUnavailable('Connection error');
    }
  }

  private updateConnectionStats(success: boolean, responseTime: number): void {
    if (success) {
      this.connectionStats.lastSuccessfulConnect = Date.now();
      this.connectionStats.consecutiveFailures = 0;

      // Update average response time (simple moving average)
      this.connectionStats.averageResponseTime =
        (this.connectionStats.averageResponseTime + responseTime) / 2;

      // Calculate connection strength (0-100)
      let strength = 100;
      if (responseTime > 5000) {strength = 20;}
      else if (responseTime > 3000) {strength = 40;}
      else if (responseTime > 2000) {strength = 60;}
      else if (responseTime > 1000) {strength = 80;}

      this.connectionStats.connectionStrength = strength;
    } else {
      this.connectionStats.consecutiveFailures++;

      // Reduce connection strength based on consecutive failures
      this.connectionStats.connectionStrength = Math.max(
        0,
        this.connectionStats.connectionStrength - (this.connectionStats.consecutiveFailures * 20)
      );
    }

    this.setCapabilityValue('connection_strength', this.connectionStats.connectionStrength)
      .catch(this.error);
  }

  private async updateCameraInfo(): Promise<void> {
    try {
      // Check recording status
      await this.checkRecordingStatus();
    } catch (error) {
      this.error('Error updating camera info:', error);
    }
  }

  private async checkRecordingStatus(): Promise<void> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const recordUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/record/tracks/${this.settings.channel}01`;

      request({
        url: recordUrl,
        strictSSL: this.settings.nvrStrict,
        rejectUnauthorized: this.settings.nvrStrict,
        timeout: 5000
      }, async (error, response, body) => {
        if (!error && response && response.statusCode === 200 && body) {
          // Simple check for recording status in XML response
          const isRecording = body.includes('<enabled>true</enabled>') || body.includes('<trackID>');
          await this.setCapabilityValue('recording_status', isRecording);
        }
      }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);

    } catch (error) {
      this.error('Error checking recording status:', error);
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
          timeout: 8000,
          headers: {
            'Content-Type': 'application/xml'
          }
        }, (error, response, responseBody) => {
          const success = !error && response && response.statusCode === 200 &&
                         (responseBody.trim() === 'OK' || response.statusCode === 200);

          if (success) {
            this.log(`PTZ control successful: pan=${pan}, tilt=${tilt}, zoom=${zoom}`);
          } else {
            this.error(`PTZ control failed: ${error || response?.statusCode || 'unknown error'}`);
          }

          resolve(success);
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });
    } catch (error) {
      this.error('Error in PTZ control:', error);
      return false;
    }
  }

  async takeSnapshot(): Promise<boolean> {
    try {
      this.log('Taking high-quality snapshot...');

      // Use dedicated snapshot URL for best quality
      const startTime = Date.now();
      const req = request({
        url: this.streamInfo.snapshotUrl,
        strictSSL: this.settings.nvrStrict,
        rejectUnauthorized: this.settings.nvrStrict,
        timeout: 10000,
        headers: {
          'User-Agent': 'Homey Hikvision Camera Snapshot'
        }
      });

      req.auth(this.settings.nvrUsername, this.settings.nvrPassword, false);

      return new Promise((resolve) => {
        req.on('response', async (response) => {
          const responseTime = Date.now() - startTime;

          if (response.statusCode === 200) {
            this.log(`Snapshot captured successfully (${responseTime}ms)`);

            // Refresh the main camera image to show the latest snapshot
            if (this.mainImage) {
              await this.setCameraImage('camera_main', `${this.settings.name} (Main)`, this.mainImage);
            }
            resolve(true);
          } else {
            this.error(`Snapshot failed with status: ${response.statusCode}`);
            resolve(false);
          }
        });

        req.on('error', (error) => {
          this.error('Snapshot error:', error);
          resolve(false);
        });
      });

    } catch (error) {
      this.error('Error taking snapshot:', error);
      return false;
    }
  }

  // Enhanced method to handle alarm events from the NVR with history tracking
  handleAlarmEvent(code: string, action: string): void {
    const timestamp = Date.now();
    this.log(`Camera ${this.settings.channel} alarm: ${code} - ${action} at ${new Date(timestamp).toISOString()}`);

    // Handle alarm history and duration tracking
    if (action === 'Start') {
      // End previous alarm if one is active
      if (this.alarmHistory.currentAlarm) {
        this.alarmHistory.currentAlarm.duration = timestamp - this.alarmHistory.currentAlarm.timestamp;
        this.addAlarmToHistory(this.alarmHistory.currentAlarm);
      }

      // Start new alarm
      this.alarmHistory.currentAlarm = {
        timestamp: timestamp,
        type: code,
        action: action,
        details: `Camera ${this.settings.channel} - ${this.settings.name}`
      };
    } else if (action === 'Stop' && this.alarmHistory.currentAlarm && this.alarmHistory.currentAlarm.type === code) {
      // End current alarm
      this.alarmHistory.currentAlarm.duration = timestamp - this.alarmHistory.currentAlarm.timestamp;
      this.addAlarmToHistory(this.alarmHistory.currentAlarm);
      this.alarmHistory.currentAlarm = undefined;
    }

    // Update alarm state based on alarm type and action
    let alarmState = 'Idle';
    const lastAlarm = code;

    if (action === 'Start') {
      switch (code) {
        case 'VideoMotion':
          alarmState = 'Motion Detected';
          this.setCapabilityValue('motion_detected', true).catch(this.error);
          // Auto-capture snapshot on motion detection if enabled
          if (this.settings.autoSnapshot !== false) {
            this.takeSnapshot().catch(this.error);
          }
          break;
        case 'AlarmLocal':
          alarmState = 'Local Alarm';
          break;
        case 'VideoLoss':
          alarmState = 'Video Loss';
          break;
        case 'VideoBlind':
          alarmState = 'Video Blind';
          break;
        case 'LineDetection':
          alarmState = 'Line Detection';
          break;
        case 'IntrusionDetection':
          alarmState = 'Intrusion Detection';
          break;
        default:
          alarmState = 'Unknown Alarm';
      }
    } else if (action === 'Stop') {
      alarmState = 'Idle';
      if (code === 'VideoMotion') {
        this.setCapabilityValue('motion_detected', false).catch(this.error);
      }
    }

    // Update alarm capabilities
    this.setCapabilityValue('alarm_state', alarmState).catch(this.error);
    this.setCapabilityValue('last_alarm', lastAlarm).catch(this.error);

    // Trigger camera-specific flow cards based on alarm type
    const alarmHandlers: Record<string, string> = {
      'VideoMotion': action === 'Start' ? 'camera_motion_start' : 'camera_motion_stop',
      'VideoLoss': action === 'Start' ? 'camera_video_loss_start' : 'camera_video_loss_stop',
      'VideoBlind': action === 'Start' ? 'camera_video_blind_start' : 'camera_video_blind_stop',
      'LineDetection': action === 'Start' ? 'camera_line_detection_start' : 'camera_line_detection_stop',
      'IntrusionDetection': action === 'Start' ? 'camera_intrusion_start' : 'camera_intrusion_stop',
      'AlarmLocal': action === 'Start' ? 'camera_alarm_start' : 'camera_alarm_stop'
    };

    const triggerCard = alarmHandlers[code];
    if (triggerCard) {
      this.homey.flow.getDeviceTriggerCard(triggerCard)
        .trigger(this)
        .catch(this.error);
    }

    // Trigger general alarm flow card
    if (action === 'Start') {
      this.homey.flow.getDeviceTriggerCard('camera_alarm_triggered')
        .trigger(this, { alarm_type: code })
        .catch(this.error);
    }
  }

  async startRecording(): Promise<boolean> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const recordUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/record/control/manual/start/tracks/${this.settings.channel}01`;

      return new Promise((resolve) => {
        request.put({
          url: recordUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          timeout: 5000
        }, async (error, response) => {
          const success = !error && response && (response.statusCode === 200 || response.statusCode === 201);

          if (success) {
            await this.setCapabilityValue('recording_status', true);
            this.log('Recording started successfully');
          } else {
            this.error('Failed to start recording:', error || response?.statusCode);
          }

          resolve(success);
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });
    } catch (error) {
      this.error('Error starting recording:', error);
      return false;
    }
  }

  async stopRecording(): Promise<boolean> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const recordUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/record/control/manual/stop/tracks/${this.settings.channel}01`;

      return new Promise((resolve) => {
        request.put({
          url: recordUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          timeout: 5000
        }, async (error, response) => {
          const success = !error && response && (response.statusCode === 200 || response.statusCode === 201);

          if (success) {
            await this.setCapabilityValue('recording_status', false);
            this.log('Recording stopped successfully');
          } else {
            this.error('Failed to stop recording:', error || response?.statusCode);
          }

          resolve(success);
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });
    } catch (error) {
      this.error('Error stopping recording:', error);
      return false;
    }
  }

  async refreshStream(): Promise<boolean> {
    try {
      this.log('Refreshing camera streams...');

      // Restart streaming setup
      await this.setupAdvancedStreaming();

      // Force immediate image refresh
      await this.refreshCameraImages();

      this.log('Camera streams refreshed successfully');
      return true;
    } catch (error) {
      this.error('Error refreshing stream:', error);
      return false;
    }
  }

  async goToPreset(presetNumber: number): Promise<boolean> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const presetUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/PTZCtrlProxy/channels/${this.settings.channel}/presets/${presetNumber}/goto`;

      return new Promise((resolve) => {
        request.put({
          url: presetUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          timeout: 8000
        }, async (error, response) => {
          const success = !error && response && (response.statusCode === 200 || response.statusCode === 201);

          if (success) {
            // Update preset usage tracking
            const preset = this.ptzPresetManager.presets.find(p => p.id === presetNumber);
            if (preset) {
              preset.lastUsed = Date.now();
              await this.setCapabilityValue('ptz_position', `${preset.name} (${presetNumber})`);
              this.log(`Moved to preset "${preset.name}" (${presetNumber}) successfully`);
            } else {
              await this.setCapabilityValue('ptz_position', `Preset ${presetNumber}`);
              this.log(`Moved to preset ${presetNumber} successfully`);
            }
          } else {
            this.error(`Failed to go to preset ${presetNumber}:`, error || response?.statusCode);
          }

          resolve(success);
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });
    } catch (error) {
      this.error('Error going to preset:', error);
      return false;
    }
  }

  async setPreset(presetNumber: number): Promise<boolean> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const presetUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/PTZCtrlProxy/channels/${this.settings.channel}/presets/${presetNumber}`;

      const body = `<?xml version="1.0" encoding="UTF-8"?><PTZPreset><id>${presetNumber}</id><presetName>Preset${presetNumber}</presetName></PTZPreset>`;

      return new Promise((resolve) => {
        request.put({
          url: presetUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          body: body,
          timeout: 8000,
          headers: {
            'Content-Type': 'application/xml'
          }
        }, (error, response) => {
          const success = !error && response && (response.statusCode === 200 || response.statusCode === 201);

          if (success) {
            this.log(`Preset ${presetNumber} set successfully`);
          } else {
            this.error(`Failed to set preset ${presetNumber}:`, error || response?.statusCode);
          }

          resolve(success);
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });
    } catch (error) {
      this.error('Error setting preset:', error);
      return false;
    }
  }

  async stopPTZ(): Promise<boolean> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const stopUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/PTZCtrlProxy/channels/${this.settings.channel}/continuous`;

      const body = '<?xml version="1.0" encoding="UTF-8"?><PTZData><pan>0</pan><tilt>0</tilt><zoom>0</zoom></PTZData>';

      return new Promise((resolve) => {
        request.put({
          url: stopUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          body: body,
          timeout: 5000,
          headers: {
            'Content-Type': 'application/xml'
          }
        }, async (error, response) => {
          const success = !error && response && response.statusCode === 200;

          if (success) {
            await this.setCapabilityValue('ptz_position', 'Stopped');
            this.log('PTZ movement stopped successfully');
          } else {
            this.error('Failed to stop PTZ movement:', error || response?.statusCode);
          }

          resolve(success);
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });
    } catch (error) {
      this.error('Error stopping PTZ:', error);
      return false;
    }
  }

  /**
   * Add an alarm entry to the history with rotation
   */
  private addAlarmToHistory(alarmEntry: AlarmHistoryEntry): void {
    this.alarmHistory.entries.unshift(alarmEntry);

    // Rotate history if it exceeds max entries
    if (this.alarmHistory.entries.length > this.alarmHistory.maxEntries) {
      this.alarmHistory.entries = this.alarmHistory.entries.slice(0, this.alarmHistory.maxEntries);
    }

    // Log the alarm with duration for debugging
    const duration = alarmEntry.duration ? `(${(alarmEntry.duration / 1000).toFixed(1)}s)` : '';
    this.log(`Alarm logged: ${alarmEntry.type} ${alarmEntry.action} ${duration} - Total: ${this.alarmHistory.entries.length} entries`);
  }

  /**
   * Get alarm history for the camera
   */
  getAlarmHistory(): AlarmHistory {
    return {
      ...this.alarmHistory,
      entries: [...this.alarmHistory.entries] // Return a copy
    };
  }

  /**
   * Clear alarm history
   */
  clearAlarmHistory(): void {
    this.alarmHistory.entries = [];
    this.alarmHistory.currentAlarm = undefined;
    this.log('Alarm history cleared');
  }

  /**
   * Get recent alarms within specified time window (in minutes)
   */
  getRecentAlarms(minutes: number = 60): AlarmHistoryEntry[] {
    const cutoffTime = Date.now() - (minutes * 60 * 1000);
    return this.alarmHistory.entries.filter(entry => entry.timestamp > cutoffTime);
  }

  /**
   * Enhanced PTZ Preset Management
   */

  /**
   * Create a named PTZ preset at current position
   */
  async createNamedPreset(presetId: number, name: string): Promise<boolean> {
    try {
      // First get current PTZ position
      const position = await this.getCurrentPTZPosition();
      if (!position) {
        this.error('Could not get current PTZ position for preset creation');
        return false;
      }

      // Call the original setPreset method with enhanced XML
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const presetUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/PTZCtrlProxy/channels/${this.settings.channel}/presets/${presetId}`;

      const body = `<?xml version="1.0" encoding="UTF-8"?><PTZPreset><id>${presetId}</id><presetName>${name}</presetName></PTZPreset>`;

      return new Promise((resolve) => {
        request.put({
          url: presetUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          body: body,
          timeout: 8000,
          headers: {
            'Content-Type': 'application/xml'
          }
        }, (error, response) => {
          const success = !error && response && (response.statusCode === 200 || response.statusCode === 201);

          if (success) {
            // Add to local preset manager
            const preset: PTZPreset = {
              id: presetId,
              name: name,
              pan: position.pan,
              tilt: position.tilt,
              zoom: position.zoom,
              created: Date.now()
            };
            this.addPresetToManager(preset);
            this.log(`Named preset "${name}" (ID: ${presetId}) created successfully`);
          } else {
            this.error(`Failed to create named preset "${name}":`, error || response?.statusCode);
          }

          resolve(success);
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });

    } catch (error) {
      this.error('Error creating named preset:', error);
      return false;
    }
  }

  /**
   * Get current PTZ position from camera
   */
  async getCurrentPTZPosition(): Promise<{ pan: number; tilt: number; zoom: number } | null> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const statusUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/PTZCtrl/channels/${this.settings.channel}/status`;

      return new Promise((resolve) => {
        request.get({
          url: statusUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          timeout: 5000
        }, (error, response, body) => {
          if (!error && response && response.statusCode === 200 && body) {
            try {
              // Parse XML response to get PTZ position
              const panMatch = body.match(/<azimuth>([^<]+)<\/azimuth>/);
              const tiltMatch = body.match(/<elevation>([^<]+)<\/elevation>/);
              const zoomMatch = body.match(/<absoluteZoom>([^<]+)<\/absoluteZoom>/);

              if (panMatch && tiltMatch && zoomMatch) {
                const position = {
                  pan: parseFloat(panMatch[1]),
                  tilt: parseFloat(tiltMatch[1]),
                  zoom: parseFloat(zoomMatch[1])
                };
                this.ptzPresetManager.currentPosition = position;
                resolve(position);
                return;
              }
            } catch (parseError) {
              this.error('Error parsing PTZ status:', parseError);
            }
          }
          resolve(null);
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });

    } catch (error) {
      this.error('Error getting PTZ position:', error);
      return null;
    }
  }

  /**
   * Add preset to local manager
   */
  private addPresetToManager(preset: PTZPreset): void {
    // Remove existing preset with same ID
    this.ptzPresetManager.presets = this.ptzPresetManager.presets.filter(p => p.id !== preset.id);
    
    // Add new preset
    this.ptzPresetManager.presets.push(preset);
    
    // Sort by ID
    this.ptzPresetManager.presets.sort((a, b) => a.id - b.id);

    this.log(`Preset manager updated: ${this.ptzPresetManager.presets.length} presets`);
  }

  /**
   * Get all managed presets
   */
  getAllPresets(): PTZPreset[] {
    return [...this.ptzPresetManager.presets];
  }

  /**
   * Delete a preset
   */
  async deletePreset(presetId: number): Promise<boolean> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const presetUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/PTZCtrlProxy/channels/${this.settings.channel}/presets/${presetId}`;

      return new Promise((resolve) => {
        request.delete({
          url: presetUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          timeout: 5000
        }, (error, response) => {
          const success = !error && response && (response.statusCode === 200 || response.statusCode === 204);

          if (success) {
            // Remove from local manager
            this.ptzPresetManager.presets = this.ptzPresetManager.presets.filter(p => p.id !== presetId);
            this.log(`Preset ${presetId} deleted successfully`);
          } else {
            this.error(`Failed to delete preset ${presetId}:`, error || response?.statusCode);
          }

          resolve(success);
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });

    } catch (error) {
      this.error('Error deleting preset:', error);
      return false;
    }
  }

  // Method to get current streaming statistics
  getStreamingStats(): StreamingStats {
    return {
      connectionStats: this.connectionStats,
      streamInfo: this.streamInfo,
      settings: {
        quality: this.settings.streamQuality,
        resolution: this.settings.streamResolution,
        refreshRate: this.settings.refreshRate,
        subStreamEnabled: this.settings.enableSubStream
      }
    };
  }
}

export = HikvisionCameraDevice;