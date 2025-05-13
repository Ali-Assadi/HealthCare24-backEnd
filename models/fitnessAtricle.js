const mongoose = require("mongoose");

const fitnessArticleSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ["strength", "cardio"],
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

module.exports = mongoose.model("FitnessArticle", fitnessArticleSchema);
