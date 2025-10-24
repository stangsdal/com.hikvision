declare module 'homey' {
  export class App {
    log(message: string): void;
    onInit(): Promise<void> | void;
  }

  export class Driver {
    log(message: string): void;
    onInit(): Promise<void> | void;
    onPair(session: PairSession): Promise<void> | void;
    onPairListDevices(data?: any): Promise<any[]> | any[];
    homey: Homey;
  }

  export class Device {
    log(message: string): void;
    error(message: string, ...args: any[]): void;
    onInit(): Promise<void> | void;
    onAdded(): Promise<void> | void;
    onDeleted(): Promise<void> | void;
    onSettings(options: { oldSettings: any; newSettings: any; changedKeys: string[] }): Promise<boolean | void> | boolean | void;
    getName(): string;
    getSettings(): any;
    setCapabilityValue(capability: string, value: any): Promise<void>;
    getCapabilityValue(capability: string): any;
    setAvailable(): Promise<void>;
    setUnavailable(message?: string): Promise<void>;
    setCameraImage(id: string, title: string, image: Image): Promise<void>;
    homey: Homey;
  }

  export class Image {
    setStream(streamFunction: (stream: any) => void | Promise<void>): void;
  }

  export interface FlowCard {
    trigger(device: Device, tokens?: any, state?: any): Promise<void>;
  }

  export interface FlowCardAction {
    registerRunListener(listener: (args: any, state: any) => Promise<any> | any): FlowCardAction;
  }

  export interface PairSession {
    setHandler(event: string, handler: (data: any) => Promise<any> | any): void;
  }

  export interface Homey {
    flow: {
      getDeviceTriggerCard(id: string): FlowCard;
      getActionCard(id: string): FlowCardAction;
    };
    images: {
      createImage(): Promise<Image>;
    };
    __(key: string, tokens?: any): string;
  }

  const Homey: {
    App: typeof App;
    Driver: typeof Driver;
    Device: typeof Device;
    Image: typeof Image;
  };

  export default Homey;
}