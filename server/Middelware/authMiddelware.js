// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.query.token;

  if (!token) {
    return next(new Error("Authentication error"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    return next(new Error("Authentication error"));
  }
};

module.exports = authenticateSocket;
