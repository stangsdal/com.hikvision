import Homey = require('homey');
import request = require('request');
import xml2js = require('xml2js');

class HikvisionCameraDriver extends Homey.Driver {

  override async onInit(): Promise<void> {
    this.log('Init Hikvision Camera driver');
    this.registerFlowCards();
    this.registerActions();
  }

  registerFlowCards(): void {
    // Register condition cards for camera states
    this.registerConditionCards();
  }

  registerConditionCards(): void {
    // Note: Condition cards are typically registered in the app.ts file
    // This method serves as a placeholder for future condition card registration
    // The condition cards are already defined in app.json and will be handled by the Homey platform
    this.log('Camera condition cards available: camera_is_online, camera_motion_detected, camera_is_recording, camera_connection_good, camera_alarm_active');
  }

  registerActions(): void {
    // PTZ Control for individual camera
    this.homey.flow
      .getActionCard('camera_ptz_control')
      .registerRunListener(async (args) => {
        if (args.device) {
          return args.device.ptzControl(
            args.pannumber,
            args.tiltnumber,
            args.zoomnumber
          );
        }
        return false;
      });

    // Take snapshot
    this.homey.flow
      .getActionCard('camera_take_snapshot')
      .registerRunListener(async (args) => {
        if (args.device) {
          return args.device.takeSnapshot();
        }
        return false;
      });

    // Start recording
    this.homey.flow
      .getActionCard('camera_start_recording')
      .registerRunListener(async (args) => {
        if (args.device) {
          return args.device.startRecording();
        }
        return false;
      });

    // Stop recording
    this.homey.flow
      .getActionCard('camera_stop_recording')
      .registerRunListener(async (args) => {
        if (args.device) {
          return args.device.stopRecording();
        }
        return false;
      });

    // Refresh stream
    this.homey.flow
      .getActionCard('camera_refresh_stream')
      .registerRunListener(async (args) => {
        if (args.device) {
          return args.device.refreshStream();
        }
        return false;
      });

    // Go to PTZ preset
    this.homey.flow
      .getActionCard('camera_goto_preset')
      .registerRunListener(async (args) => {
        if (args.device) {
          return args.device.goToPreset(args.preset_number);
        }
        return false;
      });

    // Set PTZ preset
    this.homey.flow
      .getActionCard('camera_set_preset')
      .registerRunListener(async (args) => {
        if (args.device) {
          return args.device.setPreset(args.preset_number);
        }
        return false;
      });

    // Stop PTZ movement
    this.homey.flow
      .getActionCard('camera_ptz_stop')
      .registerRunListener(async (args) => {
        if (args.device) {
          return args.device.stopPTZ();
        }
        return false;
      });

    // Clear alarm history
    this.homey.flow
      .getActionCard('camera_clear_alarm_history')
      .registerRunListener(async (args) => {
        if (args.device) {
          args.device.clearAlarmHistory();
          return true;
        }
        return false;
      });

    // Create named PTZ preset
    this.homey.flow
      .getActionCard('camera_create_named_preset')
      .registerRunListener(async (args) => {
        if (args.device) {
          return args.device.createNamedPreset(args.preset_id, args.preset_name);
        }
        return false;
      });

    // Delete PTZ preset
    this.homey.flow
      .getActionCard('camera_delete_preset')
      .registerRunListener(async (args) => {
        if (args.device) {
          return args.device.deletePreset(args.preset_id);
        }
        return false;
      });

    // Switch streaming profile
    this.homey.flow
      .getActionCard('camera_switch_stream_profile')
      .registerRunListener(async (args) => {
        if (args.device) {
          return args.device.switchToProfile(args.profile_id);
        }
        return false;
      });

    // Enable/disable adaptive streaming
    this.homey.flow
      .getActionCard('camera_set_adaptive_streaming')
      .registerRunListener(async (args) => {
        if (args.device) {
          return args.device.setAdaptiveStreaming(args.enabled);
        }
        return false;
      });
  }

  override async onPair(session: Homey.PairSession): Promise<void> {
    this.log('Camera pairing started');

    session.setHandler('list_devices', async () => {
      return await this.discoverCameras();
    });

    session.setHandler('list_devices_selection', async (data) => {
      this.log('User selected devices for pairing');
      return data;
    });
  }

  override async onPairListDevices(): Promise<object[]> {
    return await this.discoverCameras();
  }

