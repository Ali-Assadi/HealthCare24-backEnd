const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const Notification = require("../models/Notifications");

// GET all chat messages for a user
router.get("/:email", async (req, res) => {
  const email = req.params.email;

  try {
    const messages = await Chat.find({
      $or: [{ from: email }, { to: email }],
    }).sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: "Error fetching messages", error: err });
  }
});

// POST a message (admin or user)
router.post("/send", async (req, res) => {
  const { from, to, content } = req.body;
  if (!from || !to || !content) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const message = await Chat.create({ from, to, content });

    // ✅ Only create notification if admin sent the message
    if (from === "admin") {
      await Notification.create({
        email: to,
        title: "New Message from Admin",
        message: content,
        read: false,
      });
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: "Error sending message", error: err });
  }
});

module.exports = router;
