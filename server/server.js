// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv").config({ path: "./config/.env" });

const path = require("path");
const cloudinary = require("./config/cloudinary.js");


const messageRoutes = require("./Routes/messageRoutes.js");
const authRoutes = require("./Routes/AuthRoute.js");  // Import auth routes
const Message = require("./Models/MessageModel.js");
const authenticateSocket = require("./Middelware/authMiddelware.js");  // Import middleware
const User = require("./Models/RegisterModel.js"); // Import User model
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"], // ✅ allow both
    methods: ["GET", "POST","dellete"],
    credentials: true,
  },
  treansport: ["websocket"],
});

const jwt = require("jsonwebtoken");

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    console.log(" No token provided");
    return next(new Error("No token"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // optionally store user data on socket
    next();
  } catch (err) {
    console.log(" Invalid token", err.message);
    next(new Error("Authentication failed"));
  }
});


app.use(cors());
app.use(express.json());
app.use("/api/messages", messageRoutes);// Use auth routes
app.use("/api/auth", authRoutes);


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const users = {};
const rooms = {};

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // store user info on socket
    next();
  } catch (err) {
    return next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    users[socket.id] = { username, room };
    socket.join(room);

    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(socket.id);

    socket.to(room).emit("userJoined", {
      username,
      message: `${username} has joined.`,
    });

    const roomUsers = rooms[room].map((id) => users[id]?.username);
    io.to(room).emit("roomUsers", roomUsers);

    socket.room = room;
  });

  // In your socket.io connection handler
socket.on("sendMessage", async (msg) => {
  try {
    const user = await User.findById(socket.user.userId); // Get full user

    const message = new Message({
      text: msg.text,
      time: msg.time,
      user: user.username,
      avatar: user.avatar, // ✅ store avatar
    });

    await message.save();

    const fullMessage = {
      _id: message._id,
      text: message.text,
      time: message.time,
      user: user.username,
      avatar: user.avatar,
    };

    io.to(socket.room).emit("receiveMessage", fullMessage);
  } catch (err) {
    console.error("Message save error:", err);
  }
});

  socket.on("typing", () => {
    const user = users[socket.id];
    if (user?.room) {
      socket.to(user.room).emit("userTyping", user.username);
    }
  });

  socket.on("stopTyping", () => {
    const user = users[socket.id];
    if (user?.room) {
      socket.to(user.room).emit("userStoppedTyping", user.username);
    }
  });
  socket.on('deleteMessage', async (messageId) => {
    try {
      const deleted = await Message.findByIdAndDelete(messageId);
      if (deleted) {
        io.emit('messageDeleted', messageId); // Notify all clients
      }
    } catch (err) {
      console.error('Failed to delete message:', err.message);
    }
  });
  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user?.room) {
      socket.to(user.room).emit("userLeft", {
        username: user.username,
        message: `${user.username} has left.`,
      });

      rooms[user.room] = rooms[user.room].filter((id) => id !== socket.id);
      if (rooms[user.room].length === 0) delete rooms[user.room];
    }

    delete users[socket.id];
    console.log("Client disconnected:", socket.id);
  });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
