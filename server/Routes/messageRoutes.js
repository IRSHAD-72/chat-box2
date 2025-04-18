const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const {
  getMessages,
  createMessage,
} = require("../Controllers/MessageController.js");

router.get("/", getMessages);
router.post("/", createMessage);
// routes/messageRoutes.js
// adjust path if needed

router.delete("/api/messages/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid message ID" });
  }

  try {
    const deleted = await Message.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Broadcast delete event
    io.emit("messageDeleted", id);

    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
module.exports = router;
