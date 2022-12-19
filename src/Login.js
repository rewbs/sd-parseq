import React from "react";
import { useNavigate } from "react-router-dom";
import { Tooltip, Avatar, Chip } from '@mui/material';
import { useUserAuth } from "./UserAuthContext";

const Login = () => {
    const { googleSignIn, logOut, user } = useUserAuth();
    const navigate = useNavigate();
    const handleLogout = async () => {
        try {
            await logOut();
            navigate(window.location);
        } catch (error) {
            console.log(error.message);
        }
    };

    const handleGoogleSignIn = async (e) => {
        e.preventDefault();
        try {
            await googleSignIn();
            navigate(window.location);
        } catch (error) {
            console.log(error.message);
        }
    };

    const chip = user ?    
        <Chip
            onClick={handleLogout}
            avatar={<Avatar
                alt="Log out"
                src={user?.photoURL} 
            />}
            label="Log out"
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