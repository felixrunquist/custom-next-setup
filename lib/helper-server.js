import * as mdnsResolver from 'mdns-resolver'

export function resolve(hostname){
  return new Promise(function(resolve, reject) {
    mdnsResolver.resolve(hostname, 'A').then(resolve)
  });
}

export function consoleLog(...args){
    if (process.send) {
        process.send({ type: 'log', message: args});
    } else {
        process.stdout.write(args.join(' ') + '\n'); // Fallback for normal execution
    }
}