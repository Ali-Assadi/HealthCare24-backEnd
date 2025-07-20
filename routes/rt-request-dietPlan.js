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
    <div style="background-color: #f0f4f8; padding: 40px 0;">
      <div style="
        font-family: 'Segoe UI', sans-serif;
        background-color: #fffaf4;
        padding: 25px;
        border-radius: 10px;
        border: 1px solid #ffe0b2;
        max-width: 600px;
        margin: 0 auto;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      ">
        <h2 style="color: #ff7043;">🥗 Diet Plan Request Received!</h2>
        <p style="font-size: 16px;">Thank you, <strong>${email}</strong>, for submitting your request.</p>
        <p style="margin-top: 15px;">Our nutrition team is preparing your customized plan. You’ll hear back from us shortly.</p>
        <hr style="margin: 20px 0;" />
        <p style="font-size: 14px; color: #555;">💚 Stay healthy and nourished,<br>HealthCare24 Team</p>
      </div>
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
