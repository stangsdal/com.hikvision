import Homey = require("homey");
import request = require("request");

interface DeviceCallback {
  name: string;
  id: string;
  error: string | number;
}

interface ConnectionData {
  ssl: boolean;
  address: string;
  port: number;
  strict: boolean;
  username: string;
  password: string;
}

interface FlowCardTriggers {
  trgOnConnected: Homey.FlowCard;
  trgOnDisconnected: Homey.FlowCard;
  trgOnError: Homey.FlowCard;
  trgTVideoMotionStart: Homey.FlowCard;
  trgVideoMotionStop: Homey.FlowCard;
  trgAlarmLocalStart: Homey.FlowCard;
  trgAlarmLocalStop: Homey.FlowCard;
  trgVideoLossStart: Homey.FlowCard;
  trgVideoLossStop: Homey.FlowCard;
  trgVideoBlindStart: Homey.FlowCard;
  trgVideoBlindStop: Homey.FlowCard;
  trgLineDetectionStart: Homey.FlowCard;
  trgLineDetectionStop: Homey.FlowCard;
  trgIntrusionDetectionStart: Homey.FlowCard;
  trgIntrusionDetectionStop: Homey.FlowCard;
}

class HikvisionDriver extends Homey.Driver {
  private _triggers!: FlowCardTriggers;

  override async onInit(): Promise<void> {
    this.log("Init driver");

    this.registerFlowCards();

    this.homey.flow
      .getActionCard("ptzcontinuous")
      .registerRunListener(async (args: any, _state: any): Promise<boolean> => {
        if (args.device) {
          return args.device.ptzZoom(
            args.pannumber,
            args.tiltnumber,
            args.zoomnumber,
            args.channel
          );
        }
        return true;
      });
  }

  registerFlowCards(): void {
    this._triggers = {
      trgOnConnected: this.homey.flow.getDeviceTriggerCard("OnConnected"),
      trgOnDisconnected: this.homey.flow.getDeviceTriggerCard("OnDisconnected"),
      trgOnError: this.homey.flow.getDeviceTriggerCard("OnError"),
      trgTVideoMotionStart:
        this.homey.flow.getDeviceTriggerCard("VideoMotionStart"),
      trgVideoMotionStop:
        this.homey.flow.getDeviceTriggerCard("VideoMotionStop"),
      trgAlarmLocalStart:
        this.homey.flow.getDeviceTriggerCard("AlarmLocalStart"),
      trgAlarmLocalStop: this.homey.flow.getDeviceTriggerCard("AlarmLocalStop"),
      trgVideoLossStart: this.homey.flow.getDeviceTriggerCard("VideoLossStart"),
      trgVideoLossStop: this.homey.flow.getDeviceTriggerCard("VideoLossStop"),
      trgVideoBlindStart:
        this.homey.flow.getDeviceTriggerCard("VideoBlindStart"),
      trgVideoBlindStop: this.homey.flow.getDeviceTriggerCard("VideoBlindStop"),
      trgLineDetectionStart:
        this.homey.flow.getDeviceTriggerCard("LineDetectionStart"),
      trgLineDetectionStop:
        this.homey.flow.getDeviceTriggerCard("LineDetectionStop"),
      trgIntrusionDetectionStart: this.homey.flow.getDeviceTriggerCard(
        "IntrusionDetectionStart"
      ),
      trgIntrusionDetectionStop: this.homey.flow.getDeviceTriggerCard(
        "IntrusionDetectionStop"
      ),
    };
  }

  override async onPair(session: Homey.PairSession): Promise<void> {
    session.setHandler(
      "testConnection",
      async (data: ConnectionData): Promise<DeviceCallback> => {
        const protocol = data.ssl === true ? "https://" : "http://";

        return new Promise((resolve, _reject) => {
          request(
            {
              url:
                protocol +
                data.address +
                ":" +
                data.port +
                "/ISAPI/System/deviceInfo",
              strictSSL: data.strict,
              rejectUnauthorized: data.strict,
              timeout: 5000,
            },
            (error: any, response: any, body: string) => {
              if (body) {
                console.log("## start test connection ##");
                console.log(
                  protocol +
                    data.address +
                    data.port +
                    data.strict +
                    data.username
                );
                console.log(body);
                const deviceName = body.match("<deviceName>(.*)</deviceName>");
                const deviceID = body.match("<deviceID>(.*)</deviceID>");
                console.log(response.statusCode);
                if (error || response.statusCode !== 200) {
                  const deviceCallback: DeviceCallback = {
                    name: "",
                    id: "",
                    error: response.statusCode || 404,
                  };
                  resolve(deviceCallback);
                } else {
                  const deviceCallback: DeviceCallback = {
                    name: deviceName ? deviceName[1] : "",
                    id: deviceID ? deviceID[1] : "",
                    error: "",
                  };
                  resolve(deviceCallback);
                }
              } else {
                const deviceCallback: DeviceCallback = {
                  name: "",
                  id: "",
                  error: 404,
                };
                resolve(deviceCallback);
              }
            }
          ).auth(data.username, data.password, false);
        });
      }
    );
  }

  override async onPairListDevices(data?: any): Promise<any[]> {
    this.log("list devices");

    const devices: any[] = [];

    console.log(data);

    return devices;
  }
}

export = HikvisionDriver;
