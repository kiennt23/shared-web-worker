import localforage from "localforage";

/**
 * The Global state
 */
let obj = { counter: 0 };

let interval;

/**
 * The list of ports that are connected to this shared worker.
 */
let ports = [];

const isSharedWorkerAvailable = "SharedWorkerGlobalScope" in self;

const restoreFromStorage = async () => {
    const storedCountObj = await localforage.getItem("countObj");
    obj = storedCountObj || obj;
}

const increaseAndSaveToStorage = async () => {
    obj.counter++;
    await localforage.setItem("countObj", obj);
}

const start = async (port) => {
    ports.push(port);
    await restoreFromStorage();
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
        interval = setInterval(async () => {
            navigator.locks.request("countObj", { ifAvailable: true }, async (lock) => {
                if (!lock) return;
                await restoreFromStorage();
                await increaseAndSaveToStorage();
                ports.forEach(port => port.postMessage(obj));
            });
        }, 1000);
    }
}

/**
* When a connection is made into this shared worker, expose `obj`
* via the connection `port`.
*/
if (isSharedWorkerAvailable) {
    onconnect = async function (event) {
        const port = event.source;
        start(port);
    };
} else {
    start(self);
}

onerror = function (event) {
    console.error(event);
};