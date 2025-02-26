import fs from 'fs';

import { resolve, consoleLog} from '../lib/helper-server.js';
import { inspect } from '../lib/helper.js';
import { HA_ACCESS } from '../data/constants.js';
import setupTemplates from './setup-templates.js';

import WebSocket from 'ws';

//Override console.log
// console.log = consoleLog;

// let server = await resolve('desktop.local') + ':8123/api/';
let server = '192.168.1.48:8123/api/';
let wsserver = 'ws://' + server + 'websocket';
const ws = new WebSocket(wsserver);

var id = 1;
function send(message, useid = true){
    if(useid){
        message.id = id;
        id++;
    }
    ws.send(JSON.stringify(message))
}


var templates = [];
const idleHandlers = {}

async function setup(){
    templates = await setupTemplates();
    console.log(templates)
}


const requestForResponse = (json, response, unique = true) => new Promise((resolve, reject) => { // If unique is true, it will remove the handler after a response is received
    if(socketstate != IDLE){
        console.error("requestForResponse only works in the idle state")
        return;
    }

    idleHandlers[id] = (data) => {
        if(unique){
            delete idleHandlers[id];
        }
        response(data);
        resolve();
    };
    send(json);
})

const areas = {};
const entities = {};

const AUTH_REQUIRED = 1;
const AWAITING_AUTH = 2;
const IDLE = 5;
var socketstate = AUTH_REQUIRED;

const stateHandlers = {};

stateHandlers[AUTH_REQUIRED] = (data) => {
    if (data.type == 'auth_required') {
        send({ type: 'auth', access_token: HA_ACCESS }, false);
        socketstate = AWAITING_AUTH;
        return true;
    }
    return true;
}

const updateState = async () => {//Update the state of all the entities
    console.log('http://' + server + 'states');
    var res = await fetch('http://' + server + 'states', {
        headers: {
            'Authorization': 'Bearer ' + HA_ACCESS,
            'content-type': 'application/json'
        }
    })

    if(res.status == 200){
        const json = await res.json();
        json.forEach(i => {
            if(!(i.entity_id in entities)){
                return;
            }
            entities[i.entity_id].state = i.state;
            entities[i.entity_id].name = i.attributes.friendly_name;

            entities[i.entity_id].attributes = i.attributes;
            console.log(entities[i.entity_id]);

        })
    }

}

stateHandlers[AWAITING_AUTH] = async (data) => {
    if (data.type == 'auth_ok') {
        socketstate = IDLE;
        await requestForResponse({type: 'config/area_registry/list'}, handleAreas);
        await requestForResponse({type: 'config/device_registry/list'}, handleDevices);
        await requestForResponse({type: 'config/entity_registry/list'}, handleEntities);

        
        await updateState(); //Fetch state of all registered entities

        setInterval(fireTimeEvents, 1000);

        await requestForResponse({type: 'subscribe_events', event_type: 'state_changed'}, handleEvents, false); // Start the event handler

        return true;
    }
    socketstate = AUTH_REQUIRED;
    return false;
}

const handleAreas = (data) => {
    data.result.forEach(({area_id}) => {
        areas[area_id] = [];
    })

    console.log("Areas: ", Object.keys(areas));
}

const handleDevices = (data) => {
    console.log("--- Handling devices ---");
    for(var i of data.result){
        if(i.area_id == null){ // We're only working with entities with assigned areas
            continue;
        }
        const {area_id, name, name_by_user, id, via_device_id, connections} = i;
        areas[i.area_id].push({area_id, name, name_by_user, id, via_device_id, entities: []});
    }
}

const handleEntities = (data) => {
    console.log("--- Handling entities ---");
    console.log(data.result)
    data.result.forEach(i => {
        //Look for device by id
        for(var [key, val] of Object.entries(areas)){
            for(var device of val){
                if(device.id == i.device_id){
                    const {entity_id, has_entity_name, original_name, platform, name, unique_id} = i
                    const entity = {area_id: device.area_id, entity_id, entity_category: entity_id.split('.')[0], has_entity_name, original_name, platform, name, unique_id}
                    device.entities.push(entity);
                    entities[entity_id] = entity;
                    return;
                }
            }
        }
    })
    inspect(areas);
}
const handleEvents = (data) => {
    // console.log("Handling events")
    if(data.type != "event" || data.event.event_type != 'state_changed'){
        return; //We want to ignore any data that's not an event
    }
    if(!(data.event.data.entity_id in entities)){
        console.log("Entity is not registered");
        return;
    }

    entities[data.event.data.entity_id].state = data.event.data.state;
    entities[data.event.data.entity_id].attributes = data.event.data.attributes;
    // console.log(entities[data.event.data.entity_id]);

    const eventData = {
        type: 'state_changed',
        time: Math.floor(Date.now() / 1000),
        event: data.event,
        area_id: entities[data.event.data.entity_id].area_id,
        entity_category: entities[data.event.data.entity_id].entity_category,
        entity_id: data.event.data.entity_id,
        old_state: data.event.data.old_state,
        new_state: data.event.data.new_state,
        origin: data.event.data.origin,
        time_fired: data.event.data.time_fired
    };

    // inspect(eventData);

    triggerTemplates(eventData);

}

async function setState(entity_id, state){
    console.log("Setting state")
    var res =  await fetch('http://' + server + 'services/' + entities[entity_id].entity_category + '/' + state, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + HA_ACCESS,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            entity_id: entity_id
        })
    });
    console.log(res.status);
}

const fireTimeEvents = () => {
    const eventData = {
        type: 'time',
        time: Math.floor(Date.now() / 1000)
    };

    triggerTemplates(eventData);
}

function triggerTemplates(eventData){
    templates.forEach((t) => {
        const oldData = JSON.stringify({template: t.template, data: t.data});
        t.trigger(eventData, t.data, {areas, entities, setState});
        const newData = JSON.stringify({template: t.template, data: t.data});
        if(oldData != newData){
            fs.writeFileSync(t.path, newData); // Save new data if different
        }
    })
}

stateHandlers[IDLE] = (data) => {
    if(data.id in idleHandlers){
        idleHandlers[data.id](data)
    }else{
        console.log("Idle handler not found")
    }
    return true;
}


setup();
ws.on('message', function message(data) {
    var json = JSON.parse(data);
    var handled = stateHandlers[socketstate](json);
    while (!handled) {
        handled = stateHandlers[socketstate](json);
    }
});

ws.on('close', function close() {
    console.log('disconnected');
});