import SharedWorker from "@okikio/sharedworker";

const initWorker = () => {
    return new SharedWorker("auth.worker.js");
}

const worker = initWorker();

let authUpdateHandlers = [];
let sessionTimeoutHandlers = [];
let sessionTimeoutWarningHandlers = [];

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

export const sendActivityEvent = (event) => {
    worker.port.postMessage({ type: "ACTIVITY", data: event.type });
}

/**
* Register an auth update handler
*/
export const registerAuthUpdateHandler = (handler) => {
    authUpdateHandlers.push(handler);
}

/**
* Unregister auth update handler
*/
export const unregisterAuthUpdateHandler = (handler) => {
    authUpdateHandlers = authUpdateHandlers.filter((theHandler) => theHandler !== handler);
}

/**
* Register a session timeout handler
*/
export const registerSessionTimeoutHandler = (handler) => {
    sessionTimeoutHandlers.push(handler);
}

/**
* Unregister session timeout handler
*/
export const unregisterSessionTimeoutHandler = (handler) => {
    sessionTimeoutHandlers = sessionTimeoutHandlers.filter((theHandler) => theHandler !== handler);
}

/**
* Register a session timeout warning handler
*/
export const registerSessionTimeoutWarningHandler = (handler) => {
    sessionTimeoutWarningHandlers.push(handler);
}

/**
* Unregister a session timeout warning handler
*/
export const unregisterSessionTimeoutWarningHandler = (handler) => {
    sessionTimeoutWarningHandlers = sessionTimeoutWarningHandlers.filter((theHandler) => theHandler !== handler);
}

/**
* handle the data sent from the worker by calling each hander in the `handlers` list
*/
const handleMessage = () => {
    worker.port.onmessage = (event) => {
        if (event.data.type === "AUTH_UPDATE") {
            authUpdateHandlers.forEach(handler => handler(event.data));
        }
        if (event.data.type === "SESSION_TIMEOUT") {
            sessionTimeoutHandlers.forEach(handler => handler(event.data));
        }
        if (event.data.type === "SESSION_TIMEOUT_WARNING") {
            sessionTimeoutWarningHandlers.forEach(handler => handler(event.data));
        }
    };
}

handleMessage();