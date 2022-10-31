import SharedWorker from "@okikio/sharedworker";

const initWorker = () => {
    return new SharedWorker("auth.worker.js");
}

const worker = initWorker();

let authUpdateHandlers = [];

/**
* close the worker/connection by sending a "close" command to the worker
*/
export const closeWorker = () => {
    worker.port.postMessage({ type: "CLOSE_COMMAND" });
}

export const sendLoginCommand = (authData) => {
    worker.port.postMessage({ type: "LOGIN_COMMAND", data: authData });
}

export const sendLogoutCommand = (authData) => {
    worker.port.postMessage({ type: "LOGOUT_COMMAND", data: authData });
}

/**
* Register a count handler
*/
export const registerAuthUpdateHandler = (handler) => {
    authUpdateHandlers.push(handler);
}

/**
* handle the data sent from the worker by calling each hander in the `handlers` list
*/
const handleMessage = () => {
    worker.port.onmessage = (event) => {
        if (event.data.type === 'AUTH_UPDATE') {
            const authData = event.data.data;
            authUpdateHandlers.forEach(handler => handler(authData));
        }
    };
}

handleMessage();