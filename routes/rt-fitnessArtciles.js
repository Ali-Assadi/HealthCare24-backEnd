const express = require("express");
const router = express.Router();
const FitnessArticle = require("../models/fitnessAtricle");

// GET /api/fitnessArticles/:category
router.get("/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const articles = await FitnessArticle.find({ category });
    res.json(articles);
  } catch (err) {
    console.error("Failed to fetch fitness articles", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
