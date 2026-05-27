import React, { useState } from "react";
import { Box, TextField, Button, Alert, CircularProgress } from "@mui/material";
import { useLoginUserMutation } from "../../services/userAuthApi";
import { storeToken } from "../../services/LocalStorageService";
import { decodeToken } from "../../services/tokenService";
import { useNavigate } from "react-router-dom";

const UserLogin = () => {
  const [error, setError] = useState({ status: false, msg: "", type: "error" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [loginUser] = useLoginUserMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData(e.currentTarget);
    const actualData = {
      email: data.get("email"),
      password: data.get("password"),
    };

    if (!actualData.email || !actualData.password) {
      setError({ status: true, msg: "Email & Password are required", type: "error" });
      setLoading(false);
      return;
    }

    try {
      const res = await loginUser(actualData).unwrap();
      
      if (res.status === "success") {
        document.getElementById("login-form-auth")?.reset();
        setError({ status: true, msg: "Login Success", type: "success" });
        storeToken(res.token);
        
        const decoded = decodeToken(res.token);
        
        // Role-based navigation
        setTimeout(() => {
          if (decoded?.role === "superadmin") {
            navigate("/studentoverview/dashboard");
          } else if (decoded?.role === "admin") {
            navigate("/studentoverview/dashboard");
          } else if (decoded?.role === "doctor") {
            navigate("/studentoverview/doctor-dashboard");
          } else {
            navigate("/studentoverview/profile");
          }
        }, 1000);
      } else {
        setError({ status: true, msg: res.message || "Login Failed", type: "error" });
      }
    } catch (err) {
      console.error("Login Error:", err);
      const errorMsg = err?.data?.message || err?.message || "Login Failed. Please try again.";
      setError({ status: true, msg: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }} id="login-form-auth">
      {error.status && (
        <Alert severity={error.type} sx={{ mb: 2 }}>
          {error.msg}
        </Alert>
      )}
      
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        name="email"
        type="email"
        autoComplete="email"
        autoFocus
      />
      
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type="password"
        id="password"
        autoComplete="current-password"
      />
      
      <Button
        type="submit"
        fullWidth
        variant="contained"
        color="secondary"
        sx={{ mt: 3, mb: 2 }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : "Login"}
      </Button>
    </Box>
  );
};

export default UserLogin;
