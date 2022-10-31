import React from "react";
import { useAuthContext } from "../contexts/auth";

export const Home = () => {
    const { user, signout } = useAuthContext();
    return (<>
        <div>Hello, {user?.name}!</div>
        <button onClick={() => signout()}>Logout</button>
    </>);
}