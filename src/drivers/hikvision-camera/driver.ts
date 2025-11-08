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
      .registerRunListener(async (args: any) => {
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
      .registerRunListener(async (args: any) => {
        if (args.device) {
          return args.device.takeSnapshot();
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