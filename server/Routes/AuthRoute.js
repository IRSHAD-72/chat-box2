const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../Models/RegisterModel"); // Ensure this is the correct path
const router = express.Router();
const bcrypt = require("bcryptjs");

// Register Route
router.post("/register", async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
  
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      const newUser = new User({
        username,
        password: hashedPassword,  // Store the hashed password
      });
  
      await newUser.save();
      res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      console.error("Error during registration:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
// Login Route
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
  
    try {
      const user = await User.findOne({ username });
     // Log the user object to check if it's found
  
      if (!user) {
        return res.status(400).json({ message: "Invalid username or password" });
        log("User not found"); // Log if user is not found
      }
  
      const isMatch = await user.comparePassword(password);
      console.log(isMatch); // Log the result of password comparison
      
  
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid username or password" });
      }
  
      const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
  
      res.json({ message: "Login successful", token });
    } catch (err) {
      console.error("Error during login:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
module.exports = router;
