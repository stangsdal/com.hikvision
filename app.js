'use strict';

const Homey = require('homey');

class HikvisionApp extends Homey.App {
	
	onInit() {
		this.log('Hikvision is running...');
	}
	
}

module.exports = HikvisionApp;