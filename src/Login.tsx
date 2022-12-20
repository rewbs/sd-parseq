import { Avatar, Chip } from '@mui/material';
import React from "react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "./UserAuthContext";

const Login = () => {
    //@ts-ignore
    const { googleSignIn, logOut, user } = useUserAuth();
    const navigate = useNavigate();
    const handleLogout = async () => {
        if (!logOut) {
            return;
        }
        try {
            await logOut();
            navigate(window.location, { replace: true });
        } catch (error : any) {
            console.error(error.message);
        }
    }

    const handleGoogleSignIn = async (e:any) => {
        if (!googleSignIn) {
            return;
        }
        e.preventDefault();
        try {
            await googleSignIn();
            navigate(window.location, { replace: true });
        } catch (error : any) {
            console.error(error.message);
        }
    };

    const chip = user ?    
        <Chip
            onClick={handleLogout}
            avatar={<Avatar
                alt={user?.displayName}
                src={user?.photoURL} 
            />}
            label="Sign out"
            variant="outlined"
            color="info"
        /> :
        <Chip
            onClick={handleGoogleSignIn}
            avatar={<Avatar
                alt="Sign in with Google"
                src="google-logo.jpg"
            />}
            label="Sign in"
            color="info"
        />;

    return chip; 
};

export default Login;