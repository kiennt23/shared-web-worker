import SharedWorker from "@okikio/sharedworker";

const initWorker = () => {
    return new SharedWorker("count.worker.js");
}

const worker = initWorker();

let handlers = [];

export const closeWorker = () => {
    worker.port.postMessage({ command: "close" });
}

export const registerCountHandlers = (handler) => {
    handlers.push(handler);
}

const handleMessage = () => {
    worker.port.onmessage = (event) => {
        handlers.forEach(handler => handler(event.data.counter));
    };
}

handleMessage();