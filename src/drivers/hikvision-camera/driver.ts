import Homey = require('homey');

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
   * Discover cameras from existing NVR devices (simplified implementation for Phase 4)
   */
  private async discoverCameras(): Promise<object[]> {
    try {
      this.log('Auto-discovery: Preparing camera list for pairing...');

      // For Phase 4, provide pre-configured camera options that users can select
      // This simulates discovery and allows users to easily add cameras
      const cameraOptions: object[] = [];

      // Generate camera options for channels 1-16 (common NVR setup)
      for (let channel = 1; channel <= 16; channel++) {
        cameraOptions.push({
          name: `Camera ${channel} (Channel ${channel})`,
          data: {
            id: `auto_camera_${channel}`
          },
          settings: {
            channel: channel,
            name: `Camera ${channel}`,
            nvrDeviceId: 'auto-configured', // Will be set during pairing
            nvrAddress: '192.168.10.140', // Updated default to match your NVR
            nvrPort: 80,
            nvrSsl: false,
            nvrStrict: false,
            nvrUsername: 'admin',
            nvrPassword: 'ZmartGold2018',
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

      this.log(`Auto-discovery: Generated ${cameraOptions.length} camera options for user selection`);
      return cameraOptions;

    } catch {
      this.log('Error during camera auto-discovery');
      return [];
    }
  }


}

export = HikvisionCameraDriver;