import React, { useEffect, useState } from "react";

import { registerCountHandlers, closeWorker } from "./workers/count/count.main";

const App = () => {

    const [loading, setLoading] = useState(true);
    const [count, setCount] = useState(0);

    useEffect(() => {
        setLoading(true)
        registerCountHandlers(setCount);
        setLoading(false);
        return () => {
            closeWorker();
        }
    }, []);

    useEffect(() => {
        window.addEventListener('beforeunload', closeWorker);

        return () => {
            window.removeEventListener('beforeunload', closeWorker);
        };
    }, []);

    return <>
        {loading ? <div>Loading...</div> : <>
            <div>Count: {count}</div>
        </>}
    </>
};

export default App;