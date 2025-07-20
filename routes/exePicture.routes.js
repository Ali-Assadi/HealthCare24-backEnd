const express = require('express');
const router = express.Router();
const ExePicture = require('../models/exePicture.model');

// ➕ Add picture
router.post('/add', async (req, res) => {
  const { name, path } = req.body;

  try {
    const newPic = new ExePicture({ name, path });
    await newPic.save();
    res.status(201).json({ message: '✅ Picture added', data: newPic });
  } catch (error) {
    res.status(500).json({ error: '❌ Failed to add', details: error.message });
  }
});

// 🔍 Get all pictures
router.get('/all', async (req, res) => {
  try {
    const pictures = await ExePicture.find();
    res.json({ exePictures: pictures }); // ✅ هنا رجعناها كأوبجكت
  } catch (error) {
    res.status(500).json({ error: '❌ Error fetching data' });
  }
});

// 🔍 Get picture by name
router.get('/:name', async (req, res) => {
  try {
    const pic = await ExePicture.findOne({ name: req.params.name });
    if (!pic) return res.status(404).json({ error: 'Not found' });
    res.json(pic);
  } catch (error) {
    res.status(500).json({ error: '❌ Server error' });
  }
});

module.exports = router;
