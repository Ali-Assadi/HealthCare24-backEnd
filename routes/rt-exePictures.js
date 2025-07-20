const express = require("express");
const router = express.Router();
const ExePictures = require("../models/ExePictures");

router.get("/", async (req, res) => {
  try {
    const pictures = await ExePictures.find();
    res.status(200).json(pictures);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve exercise pictures", error });
  }
});

module.exports = router;
