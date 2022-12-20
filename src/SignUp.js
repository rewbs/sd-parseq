import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, TextField } from '@mui/material';
import { useUserAuth } from "./UserAuthContext";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const { signUp } = useUserAuth();
  let navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signUp(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="p-4 box">
        <h2 className="mb-3">Firebase Auth Signup</h2>
        {error && <Alert variant="danger">{error}</Alert>}
            <TextField
              type="email"
              placeholder="Email address"
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />

          <div className="d-grid gap-2">
            <Button variant="primary" type="Submit" onClick={handleSubmit}>
              Sign up
            </Button>
          </div>
      </div>
      <div className="p-4 box mt-3 text-center">
        Already have an account? <Link to="/">Log In</Link>
      </div>
    </>
  );
};

export default Signup;