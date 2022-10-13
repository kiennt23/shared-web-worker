/**
 * The Global state
 */
const obj = {
    counter: 0
};

let interval;

/**
 * The list of ports that are connected to this shared worker.
 */
let ports = [];
  
/**
 * When a connection is made into this shared worker, expose `obj`
 * via the connection `port`.
 */
onconnect = function (event) {
    const port = event.source;
    ports.push(port);

    if (!interval) {
        interval = setInterval(() => {
            obj.counter++;
            ports.forEach(port => port.postMessage(obj));
        }, 1000);
    }
};

onerror = function (event) {
    console.error(event);
};