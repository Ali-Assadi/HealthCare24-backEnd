const express = require("express");
const router = express.Router();
const NutritionArticle = require("../models/nutritionArticle");

// GET /api/nutritionArticles/:category
router.get("/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const articles = await NutritionArticle.find({ category });
    res.json(articles);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
