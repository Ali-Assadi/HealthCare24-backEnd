const express = require("express");
const router = express.Router();
const HealthArticle = require("../models/healthArticle");

// GET articles by category
router.get("/:category", async (req, res) => {
  try {
    const category = req.params.category;
    const articles = await HealthArticle.find({ category });
    res.json(articles);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
