const mongoose = require("mongoose");

// Used for storing meal pools (gain/loss/balance)
const mealGroupSchema = new mongoose.Schema(
  {
    default: [String],
    noEgg: [String],
    noMilk: [String],
    noMeat: [String],
    vegetarian: [String],
    glutenFree: [String],
  },
  { _id: false }
);

const mealsSchema = new mongoose.Schema(
  {
    breakfast: mealGroupSchema,
    lunch: mealGroupSchema,
    dinner: mealGroupSchema,
    snack: mealGroupSchema,
  },
  { _id: false }
);

const dietPlanSchema = new mongoose.Schema({
  goal: { type: String, required: true }, // gain / loss / balance
  meals: mealsSchema,
});

module.exports = mongoose.model("DietPlan", dietPlanSchema);
