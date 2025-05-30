const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
// ✅ Sign Up Route with Email Sending
router.post("/signup", async (req, res) => {
  const { email, password, age, height, weight, details } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      age,
      height,
      weight,
      details,
    });

    await newUser.save();

    // ✅ Send Welcome Email
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
      subject: "🎉 Welcome to HealthCare24!",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
          <h2 style="color: #2c3e50;">Welcome to <span style="color: #4CAF50;">HealthCare24</span>!</h2>
          <p>Hi there 👋,</p>
          <p>Thank you for registering with us. Your health and fitness goals are now one step closer! 🏃‍♀️💪</p>
          <p>If you ever need help, feel free to reach out. We're excited to support you!</p>
          <hr style="margin: 20px 0;">
          <p style="font-size: 13px; color: #888;">This email was sent automatically. Please do not reply.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: "User created successfully",
      _id: newUser._id,
      email: newUser.email,
      isAdmin: newUser.isAdmin || false,
      mustUpdate: newUser.mustUpdatePassword || false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Sign In Route
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // ✅ Check if it's a temporary password login
    if (user.mustUpdatePassword) {
      return res.status(200).json({
        message: "Temporary login",
        mustUpdate: true,
        isAdmin: user.isAdmin || false,
        email: user.email,
        _id: user._id,
      });
    }

    // ✅ Normal successful login
    res.status(200).json({
      message: "Logged in successfully",
      mustUpdate: false,
      isAdmin: user.isAdmin || false,
      email: user.email,
      _id: user._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user details
router.get("/user/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user); // send full user info (no field selection)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Update user details
router.put("/user/:email", async (req, res) => {
  try {
    const { age, height, weight, details } = req.body;
    const updatedUser = await User.findOneAndUpdate(
      { email: req.params.email },
      { age, height, weight, details },
      { new: true }
    );

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update user" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: "User not found" });

  const tempPassword = crypto.randomBytes(4).toString("hex");
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  user.password = hashedPassword;
  user.mustUpdatePassword = true;
  await user.save();

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
    subject: "🔑 Reset Your Password - HealthCare24",
    html: `
      <div style="font-family: 'Arial', sans-serif; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
        <h2 style="color: #333;">Temporary Password Issued</h2>
        <p>Hi,</p>
        <p>You’ve requested to reset your password. Use the temporary password below to log in:</p>
        <p style="font-size: 18px; font-weight: bold;">${tempPassword}</p>
        <p>Then, click the link below to update your password:</p>
        <p>
          <a href="http://localhost:4200/update-password?email=${encodeURIComponent(
            email
          )}"
            style="
              display: inline-block;
              margin-top: 10px;
              padding: 10px 20px;
              background-color: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
            ">
            🔒 Update Password Now
          </a>
        </p>
        <p style="margin-top: 20px; font-size: 13px; color: #777;">
          If you didn’t request this reset, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: "✅ Temporary password and link sent!" });
  } catch (err) {
    console.error("❌ Email sending failed:", err);
    res.status(500).json({ message: "Email failed", error: err });
  }
});

// Update Password with confirmation email
router.put("/update-password", async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await User.findOneAndUpdate(
      { email },
      {
        password: hashedPassword,
        mustUpdatePassword: false,
      }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Send confirmation email
    const nodemailer = require("nodemailer");
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
      subject: "🔐 Your Password Was Updated",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f0f4f8; padding: 20px; border-radius: 10px;">
          <h2 style="color: #333;">Password Updated Successfully</h2>
          <p>Hi,</p>
          <p>This is a confirmation that your password has been updated for your HealthCare24 account.</p>
          <p>If you did not perform this action, please contact support immediately.</p>
          <hr style="margin: 20px 0;">
          <p style="font-size: 13px; color: #888;">This is an automated message. Please do not reply.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password updated and email sent." });
  } catch (err) {
    console.error("❌ Failed to update password or send email", err);
    res.status(500).json({ error: "Failed to update password" });
  }
});

// Delete user account
router.delete("/user/:email", async (req, res) => {
  try {
    const result = await User.deleteOne({ email: req.params.email });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete user" });
  }
});
// Save or update user diet plan
router.put("/user/:email/diet", async (req, res) => {
  const { goal, plan } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { email: req.params.email },
      { goal: goal, dietPlan: plan },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Diet plan saved", user });
  } catch (err) {
    res.status(500).json({ message: "Error saving diet plan", error: err });
  }
});

module.exports = router;
