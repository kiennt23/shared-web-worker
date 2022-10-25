import SharedWorker from "@okikio/sharedworker";

const initWorker = () => {
    return new SharedWorker("count.worker.js");
}

const worker = initWorker();

let handlers = [];

/**
* close the worker/connection by sending a "close" command to the worker
*/
export const closeWorker = () => {
    worker.port.postMessage({ command: "close" });
}

/**
* Register a count handler
*/
export const registerCountHandlers = (handler) => {
    handlers.push(handler);
}

/**
* handle the data sent from the worker by calling each hander in the `handlers` list
*/
const handleMessage = () => {
    worker.port.onmessage = (event) => {
        handlers.forEach(handler => handler(event.data.counter));
    };
}

handleMessage();