const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../Models/RegisterModel");
const router = express.Router();
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");




// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});





// ✅ Register Route
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.username === username
            ? "Username is already taken"
            : "Email is already registered",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      isVerified: false, // 👈 default is unverified
    });

    const savedUser = await newUser.save();




    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: savedUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const verificationLink = `http://localhost:5000/api/auth/verify/${verificationToken}`;
    console.log("Verification link:", verificationLink);

    await transporter.sendMail({
      from: `"Chat App" <${process.env.EMAIL_USER}>`,
      to: savedUser.email,
      subject: "Verify your Chat App account",
      html: `
        <h3>Hi ${savedUser.username},</h3>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p>This link expires in 24 hours.</p>
      `,
    });

    res.status(201).json({ message: "User registered. Check email to verify." });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});



// ✅ Email Verification Route
router.get("/verify/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(400).send(`
        <h2>Invalid token or user not found</h2>
        <p>Please check the verification link or try registering again.</p>
        <a href="http://localhost:3000/login">
          <button style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Go to Login
          </button>
        </a>
      `);
    }

    if (user.isVerified) {
      return res.send(`
        <h2>Email Already Verified</h2>
        <p>You can now login to your account.</p>
        <a href="http://localhost:3000/login">
          <button style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Go to Login
          </button>
        </a>
      `);
    }

    user.isVerified = true;
    await user.save();

    res.send(`
      <h2>Email Verified Successfully ✅</h2>
      <p>You can now login to your account.</p>
      <a href="http://localhost:5173/login">
        <button style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Go to Login
        </button>
      </a>
    `);
  } catch (err) {
    console.error("Verification error:", err.message);
    res.status(400).send(`
      <h2>Verification Failed ❌</h2>
      <p>Your verification link may have expired or is invalid.</p>
      <a href="http://localhost:5173/login">
        <button style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Go to Login
        </button>
      </a>
    `);
  }
});

// ✅ Login Route
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password)
    return res.status(400).json({ message: "Username/email and password are required" });

  try {
    const user = await User.findOne({ $or:[
      {username:identifier},
      {email:identifier}
    ] });

    if (!user) {
      return res.status(400).json({ message: "Invalid username/email or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username/email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        avatar: user.avatar || "",
      },
    });
    
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


const authenticateToken = require("../Middelware/authMiddelware");

router.post("/updateProfile", authenticateToken, async (req, res) => {
  const { username, avatar, oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Username update with uniqueness check
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      user.username = username;
    }

    // ✅ Avatar update
    if (avatar) {
      user.avatar = avatar;
    }

    // ✅ Password update
    if (oldPassword && newPassword) {
      const isMatch = await user.comparePassword(oldPassword);
      if (!isMatch) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    // ❌ Email should not be updated, so we leave it as is

    await user.save();

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});



const Message = require("../Models/MessageModel"); // make sure this is imported

router.delete("/deleteAccount", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Delete the user
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete all messages by the user
    await Message.deleteMany({ user: user.username });

    res.json({ message: "Account and all messages deleted successfully" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
