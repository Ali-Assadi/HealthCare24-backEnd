const mongoose = require("mongoose");
const ExerciseWeekSchema = require("./exercisePlan");

// 🟢 Define DietPlan sub-schema
const DaySchema = new mongoose.Schema(
  {
    breakfast: { type: String },
    lunch: { type: String },
    dinner: { type: String },
    snack: { type: String },
    finished: { type: Boolean, default: false },
  },
  { _id: false }
);

const WeekSchema = new mongoose.Schema(
  {
    days: [DaySchema],
  },
  { _id: false }
);

// 💳 Visa card sub-schema
const VisaCardSchema = new mongoose.Schema(
  {
    cardHolderName: { type: String, required: true },
    last4Digits: { type: String, required: true },
    expiryMonth: { type: Number, required: true },
    expiryYear: { type: Number, required: true },
    brand: { type: String, default: "Visa" },
  },
  { _id: false }
);

// 👤 Main User schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: Number,
  height: Number,
  weight: Number,
  details: { type: String, default: "" },

  // 🍽️ Structured diet plan
  dietPlan: {
    type: [WeekSchema],
    default: [],
  },

  goal: { type: String, default: "" },
  mustUpdatePassword: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },

  // 🏋️‍♂️ Exercise plan (already typed)
  exercisePlan: [ExerciseWeekSchema],

  isSubscribed: { type: Boolean, default: false },
  visaCard: VisaCardSchema,

  hasReviewedDiet: { type: Boolean, default: false },
  reviews: [
    {
      date: { type: Date, default: Date.now },
      text: { type: String },
    },
  ],
});

module.exports = mongoose.model("User", UserSchema);
