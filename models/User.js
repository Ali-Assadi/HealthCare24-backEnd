const mongoose = require("mongoose");
const ExerciseWeekSchema = require("./exercisePlan"); // make sure path is correct

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: Number,
  height: Number,
  weight: Number,
  details: { type: String, default: "" },
  dietPlan: { type: Array, default: [] },
  goal: { type: String, default: "" },
  mustUpdatePassword: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  exercisePlan: [ExerciseWeekSchema],
  isSubscribed: { type: Boolean, default: false },
  reviews: [
    {
      date: { type: Date, default: Date.now },
      text: { type: String },
    },
  ],
});

module.exports = mongoose.model("User", UserSchema);
