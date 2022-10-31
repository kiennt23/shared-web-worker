import React from "react";
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect
} from "react-router-dom";

import { Login } from "./pages/Login";
import { useAuthContext } from "./contexts/auth";
import { Home } from "./pages/Home";

export const Main = () => {
    const { isAuthenticated } = useAuthContext();
    return (
        <Router>
            {isAuthenticated ?
                <Switch>
                    <Route path="/home">
                        <Home />
                    </Route>
                    <Route path="/">
                        <Redirect to="/home" />
                    </Route>
                </Switch> :
                <Switch>
                    <Route path="/login">
                        <Login />
                    </Route>
                    <Route path="/">
                        <Redirect to="/login" />
                    </Route>
                </Switch>
            }
        </Router>
    );
}