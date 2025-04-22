import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // Added confirmPassword state
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [email, setEmail] = useState('');


  const handleRegister = async (e) => {
    e.preventDefault();

    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const userData = { username,email, password }; // Include avatar in user data

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      const result = await response.json();
      console.log(result); // Log the response from the server

      // Redirect to login page after successful registration
      navigate("/login", { state: { email } }); // Pass email to the verify page

    } catch (err) {
      console.error("Error:", err);
      setError("Registration failed: " + err.message);
    }
  };

  return (
    <div className="container mt-5">
      <h3>Register</h3>
      <input
        className="form-control mb-2"
        placeholder="Choose a Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
       <input
        type="email"
        className="form-control mb-2"
        placeholder="Email"
        value={email}

        onChange={(e) => setEmail (e.target.value)} // Use confirmPassword state
      />
      <input
        type="password"
        className="form-control mb-2"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="password"
        className="form-control mb-2"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)} // Use confirmPassword state
      />
      {/* <input
        className="form-control mb-2"
        placeholder="Avatar URL (optional)"
        value={avatar}
        onChange={(e) => setAvatar(e.target.value)}
      /> */}
      <button className="btn btn-success" onClick={handleRegister}>
        Register
      </button>
      {error && <p className="text-danger mt-3">{error}</p>}
      <p className="mt-3">
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
};

export default Register;
