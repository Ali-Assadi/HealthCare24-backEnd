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
    <div style="
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f0f4f8;
      border: 2px solid #a29bfe;
      padding: 25px;
      border-radius: 12px;
      max-width: 600px;
      margin: auto;
    ">
      <h2 style="color: #6c5ce7; font-size: 24px; margin-bottom: 15px;">
        ✅ We've received your fitness plan request!
      </h2>
      <p style="font-size: 16px; color: #2e2e2e;">
        Thank you, <strong>${email}</strong>, for submitting your request.
      </p>
      <p style="font-size: 15px; margin-top: 15px; color: #2e2e2e;">
        Our team will review your request and send you a personalized plan soon.
      </p>
      <hr style="margin: 20px 0; border-color: #dcdcdc;" />
      <p style="font-size: 14px; color: #555;">
        💪 Stay strong and healthy,<br><strong>HealthCare24 Team</strong>
      </p>
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
