import React, { createContext, useContext, useEffect, useState } from "react";
import {
    registerAuthUpdateHandler, registerClearTimersHandler,
    registerSessionTimeoutHandler,
    registerSessionTimeoutWarningHandler,
    sendActivityEvent,
    sendLoginCommand,
    sendLogoutCommand,
    unregisterAuthUpdateHandler, unregisterClearTimersHandler,
    unregisterSessionTimeoutHandler,
    unregisterSessionTimeoutWarningHandler
} from "../workers/auth/auth.main";

export const AuthContext = createContext();

const callLoginAPI = async (username) => {
    return new Promise((resolve, reject) => {
        if (username === "kiennguyen") {
            resolve({
                username: "kiennguyen",
                name: "Kien",
                email: "kien@xendit.co"
            })
        } else if (username === "putra") {
            resolve({
                username: "putra",
                name: "Putra",
                email: "putra@xendit.co"
            });
        } else {
            reject(new Error("Failed Login"));
        }
    })
}

const callLogoutAPI = async (username) => {
    return new Promise((resolve) => {
        resolve(`Successfully logged out ${username}`);
    });
}

const events = [
    'mousedown',
    'mousemove',
    'keypress',
    'click',
    'scroll',
    'touchstart',
];

export const useProvideAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState();
    const [user, setUser] = useState();
    const [authError, setAuthError] = useState();
    const [remainingSeconds, setRemainingSeconds] = useState();

    useEffect(() => {
        const authUpdateHandler = ({ data: { isAuthenticated, user } }) => {
            setIsAuthenticated(isAuthenticated);
            setUser(user);
        };
        registerAuthUpdateHandler(authUpdateHandler);

        return () => {
            unregisterAuthUpdateHandler(authUpdateHandler);
        }
    }, []);

    useEffect(() => {
        const sessionTimeoutWarningHandler = ({ remainingSeconds }) => {
            setRemainingSeconds(remainingSeconds);
        };
        const sessionTimeoutHandler = () => {
            sendLogoutCommand({ isAuthenticated: false, user: null });
        };
        const clearTimersHandler = () => {
            setRemainingSeconds(null);
        }

        if (isAuthenticated) {
            registerSessionTimeoutWarningHandler(sessionTimeoutWarningHandler);
            registerSessionTimeoutHandler(sessionTimeoutHandler);
            registerClearTimersHandler(clearTimersHandler);
        } else {
            unregisterSessionTimeoutWarningHandler(sessionTimeoutWarningHandler);
            unregisterSessionTimeoutHandler(sessionTimeoutHandler);
            unregisterClearTimersHandler(clearTimersHandler);
        }

        return () => {
            unregisterSessionTimeoutWarningHandler(sessionTimeoutWarningHandler);
            unregisterSessionTimeoutHandler(sessionTimeoutHandler);
            unregisterClearTimersHandler(clearTimersHandler);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            events.forEach((event) => {
                window.addEventListener(event, sendActivityEvent, true);
            });
        } else {
            events.forEach((event) => {
                window.removeEventListener(event, sendActivityEvent, true);
            });
        }

        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, sendActivityEvent, true);
            });
        }
    }, [isAuthenticated]);

    const signin = async (username) => {
        setAuthError(null);
        try {
            const user = await callLoginAPI(username);
            sendLoginCommand({ isAuthenticated: true, user });
        } catch (e) {
            setAuthError(e);
        }
    }

    const signout = async () => {
        const username = user?.username;
        await callLogoutAPI(username);
        sendLogoutCommand({ isAuthenticated: false, user: null });
    }

    return {
        isAuthenticated,
        user,
        authError,
        remainingSeconds,
        signin,
        signout
    }
}

export const useAuthContext = () => {
    return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
    const auth = useProvideAuth();
    return (
        <AuthContext.Provider value={auth}>{ children }</AuthContext.Provider>
    );
}