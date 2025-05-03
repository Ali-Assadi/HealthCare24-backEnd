const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

router.post('/subscribe', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    // Create transporter (use your real email service here)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'konanai0699@gmail.com',     // Replace with your email
        pass: 'frfb zgwg gjua tcjc'         // Use App Password (not normal password)
      }
    });

    // Email options
    const mailOptions = {
      from: 'konanai0699@gmail.com',
      to: email,
      subject: 'Welcome to VIP Membership!',
      text: `🎉 Thank you for joining our VIP program! We're excited to have you on board.`
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send email', error: err });
  }
});

module.exports = router;
