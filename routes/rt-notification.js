const express = require("express");
const router = express.Router();
const Notification = require("../models/Notifications");

// GET all notifications for a user
router.get("/notifications/:email", async (req, res) => {
  try {
    const notifications = await Notification.find({
      email: req.params.email,
    }).sort({ date: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// GET count of unread notifications
router.get("/notifications/unread/:email", async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      email: req.params.email,
      read: false,
    });
    res.json({ unreadCount: count });
  } catch (err) {
    res.status(500).json({ error: "Failed to count unread notifications" });
  }
});

// POST mark all notifications as read
router.post("/notifications/mark-read", async (req, res) => {
  const { email } = req.body;
  try {
    await Notification.updateMany(
      { email, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

// POST create a notification (useful for testing)
router.post("/notifications/create", async (req, res) => {
  const { email, title, message } = req.body;
  try {
    const newNote = new Notification({ email, title, message });
    await newNote.save();
    res.status(201).json({ message: "Notification created" });
  } catch (err) {
    res.status(500).json({ error: "Failed to create notification" });
  }
});

module.exports = router;
