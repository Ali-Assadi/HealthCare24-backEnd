const mongoose = require("mongoose");

const nutritionArticleSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ["meals", "diets", "recipes"],
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      required: true,
    },
    route: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("NutritionArticle", nutritionArticleSchema);
