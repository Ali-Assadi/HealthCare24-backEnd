const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const User = require("../models/User");
const Chat = require("../models/Chat");

router.post("/request-new-plan", async (req, res) => {
  const { email, message } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isSubscribed) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "appservicehealthcare24@gmail.com",
          pass: "otqs fvii gfhu iaaa",
        },
      });

      const adminMail = {
        from: "appservicehealthcare24@gmail.com",
        to: "appservicehealthcare24@gmail.com",
        subject: "📩 New Diet Plan Request from Subscribed User",
        text: `From: ${email}\n\n${message}`,
      };

      const userMail = {
        from: "appservicehealthcare24@gmail.com",
        to: email,
        subject: "✅ Diet Plan Request Received",
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h3 style="color: #4CAF50;">Thank you for your request!</h3>
            <p>We received your request for a new diet plan. Our team will review and respond shortly.</p>
            <p>💚 Stay healthy,<br/>HealthCare24 Team</p>
          </div>
        `,
      };

      await transporter.sendMail(adminMail);
      await transporter.sendMail(userMail);

      return res.status(200).json({ message: "Request sent via email" });
    } else {
      const chatMessage = await Chat.create({
        from: email,
        to: "admin",
        content: `📥 Request for new diet plan: ${message}`,
      });

      return res.status(200).json({
        message: "Message sent to admin via chat",
        chatMessage,
      });
    }
  } catch (err) {
    console.error("❌ Error processing request:", err);
    res.status(500).json({ message: "Failed to handle request", error: err });
  }
});

module.exports = router;
