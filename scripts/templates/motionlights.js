import { inspect } from '../../lib/helper.js';

export default function trigger(data, templateData, deviceData){ // Returns true if runFunc is to be run
    // console.log("Trigger motionlights run!")

    //1st runfunc: one of the lights turns off manually
    if(data.type == 'state_changed' && (data.entity_category == 'light' || data.entity_category == 'switch')){
        var manualOff = (templateData.lights_area_id != 'undefined' && data.area_id == templateData.lights_area_id);
        manualOff ||= templateData.lights_entities.includes(data.entity_id);
        manualOff &&= data.old_state.state == 'on' && data.new_state.state == 'off'

        //Todo: check if it was manually turned off
        if(manualOff){
            runLightManuallyOff(data, templateData); 
            return true;// The trigger was handled
        }
    }

    //2nd runfunc: one of the lights turns on
    if(data.type == 'state_changed' && (data.entity_category == 'light' || data.entity_category == 'switch')){
        var on = (templateData.lights_area_id != 'undefined' && data.area_id == templateData.lights_area_id);
        on ||= templateData.lights_entities.includes(data.entity_id);
        on &&= data.old_state.state == 'off' && data.new_state.state == 'on'
        if(on){
            runLightOn(data, templateData); 
            return true;
        }
    }

    //3rd runfunc: the motion turns on
    if(data.type == 'state_changed' && data.entity_category == 'binary_sensor'){
        var moved = typeof templateData.motion_entity_id == 'string' ? data.entity_id == templateData.motion_entity_id : templateData.motion_entity_id.includes(data.entity_id);
        moved &&= data.old_state.state == 'off' && data.new_state.state == 'on';
        if(moved){
            runMotionDetected(data, templateData, deviceData); 
            return true;
        }
    }

    //4th runfunc: the motion turns off
    if(data.type == 'state_changed' && data.entity_category == 'binary_sensor'){
        var stopmoving = typeof templateData.motion_entity_id == 'string' ? data.entity_id == templateData.motion_entity_id : templateData.motion_entity_id.includes(data.entity_id);
        stopmoving &&= data.old_state.state == 'on' && data.new_state.state == 'off';
        if(stopmoving){
            runNoMotionDetected(data, templateData);
        }
    }

    //5th runfunc: the motion has been off for 20mins
    if(data.type == 'time'){
        if(templateData.timer_enabled && data.time - templateData.timer_start_time >= templateData.timer_wait_time){
            runTimedOut(data, templateData, deviceData); 
        }
    }
}

export function setup(templateData){
    templateData.timer_start_time = Math.floor(Date.now() / 1000);
    delete templateData.ignore;
}

const runLightManuallyOff = (data, templateData) => {// We need to disable turning on with motion
    // console.log(data.entity_id);
    // inspect(templateData);
    if(!templateData.ignore || !templateData.ignore[data.entity_id]){
        console.log("Light manually off!")
        delete templateData[data.entity_id + '_enabled'];
    }else{
        console.log("Ignored");
        delete templateData.ignore[data.entity_id];
    }
}

const runLightOn = (data, templateData) => {// We need to enable turning on with motion
    console.log("Light on!")
    templateData[data.entity_id + '_enabled'] = true;
    templateData.timer_start_time = data.time;
}

function createEntityList(templateData, deviceData){ // Create list of entity ids affected by the template
    const entitylist = [...templateData.lights_entities];
    if(templateData.lights_area_id){
        for(const {entities} of deviceData.areas[templateData.lights_area_id]){
            for(const entity of entities){
                if(entity.entity_category == 'light' || entity.entity_category == 'switch'){
                    entitylist.push(entity.entity_id);
                }
            }
        }
    }
    return entitylist
}

const runMotionDetected = (data, templateData, deviceData) => { // Turn on any non-disabled lights, disable timer
    console.log("Motion detected!")
    console.log(createEntityList(templateData, deviceData))
    
    for(const entity_id of createEntityList(templateData, deviceData)){
        if(templateData[entity_id + '_enabled']){
            //TURN ON
            console.log("Turning on " + entity_id)
            deviceData.setState(entity_id, 'turn_on')
        }
    }

    templateData.timer_enabled = false;
    
}

const runNoMotionDetected = (data, templateData) => { //Get the timer going - reset it and enable
    console.log("Motion not detected anymore!")
    templateData.timer_enabled = true;
    templateData.timer_start_time = data.time;
}

const runTimedOut = (data, templateData, deviceData) => { // Turn lights off and disable timer
    console.log("Timed out!"); //Turn off lights
    templateData.timer_enabled = false;

    for(const entity_id of createEntityList(templateData, deviceData)){
        if(templateData[entity_id + '_enabled']){
            //TURN OFF
            console.log("Turning off " + entity_id)
            if(!('ignore' in templateData)){
                templateData.ignore = {};
            }
            templateData.ignore[entity_id] = true; // So that it's marked as not manual
            deviceData.setState(entity_id, 'turn_off');
        }
    }

    // console.log("Template data: ");
    // inspect(templateData);
}