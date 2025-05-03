const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ✅ Sign Up Route
router.post("/signup", async (req, res) => {
  const { email, password, age, height, weight, details } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Here is where you insert the extended data
    const newUser = new User({
      email,
      password: hashedPassword,
      age,
      height,
      weight,
      details,
    });

    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to register user" });
  }
});

module.exports = router;
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
      });
    }

    // ✅ Normal successful login
    res.status(200).json({
      message: "Logged in successfully",
      mustUpdate: false,
      isAdmin : user.isAdmin || false,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user details
router.get("/user/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

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
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Forgot Password - Send Temp Password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: "User not found" });

  // Generate random temporary password
  const tempPassword = crypto.randomBytes(4).toString("hex");
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  // Update user with temp password and flag
  user.password = hashedPassword;
  user.mustUpdatePassword = true;
  await user.save();

  // Send email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "konanai0699@gmail.com",
      pass: "frfb zgwg gjua tcjc",
    },
  });

  const mailOptions = {
    from: "konanai0699@gmail.com",
    to: email,
    subject: "Password Reset",
    html: `
        <div style="font-family: 'Arial', sans-serif; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p>Your temporary password is:</p>
          <p style="font-size: 18px; font-weight: bold;">${tempPassword}</p>
          <p>Please use this password to log in, then update your password immediately.</p>
          <p>
            <a href="http://localhost:4200/update-password?email=${encodeURIComponent(
              email
            )}" style="
              display: inline-block;
              margin-top: 10px;
              padding: 10px 20px;
              background-color: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
            ">
              Click here to update your password
            </a>
          </p>
          <p style="margin-top: 20px; font-size: 13px; color: #777;">
            If you didn’t request a password reset, you can ignore this email.
          </p>
        </div>
      `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: "Temporary password and link sent!" });
  } catch (err) {
    res.status(500).json({ message: "Email failed", error: err });
  }
});

//Update Password
router.put("/update-password", async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await User.findOneAndUpdate(
      { email },
      {
        password: hashedPassword,
        mustUpdatePassword: false, // ✅ disable the temp login flag
      }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update password" });
  }
});
// Delete user account
router.delete('/user/:email', async (req, res) => {
    try {
      const result = await User.deleteOne({ email: req.params.email });
  
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });
  // Save or update user diet plan
router.put('/user/:email/diet', async (req, res) => {
  const { goal, plan } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { email: req.params.email },
      { goal: goal, dietPlan: plan },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Diet plan saved', user });
  } catch (err) {
    res.status(500).json({ message: 'Error saving diet plan', error: err });
  }
});
