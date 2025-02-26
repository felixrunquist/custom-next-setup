import util from 'util';

export function inspect(object){
    console.log(util.inspect(object, {showHidden: false, depth: null, colors: true}))
}