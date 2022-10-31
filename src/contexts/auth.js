import React, { createContext, useContext, useEffect, useState } from "react";
import {
    registerAuthUpdateHandler,
    registerSessionTimeoutHandler,
    registerSessionTimeoutWarningHandler,
    sendLoginCommand,
    sendLogoutCommand,
    unregisterAuthUpdateHandler,
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
    return new Promise((resolve, reject) => {
        resolve(`Successfully logged out ${username}`);
    });
}

export const useProvideAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState();
    const [user, setUser] = useState();
    const [authError, setAuthError] = useState();

    useEffect(() => {
        const authUpdateHandler = ({ data: { isAuthenticated, user } }) => {
            setIsAuthenticated(isAuthenticated);
            setUser(user);
        };
        registerAuthUpdateHandler(authUpdateHandler);

        const sessionTimeoutWarningHandler = ({ message }) => {
            alert(message);
        };
        registerSessionTimeoutWarningHandler(sessionTimeoutWarningHandler);

        const sessionTimeoutHandler = () => {
            sendLogoutCommand({ isAuthenticated: false, user: null });
        };
        registerSessionTimeoutHandler(sessionTimeoutHandler);

        return () => {
            unregisterAuthUpdateHandler(authUpdateHandler);
            unregisterSessionTimeoutWarningHandler(sessionTimeoutWarningHandler);
            unregisterSessionTimeoutHandler(sessionTimeoutHandler);
        }
    }, []);

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