  /**
   * Discover cameras from existing NVR devices using real camera names from InputProxy API
   */
  private async discoverCameras(): Promise<object[]> {
    try {
      this.log('Auto-discovery: Retrieving actual camera names from NVR...');

      // Get actual camera information from NVR (names and online status)
      const connectedCameras = await this.getConnectedCamerasFromNVR();
      const cameraOptions: object[] = [];

      // Create camera options only for connected cameras
      for (const camera of connectedCameras) {
        if (camera.online && camera.name && camera.name.trim() !== '') {
          cameraOptions.push({
            name: `${camera.name} (Channel ${camera.channel})`,
            data: {
              id: `camera_${camera.channel}_${camera.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`
            },
            settings: {
              channel: camera.channel,
              name: camera.name,
              nvrDeviceId: 'auto-configured', // Will be set during pairing
              nvrAddress: '192.168.10.140', // Default NVR address
              nvrPort: 80,
              nvrSsl: false,
              nvrStrict: false,
              nvrUsername: 'admin',
              nvrPassword: 'ZmartifyGold',
              streamQuality: 'high',
              streamResolution: '1920x1080',
              refreshRate: 5,
              enableSubStream: true,
              snapshotResolution: 'high',
              enableAlarmForwarding: true,
              motionSensitivity: 'medium',
              autoSnapshot: true,
              alarmCooldown: 5
            },
            capabilities: ['camera_status', 'motion_detected', 'recording_status', 'stream_quality', 'connection_strength', 'ptz_position', 'alarm_state', 'last_alarm']
          });
        }
      }

      // If no connected cameras found, fall back to generic naming for manual configuration
      if (cameraOptions.length === 0) {
        this.log('No connected cameras found on NVR, providing generic options for manual configuration...');
        for (let channel = 1; channel <= 6; channel++) {
          cameraOptions.push({
            name: `Camera ${channel} (Channel ${channel})`,
            data: {
              id: `auto_camera_${channel}`
            },
            settings: {
              channel: channel,
              name: `Camera ${channel}`,
              nvrDeviceId: 'auto-configured',
              nvrAddress: '192.168.10.140',
              nvrPort: 80,
              nvrSsl: false,
              nvrStrict: false,
              nvrUsername: 'admin',
              nvrPassword: 'ZmartifyGold',
              streamQuality: 'high',
              streamResolution: '1920x1080',
              refreshRate: 5,
              enableSubStream: true,
              snapshotResolution: 'high',
              enableAlarmForwarding: true,
              motionSensitivity: 'medium',
              autoSnapshot: true,
              alarmCooldown: 5
            },
            capabilities: ['camera_status', 'motion_detected', 'recording_status', 'stream_quality', 'connection_strength', 'ptz_position', 'alarm_state', 'last_alarm']
          });
        }
      }

      this.log(`Auto-discovery: Found ${cameraOptions.length} connected cameras on NVR`);
      return cameraOptions;

    } catch (error) {
      this.log(`Error during camera discovery from NVR, using fallback: ${String(error)}`);
      
      // Fallback to generic names if NVR discovery fails
      const fallbackOptions: object[] = [];
      for (let channel = 1; channel <= 6; channel++) {
        fallbackOptions.push({
          name: `Camera ${channel} (Channel ${channel})`,
          data: {
            id: `auto_camera_${channel}`
          },
          settings: {
            channel: channel,
            name: `Camera ${channel}`,
            nvrDeviceId: 'auto-configured',
            nvrAddress: '192.168.10.140',
            nvrPort: 80,
            nvrSsl: false,
            nvrStrict: false,
            nvrUsername: 'admin',
            nvrPassword: 'ZmartifyGold',
            streamQuality: 'high',
            streamResolution: '1920x1080',
            refreshRate: 5,
            enableSubStream: true,
            snapshotResolution: 'high',
            enableAlarmForwarding: true,
            motionSensitivity: 'medium',
            autoSnapshot: true,
            alarmCooldown: 5
          },
          capabilities: ['camera_status', 'motion_detected', 'recording_status', 'stream_quality', 'connection_strength', 'ptz_position', 'alarm_state', 'last_alarm']
        });
      }
      
      return fallbackOptions;
    }
  }

