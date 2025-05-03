const mongoose = require('mongoose');

const ExerciseDaySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  type: { type: String, required: true },
  workout: { type: String, required: true },
  finished: { type: Boolean, default: false } // ✅ ADD this field
});

const ExerciseWeekSchema = new mongoose.Schema({
  week: { type: Number, required: true },
  days: [ExerciseDaySchema]
});

module.exports = ExerciseWeekSchema;
