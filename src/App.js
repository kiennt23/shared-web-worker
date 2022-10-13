import React, { useEffect } from "react";

const App = () => {

    const [loading, setLoading] = React.useState(true);
    const [count, setCount] = React.useState(0);

    useEffect(() => {
        const worker = new SharedWorker("worker.js");
        worker.port.onmessage = (event) => {
            setCount(event.data.counter);
        };
        setLoading(false);
        return () => {
            worker.port.postMessage("close");
        };
    }, []);

    return <>
        {loading ? <div>Loading...</div> : <div>Count: {count}</div>}
    </>
};

export default App;