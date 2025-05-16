import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [identifier, setIdentifier]= useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();
  
    const loginData = { identifier, password };
  
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", loginData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      console.log("Login successful", response.data);
  
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("username", identifier);
        navigate("/chat");
      } else {
        alert("Login failed: Token not received");
      }
    } catch (error) {
      console.error("Login failed:", error);  // Log the entire error
      alert("Login failed: " + (error.response ? error.response.data.message : error.message));
    }
  };
  
  return (
    <div className="container mt-5">
      <h3>Login</h3>

      {error && <div className="alert alert-danger">{error}</div>}

      <input
        className="form-control mb-2"
        placeholder="Username or email"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
      />
      <input
        className="form-control mb-2"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="btn btn-primary" onClick={handleLogin}>
        Login
      </button>

      <p className="mt-3">
        Don't have an account? <a href="/register">Register</a>
      </p>
    </div>
  );
};

export default Login;
