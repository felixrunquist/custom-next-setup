import { TEMPLATE_DATA } from '../data/constants.js';
import fs from 'fs';

export default async function setupTemplates(){
    const imported = {};

    await Promise.all(
        fs.readdirSync(process.cwd() + '/scripts/templates/' ).map(async file => {
            if(file.endsWith('.cjs') || file.endsWith('.js')){
                imported[file.split('.')[0]] = await import(process.cwd() + '/scripts/templates/' + file);
            }
        })
    );


    const templates = []
    await Promise.all(
        fs.readdirSync(TEMPLATE_DATA).map(async file => {
            const template = JSON.parse(fs.readFileSync(TEMPLATE_DATA + file))
            console.log(template)
            templates.push({trigger: imported[template.template].default, data: template.data, template: template.template, path: TEMPLATE_DATA + file});
            if(imported[template.template].setup){
                imported[template.template].setup(template.data);
            }
        })
    );

    return templates;
}

