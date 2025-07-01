const mongoose = require("mongoose");

// 🏋️ Exercise embedded schema
const ExerciseDaySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  type: { type: String, required: true },
  workout: { type: String, required: true },
  restriction: { type: String, default: "default" },
  finished: { type: Boolean, default: false },
});

const ExerciseWeekSchema = new mongoose.Schema({
  week: { type: Number, required: true },
  days: [ExerciseDaySchema],
});

// 🟢 DietPlan sub-schema
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

  dietPlan: {
    type: [WeekSchema],
    default: [],
  },

  goal: { type: String, default: "" },
  mustUpdatePassword: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },

  exercisePlan: {
    type: [ExerciseWeekSchema],
    default: [],
  },

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
