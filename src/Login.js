import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from '@mui/material';
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import { useUserAuth } from "./UserAuthContext";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { logIn, googleSignIn } = useUserAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await logIn(email, password);
            navigate("/home");
        } catch (err) {
            setError(err.message);
        }
    };

    const handleGoogleSignIn = async (e) => {
        e.preventDefault();
        try {
            await googleSignIn();
            navigate("/");
        } catch (error) {
            console.log(error.message);
        }
    };

    return (
        
        <Button variant="contained" onClick={handleGoogleSignIn} startIcon={<faGoogle />} >
            Sign in
        </Button>

    );
};

export default Login;