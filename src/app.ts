import Homey = require("homey");

class HikvisionApp extends Homey.App {
  override async onInit(): Promise<void> {
    this.log("Hikvision is running...");
  }
}

export = HikvisionApp;
