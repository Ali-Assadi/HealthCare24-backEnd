const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const User = require("../models/User");
const Chat = require("../models/Chat");

router.post("/request-new-fitness-plan", async (req, res) => {
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
        subject: "📩 New Fitness Plan Request from Subscribed User",
        html: `
          <div style="font-family: 'Segoe UI', sans-serif; background: #f9f9f9; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2c3e50;">🏋️ New Fitness Plan Request</h2>
            <p><strong>User:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Message:</strong></p>
            <blockquote style="background: #fff; padding: 15px; border-left: 4px solid #4CAF50; font-style: italic;">
              ${message}
            </blockquote>
            <p style="color: #999; font-size: 12px;">HealthCare24 System</p>
          </div>
        `,
      };

      const userMail = {
        from: "appservicehealthcare24@gmail.com",
        to: email,
        subject: "✅ Fitness Plan Request Received",
        html: `
          <div style="font-family: 'Segoe UI', sans-serif; background-color: #f0fff4; padding: 25px; border-radius: 10px; border: 1px solid #d4edda;">
            <h2 style="color: #28a745;">✅ We've received your fitness plan request!</h2>
            <p style="font-size: 16px;">Thank you, <strong>${email}</strong>, for your request.</p>
            <p style="margin-top: 15px;">Our team will review your request and send you an updated plan soon.</p>
            <hr style="margin: 20px 0;" />
            <p style="font-size: 14px; color: #555;">💪 Stay healthy and strong,<br>HealthCare24 Team</p>
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
        content: `🏋️‍♂️ Request for new fitness plan: ${message}`,
      });

      return res.status(200).json({
        message: "Message sent to admin via chat",
        chatMessage,
      });
    }
  } catch (err) {
    console.error("❌ Error processing fitness request:", err);
    res.status(500).json({ message: "Failed to handle request", error: err });
  }
});

module.exports = router;
