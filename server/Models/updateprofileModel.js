const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  username: { type: String, required: true },
  avatar: { type: String, required: true },
});

const User = mongoose.model("profile", profileSchema);

module.exports = profileSchema;
