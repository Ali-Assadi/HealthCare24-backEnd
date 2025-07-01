const mongoose = require("mongoose");

const restrictionGroupSchema = new mongoose.Schema(
  {
    default: [String],
    noLegs: [String],
    noBack: [String],
    noPush: [String],
    noPull: [String],
    noWeights: [String],
  },
  { _id: false }
);

const ExercisePlanSchema = new mongoose.Schema({
  goal: { type: String, required: true },
  plan: restrictionGroupSchema,
});

module.exports = mongoose.model("ExercisePlan", ExercisePlanSchema);
