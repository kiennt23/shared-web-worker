import localforage from "localforage";

const SESSION_TIMEOUT_IN_MILLIS = 60 * 1000; // 1 minute in milliseconds
const SESSION_WARNING_BUFFER_IN_SECONDS = 5;
const SESSION_WARNING_BUFFER_IN_MILLIS = SESSION_WARNING_BUFFER_IN_SECONDS * 1000; // 5 seconds in milliseconds

/**
* The Global state
*/
let authObj = {
    isAuthenticated: false,
    user: null,
    sessionTimeout: null,
    sessionWarningTimeout: null,
    sessionWarningInterval: null
};

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
    return { ...authObj, ...storedCountObj };
}

const setupTimers = async () => {
    if (authObj.isAuthenticated) {
        authObj.sessionWarningTimeout = setTimeout(() => {
            let remainingSeconds = SESSION_WARNING_BUFFER_IN_SECONDS;
            ports.forEach(port => port.postMessage({ type: "SESSION_TIMEOUT_WARNING", message: `Session timeout in ${remainingSeconds} seconds`, remainingSeconds }));
            authObj.sessionWarningInterval = setInterval(() => {
                clearInterval(authObj.sessionWarningInterval);
                delete authObj.sessionWarningInterval;
                remainingSeconds--;
                if (remainingSeconds === 0) {
                    return;
                }
                ports.forEach(port => port.postMessage({ type: "SESSION_TIMEOUT_WARNING", message: `Session timeout in ${remainingSeconds} seconds`, remainingSeconds }));
            }, 1000);
        }, SESSION_TIMEOUT_IN_MILLIS - SESSION_WARNING_BUFFER_IN_MILLIS);
        authObj.sessionTimeout = setTimeout(() => {
            ports.forEach(port => port.postMessage({ type: "SESSION_TIMEOUT" }));
        }, SESSION_TIMEOUT_IN_MILLIS);
        await localforage.setItem("authObj", authObj);
    }
}

const clearTimers = async () => {
    authObj.sessionWarningInterval != null && clearInterval(authObj.sessionWarningInterval);
    delete authObj.sessionWarningInterval;
    authObj.sessionWarningTimeout != null && clearTimeout(authObj.sessionWarningTimeout);
    delete authObj.sessionWarningTimeout;
    authObj.sessionTimeout != null && clearTimeout(authObj.sessionTimeout);
    delete authObj.sessionTimeout;
    ports.forEach(port => port.postMessage({ type: "CLEAR_TIMERS" }));
    await localforage.setItem("authObj", authObj);
}

const resetActivity = async (activity) => {
    console.log(`The last activity ${activity}`);
    const sessionEnd = new Date(new Date().getTime() + SESSION_TIMEOUT_IN_MILLIS);
    console.log(`Session will end at ${sessionEnd.toLocaleString()}`);
    await clearTimers();
    await setupTimers();
}

/**
* add port to the list of ports we need to broadcast the state changes to
* restore the initial global state from the storage
* set up message hanlding
* and set up the heavy task
*/
const start = async (port) => {
    ports.push(port);
    await navigator.locks.request("authObj", async () => {
        authObj = await restoreFromStorage();
        await resetActivity("opentab");
        ports.forEach(port => port.postMessage({ type: "AUTH_UPDATE", data: authObj }));
    });

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
                await clearTimers();
            }
        } else if (event.data.type === "LOGIN_COMMAND") {
            await navigator.locks.request("authObj", async () => {
                authObj = { ...authObj, ...event.data.data };
                await setupTimers();
                ports.forEach(port => port.postMessage({ type: "AUTH_UPDATE", data: authObj }));
            });
        } else if (event.data.type === "LOGOUT_COMMAND") {
            await navigator.locks.request("authObj", async () => {
                authObj = { ...authObj, ...event.data.data };
                await clearTimers();
                ports.forEach(port => port.postMessage({ type: "AUTH_UPDATE", data: authObj }));
            });
        } else if (event.data.type === "ACTIVITY") {
            await navigator.locks.request("authObj", async () => {
                const activity = event.data.data;
                await resetActivity(activity);
            });
        }
    };
}

/**
* if this is a SharedWorker, setup `onconnect`
*/
if (isSharedWorkerAvailable) {
    self.onconnect = async function (event) {
        const port = event.source;
        await start(port);
    };
} else { // this is a dedicated worker
    start(self);
}

onerror = function (event) {
    console.error(event);
};