const express = require("express");
const router = express.Router();
const UserViews = require("../models/UserViews");

// POST /api/log-view
router.post("/log-view", async (req, res) => {
  const { email, topic, section } = req.body;

  if (!email || !topic || !section) {
    return res.status(400).json({ message: "Missing data" });
  }

  try {
    let user = await UserViews.findOne({ email });

    if (!user) {
      user = new UserViews({ email, views: [] });
    }

    user.views.push({ topic, section });
    await user.save();

    res.status(200).json({ message: "View logged successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error logging view", error: err });
  }
});

// GET /api/user-views/:email
router.get("/user-views/:email", async (req, res) => {
  try {
    const user = await UserViews.findOne({ email: req.params.email });

    if (!user) {
      return res.status(200).json([]);
    }

    res.json(user.views);
  } catch (err) {
    res.status(500).json({ message: "Error fetching views", error: err });
  }
});

module.exports = router;
