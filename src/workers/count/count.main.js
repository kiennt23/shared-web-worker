const initWorker = () => {
    const isSharedWorkerAvailable = !!window.SharedWorker;
    const isDedicatedWorkerAvailable = !!window.Worker;

    let worker;
    if (isSharedWorkerAvailable) {
        worker = new SharedWorker("count.worker.js");
    } else if (isDedicatedWorkerAvailable) {
        worker = new Worker("count.worker.js");
    }

    return worker;
}

const worker = initWorker();

let handlers = [];

export const closeWorker = () => {
    if (worker?.port) {
        worker.port.postMessage({ command: "close" });
    } else if (worker) {
        worker.postMessage({ command: "close" });
    }
}

export const registerCountHandlers = (handler) => {
    handlers.push(handler);
}

const handleMessage = () => {
    const handleEvent = (event) => {
        handlers.forEach(handler => handler(event.data.counter));
    };

    if (worker?.port) {
        worker.port.onmessage = handleEvent;
    } else if (worker) {
        worker.onmessage = handleEvent;
    }
}

handleMessage();