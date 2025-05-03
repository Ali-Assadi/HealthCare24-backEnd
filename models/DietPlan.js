const mongoose = require('mongoose');

const daySchema = new mongoose.Schema({
  breakfast: String,
  lunch: String,
  dinner: String,
  snack: String
});

const weekSchema = new mongoose.Schema({
  days: [daySchema]
});

const dietPlanSchema = new mongoose.Schema({
  goal: { type: String, required: true },
  weeks: [weekSchema]
});

module.exports = mongoose.model('DietPlan', dietPlanSchema);
