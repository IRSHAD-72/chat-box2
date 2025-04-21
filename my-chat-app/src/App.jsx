import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ChatBox from "./ChatBox";
import Login from "./login";
import Register from "./Register";

const App = () => {
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("chatUser");
    setUsername(storedUser);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={username ? "/chat" : "/login"} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={username ? <ChatBox /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
