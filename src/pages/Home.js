import React from "react";
import { useAuthContext } from "../contexts/auth";

export const Home = () => {
    const { user, authWarning, signout } = useAuthContext();
    return (<>
        <div>Hello, {user?.name}!</div>
        {authWarning && <div>{authWarning}</div>}
        <button onClick={() => signout()}>Logout</button>
    </>);
}