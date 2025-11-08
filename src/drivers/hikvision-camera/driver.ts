import Homey = require('homey');

class HikvisionCameraDriver extends Homey.Driver {

  override async onInit(): Promise<void> {
    this.log('Init Hikvision Camera driver');
    this.registerFlowCards();
    this.registerActions();
  }

  registerFlowCards(): void {
    // Flow cards will be registered when they are defined in app.json
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
  }

  override async onPair(session: Homey.PairSession): Promise<void> {
    this.log('Camera pairing started');

    // For Phase 1, we'll implement a simple manual pairing
    // More advanced discovery will be added in later phases
    session.setHandler('list_devices', async () => {
      // This will be populated by a manual pairing form initially
      return [];
    });
  }

  override async onPairListDevices(): Promise<any[]> {
    // Return empty array for now - devices will be added manually
    return [];
  }
}

export = HikvisionCameraDriver;