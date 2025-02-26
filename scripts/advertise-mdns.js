import fs from 'fs';
import mdns from 'mdns-js'

import { consoleLog } from '../lib/helper-server.js';

//Override console.log
// console.log = consoleLog;

var activeport = fs.existsSync(process.cwd() + '/activeport.txt') ? fs.readFileSync(process.cwd() + '/activeport.txt') : 3000;
var mqttport = fs.existsSync(process.cwd() + '/mqttport.txt') ? fs.readFileSync(process.cwd() + '/mqttport.txt') : 1883;

var service;
var service2;
var service3;
function start() {
    console.log("Starting advertise-mdns.js");
    service = mdns.createAdvertisement(mdns.tcp('_esppihome'), activeport, {
        name: 'test',
        txt: {
            txtvers: '1'
        }
    });
    service.start();

    //Legacy service
    service2 = mdns.createAdvertisement(mdns.tcp('_espmqttrelay'), activeport, {
        name: 'test',
        txt: {
            txtvers: '1'
        }
    });
    service2.start();

    service3 = mdns.createAdvertisement(mdns.tcp('_mqttrelay'), mqttport, {
        name: 'test',
        txt: {
            txtvers: '1'
        }
    });
    service3.start();
}
start();

process.stdin.resume();//so the program will not close instantly

var exited = false;
function exitHandler(options, exitCode) {
    if (exited) {
        return;
    }
    console.log("Exiting advertise-mdns.js!")
    if (typeof service != 'undefined') {
        service.stop();
    }
    if (typeof service2 != 'undefined') {
        service2.stop();
    }

    if (typeof service3 != 'undefined') {
        service3.stop();
    }
    exited = true
    process.exit(0)
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
process.on('SIGTERM', exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));
