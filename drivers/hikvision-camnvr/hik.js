var request = require("request");
const Homey = require('homey');


exports.GetSoftwareVersion = function (address, username, password, port, ssl, isstrict) {
    var protocol = ssl == true ? 'https://' : 'http://';
    return new Promise(function(resolve, reject){
        request({url: protocol + address + ':' + port + '/ISAPI/System/deviceInfo', strictSSL: isstrict, rejectUnauthorized: isstrict},function (error, response, body) {
			if(body){
			var softwareVersion = body.match("<firmwareVersion>(.*)</firmwareVersion>");
			}
            if ((error) || (response.statusCode !== 200)) {
                if (response) 
                    reject(response.statusCode);
                else 
                    reject('GetSoftwareVersion:' + error.errno);
            } else {
               resolve(softwareVersion[1]);
            }
        }).auth(username,password,false);
    });
}


exports.GetDeviceType = function (address, username, password, port, ssl, isstrict) {
	    var protocol = ssl == true ? 'https://' : 'http://';
    return new Promise(function(resolve, reject){
        request({url: protocol + address + ':' + port + '/ISAPI/System/deviceInfo', strictSSL: isstrict, rejectUnauthorized: isstrict},function (error, response, body) {
			if(body){
			var deviceType = body.match("<deviceType>(.*)</deviceType>");
			}
            if ((error) || (response.statusCode !== 200)) {
                if (response) 
                    reject(response.statusCode);
                else 
                    reject('GetDeviceType:' + error.errno);
            } else {
               resolve(deviceType[1]);
            }
        }).auth(username,password,false);
    });
}

exports.GetDeviceName = function (address, username, password, port, ssl, isstrict) {
	    var protocol = ssl == true ? 'https://' : 'http://';
    return new Promise(function(resolve, reject){
        request({url: protocol + address + ':' + port + '/ISAPI/System/deviceInfo', strictSSL: isstrict, rejectUnauthorized: isstrict},function (error, response, body) {
			if(body){
			var deviceName = body.match("<deviceName>(.*)</deviceName>");
			}
            if ((error) || (response.statusCode !== 200)) {
                if (response) 
                    reject(response.statusCode);
                else 
                    reject('GetDeviceName:' + error.errno);
            } else {
               resolve(deviceName[1]);
            }
        }).auth(username,password,false);
    });
}




