import React, { useState } from "react";
import { useAuthContext } from "../contexts/auth";

export const Login = () => {
    const [ username, setUsername ] = useState();
    const { signin, authError } = useAuthContext();
    return (<>
        {authError && <div>Auth Error: {authError.message}</div>}
        <label htmlFor="username">Username</label><input id="username" type="text" onChange={(event) => setUsername(event.target.value)}/><br/>
        <button onClick={() => signin(username)}>Login</button>
    </>);
}