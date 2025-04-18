const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Message = require("../Models/MessageModel.js"); // ✅ Add this
const { getMessages, createMessage } = require("../Controllers/MessageController.js");

router.get("/", getMessages);
router.post("/", createMessage);

router.delete("/:id", async (req, res) => { // ✅ Fix path here
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid message ID" });
  }

  try {
    const deleted = await Message.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json({ success: true }); // No need to broadcast here
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
