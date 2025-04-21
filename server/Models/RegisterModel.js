const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);  // Compare plain text password with hashed password
};

const User = mongoose.model("User", userSchema);
module.exports = User;
