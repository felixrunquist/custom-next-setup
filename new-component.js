const fs = require("fs");
const {program} = require("commander");

const VERSION = 0.2;

var config = {dir: "components/"};

program
    .version(VERSION)
    .arguments("<componentName>")
    // .option(
    //   '-l, --lang <language>',
    //   'Which language to use (default: "js")',
    //   /^(js|ts)$/i,
    //   config.lang
    // )
    .option(
        "-d, --dir <pathToDirectory>",
        'Path to the "components" directory (default: "/components")',
    )
    .option(
        "-f, --foldername <folderName>",
        "Folder name if differs from component name (default: same as component name)",
    )
    .parse(process.argv);

var {dir, folderName} = program.opts();
var [componentName] = program.args;
if (typeof dir != "undefined") {
    config.dir = dir;
}
if (typeof folderName == "undefined") {
    folderName = componentName;
}

folderName = folderName.replace(
    /[A-Z]/g,
    (letter) => `-${letter.toLowerCase()}`,
); //dash case
if (folderName[0] == "-") {
    folderName = folderName.substring(1);
}
componentName = componentName.replace(/([-_][a-z,A-Z])/g, (group) =>
    group.toUpperCase().replace("-", "").replace("_", ""),
); //camel case
componentName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
const path = process.env.PWD + "/" + config.dir + folderName + "/";

console.info("Component creator V " + VERSION);
console.info("Component name: " + componentName);
console.info("Creating boilerplate component at " + path);

fs.mkdirSync(path);
fs.writeFileSync(
    path + "index.js",
    `export { default } from './${folderName}';`,
);
fs.writeFileSync(
    path + folderName + ".js",
    `import styles from './${folderName}.module.scss';
import { useEffect, useState, useRef } from 'react'

export default function ${componentName}({...props}){
    return (
        <>
        </>
    )
}
`,
);

fs.writeFileSync(path + folderName + ".module.scss", "");
console.info("Done. ");
// console.log(process.env.PWD)
