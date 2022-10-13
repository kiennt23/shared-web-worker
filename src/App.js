import React, { useEffect } from "react";

const App = () => {

    const [loading, setLoading] = React.useState(true);
    const [count, setCount] = React.useState(0);
    const [worker, setWorker] = React.useState(null);

    useEffect(() => {
        const worker = new SharedWorker("worker.js");
        setWorker(worker);
        worker.port.onmessage = (event) => {
            setCount(event.data.counter);
        };
        setLoading(false);
        return () => {
            worker.port.postMessage({ command: "close" });
        };
    }, []);

    useEffect(() => {
        const handleClosePort = () => {
            worker.port.postMessage({ command: "close" });
        };
        if (worker) {
            window.addEventListener('beforeunload', handleClosePort);
        }
        return () => {
            window.removeEventListener('beforeunload', handleClosePort);
        };
    }, [worker]);

    return <>
        {loading ? <div>Loading...</div> : <>
            <div>Count: {count}</div>
        </>}
    </>
};

export default App;