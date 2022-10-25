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

const isSharedWorkerAvailable = typeof SharedWorkerGlobalScope !== 'undefined';

if (isSharedWorkerAvailable) {
    onconnect = function (event) {
        const port = event.source;
        ports.push(port);

        port.onmessage = function (event) {
            if (event.data.command === "close") {
                const index = ports.indexOf(port);
                if (index > -1) {
                    ports.splice(index, 1);
                }
                if (ports.length === 0) {
                    clearInterval(interval);
                }
            }
        };

        if (interval === undefined) {
            interval = setInterval(() => {
                obj.counter++;
                ports.forEach(port => port.postMessage(obj));
            }, 1000);
        }
    };
} else { // handle dedicated web worker
    interval = setInterval(() => {
        obj.counter++;
        postMessage(obj);
    })

    onmessage = function (event) {
        if (event.data.command === "close") {
            clearInterval(interval);
        }
    }
}

onerror = function (event) {
    console.error(event);
};