  /**
   * Get camera information from NVR InputProxy API - names and online status
   */
  private async getConnectedCamerasFromNVR(): Promise<Array<{ channel: number; name: string; online: boolean }>> {
    const parser = new xml2js.Parser();

    return new Promise((resolve) => {
      const protocol = 'http://'; // Default settings
      const nvrAddress = '192.168.10.140';
      const nvrPort = 80;
      const nvrUsername = 'admin';
      const nvrPassword = 'ZmartifyGold';

      // First get camera names
      request(
        {
          url: `${protocol}${nvrAddress}:${nvrPort}/ISAPI/ContentMgmt/InputProxy/channels`,
          strictSSL: false,
          rejectUnauthorized: false
        },
        (error: unknown, response: { statusCode: number } | null, body: string) => {
          if (error || !response || response.statusCode !== 200) {
            this.log('Failed to get camera names from NVR InputProxy API');
            resolve([]);
          } else {
            try {
              parser.parseString(body, (err: unknown, result: Record<string, unknown>) => {
                if (err || !result) {
                  resolve([]);
                  return;
                }

                const cameraNames: string[] = [];

                const inputProxyChannelList = result['InputProxyChannelList'] as Record<string, unknown>;
                if (inputProxyChannelList && inputProxyChannelList['InputProxyChannel']) {
                  const channels = inputProxyChannelList['InputProxyChannel'];
                  const channelArray = Array.isArray(channels) ? channels : [channels];

                  for (const channel of channelArray) {
                    if (channel.id && channel.name) {
                      const channelId = Array.isArray(channel.id) ? channel.id[0] : channel.id;
                      const rawChannelName = Array.isArray(channel.name) ? channel.name[0] : channel.name;
                      
                      // Handle both string and array formats from xml2js parsing
                      const channelName = typeof rawChannelName === 'string' ? rawChannelName.trim() : '';

                      if (channelName && channelName !== '') {
                        cameraNames[parseInt(channelId)] = channelName;
                      } else {
                        // Use generic name if camera name is empty
                        cameraNames[parseInt(channelId)] = `Camera ${channelId}`;
                      }
                    }
                  }
                }

                // Now get online status for cameras
                this.getCameraOnlineStatus(protocol, nvrAddress, nvrPort, nvrUsername, nvrPassword, cameraNames)
                  .then(resolve)
                  .catch(() => resolve([]));
              });
            } catch (parseError) {
              this.log(`Error parsing NVR camera names: ${String(parseError)}`);
              resolve([]);
            }
          }
        }
      ).auth(nvrUsername, nvrPassword, false);
    });
  }

  /**
   * Get camera online status from NVR (same logic as NVR device)
   */
  private async getCameraOnlineStatus(
    protocol: string,
    nvrAddress: string,
    nvrPort: number,
    nvrUsername: string,
    nvrPassword: string,
    cameraNames: string[]
  ): Promise<Array<{ channel: number; name: string; online: boolean }>> {
    const parser = new xml2js.Parser();

    return new Promise((resolve) => {
      // Get camera online status
      request(
        {
          url: `${protocol}${nvrAddress}:${nvrPort}/ISAPI/ContentMgmt/InputProxy/channels/status`,
          strictSSL: false,
          rejectUnauthorized: false
        },
        (error: unknown, response: { statusCode: number } | null, body: string) => {
          if (error || !response || response.statusCode !== 200) {
            this.log('Failed to get camera status from NVR - assuming all cameras offline');
            resolve([]);
          } else {
            try {
              parser.parseString(body, (err: unknown, result: Record<string, unknown>) => {
                if (err || !result) {
                  this.log('Failed to parse camera status - assuming all cameras offline');
                  resolve([]);
                  return;
                }

                const connectedCameras: Array<{ channel: number; name: string; online: boolean }> = [];

                const statusList = result['InputProxyChannelStatusList'] as Record<string, unknown>;
                if (statusList && statusList['InputProxyChannelStatus']) {
                  const channels = statusList['InputProxyChannelStatus'];
                  const channelArray = Array.isArray(channels) ? channels : [channels];

                  for (const status of channelArray) {
                    if (status.id && status.online) {
                      const channelId = parseInt(Array.isArray(status.id) ? status.id[0] : status.id);
                      const isOnline = (Array.isArray(status.online) ? status.online[0] : status.online) === 'true';

                      if (isOnline && cameraNames[channelId]) {
                        connectedCameras.push({
                          channel: channelId,
                          name: cameraNames[channelId],
                          online: true
                        });
                      }
                    }
                  }
                }

                this.log(`Found ${connectedCameras.length} connected cameras on NVR`);
                resolve(connectedCameras);
              });
            } catch (parseError) {
              this.log(`Error parsing NVR status response: ${String(parseError)}`);
              resolve([]);
            }
          }
        }
      ).auth(nvrUsername, nvrPassword, false);
    });
  }


}

export = HikvisionCameraDriver;