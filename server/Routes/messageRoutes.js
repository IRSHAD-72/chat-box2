const express = require("express");
const router = express.Router();
const {
  getMessages,
  createMessage,
} = require("../Controllers/MessageController.js");

router.get("/", getMessages);
router.post("/", createMessage);

module.exports = router;
