import React, { useState } from "react";
import "./Login.css";
import Footer from "../../components/footer/Footer";
import { NavLink, useNavigate } from "react-router-dom";
import { useLoginUserMutation } from "../../services/userAuthApi";
import { storeToken } from "../../services/LocalStorageService";
import { decodeToken } from "../../services/tokenService";

const Login = () => {
  const [alert, setAlert] = useState({ show: false, msg: "", type: "" }); // type: "error" | "success"
  const navigate = useNavigate();
  const [loginUser, { isLoading }] = useLoginUserMutation();

  const dismissAlert = () => setAlert({ show: false, msg: "", type: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    dismissAlert();

    const data = new FormData(e.currentTarget);
    const actualData = {
      email: data.get("email"),
      password: data.get("password"),
    };

    if (!actualData.email || !actualData.password) {
      return setAlert({ show: true, msg: "Please enter both email and password.", type: "error" });
    }

    try {
      const res = await loginUser(actualData).unwrap();

      if (res.status === "success") {
        storeToken(res.token);
        setAlert({ show: true, msg: "Login successful! Redirecting…", type: "success" });
        document.getElementById("login-form").reset();
        const decoded = decodeToken(res.token);
        setTimeout(() => {
          const role = decoded?.role?.toLowerCase();
          if (role === "admin" || role === "superadmin") {
            navigate("/studentoverview/admin-dashboard");
          } else {
            // "Homepage" refers to the Home (Profile) page in the sidemenu
            navigate("/studentoverview/profile");
          }
        }, 900);
      } else {
        setAlert({ show: true, msg: res.message || "Incorrect email or password.", type: "error" });
      }
    } catch (err) {
      setAlert({
        show: true,
        msg: err?.data?.message || "Login failed. Please check your credentials and try again.",
        type: "error",
      });
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" role="main" aria-labelledby="login-heading">

        {/* Brand Badge */}
        <div className="login-brand">
          <div className="login-brand-badge">
            <span className="login-brand-dot"></span>
            Spectalyzer Platform
          </div>
        </div>

        <div className="login-card__header">
          <h1 id="login-heading" className="login-card__title">Welcome Back</h1>
          <p className="login-card__subtitle">Sign in to continue your learning journey</p>
        </div>

        {/* ── Inline alert banner — single, clean, dismissible ── */}
        {alert.show && (
          <div className={`login-alert login-alert--${alert.type}`} role="alert">
            <span className="login-alert__icon">
              {alert.type === "error" ? "⚠" : "✓"}
            </span>
            <span className="login-alert__msg">{alert.msg}</span>
            <button className="login-alert__close" onClick={dismissAlert} aria-label="Dismiss">×</button>
          </div>
        )}

        <form onSubmit={handleSubmit} id="login-form" className="login-form" noValidate>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email" name="email" type="email" required
              className="form-input" placeholder="you@school.edu"
              onChange={() => alert.show && dismissAlert()}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password" name="password" type="password" required
              className="form-input" placeholder="Enter your password"
              onChange={() => alert.show && dismissAlert()}
            />
          </div>

          <div className="meta">
            <NavLink to="/sendpasswordresetemail" className="forgot-link">
              Forgot password?
            </NavLink>
          </div>

          <div className="actions">
            <input
              type="submit"
              value={isLoading ? "Signing in…" : "Sign In →"}
              className="btn btn-primary"
              disabled={isLoading}
            />
          </div>

          <div className="login-divider"><span>New to Spectalyzer?</span></div>

          <NavLink to="/student" className="btn btn-secondary">
            Create an Account
          </NavLink>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
