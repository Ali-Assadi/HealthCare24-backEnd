const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const User = require("../models/User");

router.post("/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { isSubscribed: true },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "appservicehealthcare24@gmail.com",
        pass: "otqs fvii gfhu iaaa",
      },
    });

    const mailOptions = {
      from: "appservicehealthcare24@gmail.com",
      to: email,
      subject: "Welcome to VIP Membership!",
      text: `🎉 Thank you for joining our VIP program! We're excited to have you on board.`,
    };

    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ message: "Email sent and subscription updated!", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to subscribe", error: err });
  }
});

module.exports = router;
