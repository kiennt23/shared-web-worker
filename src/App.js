import React, { useEffect } from "react";
import { AuthProvider} from "./contexts/auth";
import { closeWorker } from "./workers/auth/auth.main";
import { Main } from "./Main";

const App = () => {

    useEffect(() => {
        window.addEventListener("beforeunload", closeWorker);

        return () => {
            window.removeEventListener("beforeunload", closeWorker);
        };
    }, []);

    return (
        <AuthProvider>
            <Main />
        </AuthProvider>
    );
};

export default App;