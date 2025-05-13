// healthArticle.model.js
const mongoose = require("mongoose");

const healthArticleSchema = new mongoose.Schema({
  category: String, // 'brain', 'heart', 'sleep'
  title: String,
  description: String,
  image: String, // path to image, e.g., 'assets/health/BRAIN-HEALTH/filename.jpg'
  route: String, // e.g., '/brain-health-1'
});

module.exports = mongoose.model("HealthArticle", healthArticleSchema);
