const Message = require("../Models/MessageModel.js");

exports.getMessages = async (req, res) => {
  const limit = parseInt(req.query.limit) || 30;
  const skip = parseInt(req.query.skip) || 0;

  try {
    const messages = await Message.find()
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createMessage = async (req, res) => {
  const { user, text, time, avatar } = req.body;

  try {
    const message = new Message({ user, text, time, avatar });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
