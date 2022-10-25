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

/**
* check if SharedWorkerGlobalScope is available, meaning this is a SharedWorker
*/
const isSharedWorkerAvailable = "SharedWorkerGlobalScope" in self;

/**
* restore the state from the storage
*/
const restoreFromStorage = async () => {
    const storedCountObj = await localforage.getItem("countObj");
    obj = storedCountObj || obj;
}

/**
* increase the counter and save the global state to the storage
*/
const increaseAndSaveToStorage = async () => {
    obj.counter++;
    await localforage.setItem("countObj", obj);
}

/**
* add port to the list of ports we need to broadcast the state changes to
* resotre the initial global state from the storage
* set up message hanlding
* and set up the heavy task
*/
const start = async (port) => {
    ports.push(port);
    await restoreFromStorage();

    /**
    * set up message hadling
    */
    port.onmessage = function (event) {
        /**
        * on "close" command, close the connection from this worker to the main thread
        * remove the connection from the connection list
        * clear the heavy task if there is no connection left
        */
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

    /**
    * the heavy task
    */
    if (interval === undefined) {
        interval = setInterval(async () => {
            /**
            * lock so we make sure only one thread can access this block of code
            * if there is already a thread accessing this code (`lock` will be null), then do nothing
            */
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
* if this is a SharedWorker, setup `onconnect`
*/
if (isSharedWorkerAvailable) {
    onconnect = async function (event) {
        const port = event.source;
        start(port);
    };
} else { // this is a dedicated worker
    start(self);
}

onerror = function (event) {
    console.error(event);
};