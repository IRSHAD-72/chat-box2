const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const messageRoutes = require("./Routes/messageRoutes.js");
const Message = require("./Models/Message.js"); 

const app = express(); 
const server = http.createServer(app); 
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
  },
}); // ✅ Use the correct origin for your frontend app

app.use(cors());
app.use(express.json());
app.use("/api/messages", messageRoutes); // ✅ Correct usage

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const users = {};
const rooms = {};

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    users[socket.id] = { username, room };
    socket.join(room);

    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(socket.id);

    socket.to(room).emit("userJoined", {
      username,
      message: `${username} has joined.`,
    }); // ✅ Emit to room

    const roomUsers = rooms[room].map((id) => users[id]?.username);
    io.to(room).emit("roomUsers", roomUsers);

    socket.room = room; // ✅ Track room on socket object
  });   // ✅ Store room in socket object

  socket.on("sendMessage", async (msg) => {
    try {
      const saved = await new Message(msg).save();
      io.to(socket.room).emit("receiveMessage", saved); // ✅ Emit after saving
    } catch (err) {
      console.error("Message save error:", err);
    }
  }); // ✅ Save message to database

  socket.on("typing", () => {
    const user = users[socket.id];
    if (user?.room) {
      socket.to(user.room).emit("userTyping", user.username); // ✅ Emit typing event to room
    }
  }); // ✅ Emit typing event to room


  socket.on("stopTyping", () => {
    const user = users[socket.id];
    if (user?.room) {
      socket.to(user.room).emit("userStoppedTyping", user.username);
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
