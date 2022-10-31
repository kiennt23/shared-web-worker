import localforage from "localforage";

/**
* The Global state
*/
let authObj = { isAuthenticated: false, user: null };

const SESSION_TIMEOUT_IN_MILLIS = 60 * 1000; // 1 minute in milliseconds
let sessionTimeout;

const SESSION_WARNING_BUFFER_IN_MILLIS = 5 * 1000; // 5 seconds in milliseconds
let sessionWarningTimeout;

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
    const storedCountObj = await localforage.getItem("authObj");
    authObj = storedCountObj || authObj;
}

const setupTimers = () => {
    sessionWarningTimeout = setTimeout(() => {
        ports.forEach(port => port.postMessage({ type: "SESSION_TIMEOUT_WARNING", message: "Session timeout in 5 seconds" }));
    }, SESSION_TIMEOUT_IN_MILLIS - SESSION_WARNING_BUFFER_IN_MILLIS);
    sessionTimeout = setTimeout(() => {
        ports.forEach(port => port.postMessage({ type: "SESSION_TIMEOUT" }));
    }, SESSION_TIMEOUT_IN_MILLIS);
}

const clearTimers = () => {
    sessionWarningTimeout != null && clearTimeout(sessionWarningTimeout);
    sessionTimeout != null && clearTimeout(sessionTimeout);
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
    port.onmessage = async function (event) {
        /**
        * on "close" command, close the connection from this worker to the main thread
        * remove the connection from the connection list
        * clear the heavy task if there is no connection left
        */
        if (event.data.type === "CLOSE_COMMAND") {
            const index = ports.indexOf(port);
            if (index > -1) {
                ports.splice(index, 1);
            }
            if (ports.length === 0) {
                clearTimers();
            }
        } else if (event.data.type === "LOGIN_COMMAND") {
            const authData = event.data.data;
            setupTimers();
            await localforage.setItem("authObj", authData);
            ports.forEach(port => port.postMessage({ type: "AUTH_UPDATE", data: authData }));
        } else if (event.data.type === "LOGOUT_COMMAND") {
            const authData = event.data.data;
            clearTimers();
            await localforage.removeItem("authObj");
            ports.forEach(port => port.postMessage({ type: "AUTH_UPDATE", data: authData}));
        } else if (event.data.type === "ACTIVITY") {
            clearTimers();
            setupTimers();
        }
    };
}

/**
* if this is a SharedWorker, setup `onconnect`
*/
if (isSharedWorkerAvailable) {
    onconnect = async function (event) {
        const port = event.source;
        await start(port);
    };
} else { // this is a dedicated worker
    start(self);
}

onerror = function (event) {
    console.error(event);
};