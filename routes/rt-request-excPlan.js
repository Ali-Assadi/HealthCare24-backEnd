const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

router.post('/request-new-plan', async (req, res) => {
  const { email, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'konanai0699@gmail.com',
      pass: 'frfb zgwg gjua tcjc'
    }
  });

  const mailOptions = {
    from: 'konanai0699@gmail.com',
    to: 'konanai0699@gmail.com',
    subject: 'New Exercise Plan Request from User',
    text: `From: ${email}\n\n${message}`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Request sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send email', error: err });
  }
});

module.exports = router;
