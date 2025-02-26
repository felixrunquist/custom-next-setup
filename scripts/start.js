//Script that's launched on start
import { fork } from 'child_process';

const mdnsprocess = fork('./scripts/advertise-mdns.js');
const haprocess = fork('./scripts/halistener.js');

mdnsprocess.on('message', msgReceived);
mdnsprocess.on('exit', childExited);
haprocess.on('message', msgReceived);
haprocess.on('exit', childExited);

// child.send({ hello: 'world' });

function msgReceived(msg) {
    console.log('Message from child:', msg);
}

function childExited(code, signal){
    console.log(`Child process exited with code ${code}, signal: ${signal}`);
}


var exited = false;
function exitHandler(options, exitCode) {
    if(exited){
        return;
    }
    console.log("Exiting start.js");
    mdnsprocess.kill();
    haprocess.kill();
    exited = true;
    process.exit(0);
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));