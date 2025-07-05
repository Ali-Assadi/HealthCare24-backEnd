// routes/rt-exercise.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const ExercisePlanModel = require("../models/ExercisePlan");

router.post("/generate", async (req, res) => {
  const { email, goal, restrictions = [] } = req.body;

  if (!email || !goal) {
    return res.status(400).json({ message: "Email and goal are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const planPool = await ExercisePlanModel.findOne({ goal });
    if (!planPool) {
      return res
        .status(404)
        .json({ message: "No exercise plan found for this goal" });
    }

    const workoutSets = planPool?.plan;
    if (!workoutSets) {
      return res.status(500).json({ message: "❌ Invalid plan format in DB" });
    }

    let chosenKey = "default";
    for (const key of restrictions) {
      if (Array.isArray(workoutSets[key]) && workoutSets[key].length > 0) {
        chosenKey = key;
        break;
      }
    }

    const exercises = workoutSets[chosenKey];
    if (!exercises || exercises.length < 3) {
      return res.status(404).json({
        message: "Not enough exercises available for the selected restriction",
      });
    }

    const plan = [];
    for (let week = 1; week <= 4; week++) {
      const days = [];
      for (let day = 1; day <= 4; day++) {
        const shuffled = [...exercises].sort(() => 0.5 - Math.random());
        const workout = shuffled.slice(0, 3); // 3 exercises per day
        days.push({
          day,
          type: goal,
          workout,
          restriction: chosenKey,
          finished: false,
        });
      }
      plan.push({ week, days });
    }

    user.goal = goal;
    user.exercisePlan = plan;
    await user.save();

    res.json({ message: "✅ Exercise plan generated", exercisePlan: plan });
  } catch (err) {
    console.error("❌ Error generating plan:", err);
    res.status(500).json({ message: "❌ Failed to generate plan", error: err });
  }
});

router.get("/plan/:email", async (req, res) => {
  const email = req.params.email;

  try {
    const user = await User.findOne({ email });

    if (!user || !user.exercisePlan || user.exercisePlan.length === 0) {
      return res.status(404).json({ message: "No plan found" });
    }

    res.status(200).json({
      exercisePlan: user.exercisePlan,
      goal: user.exerciseGoal || user.goal || "",
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load plan", error: err });
  }
});

router.patch("/update-finished-exercise-day", async (req, res) => {
  const { email, weekIndex, dayIndex } = req.body;

  if (!email || weekIndex === undefined || dayIndex === undefined) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const day = user.exercisePlan?.[weekIndex]?.days?.[dayIndex];
    if (!day)
      return res.status(400).json({ message: "Invalid week/day index" });

    day.finished = true;
    user.markModified("exercisePlan");
    await user.save();

    res.json({ message: "✅ Exercise day marked as finished!" });
  } catch (err) {
    console.error("Error updating finished exercise day:", err);
    res.status(500).json({ message: "❌ Server error", error: err });
  }
});

// PATCH /api/exercise/reset-finished-exercise
router.patch("/reset-finished-exercise", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    for (let week of user.exercisePlan) {
      for (let day of week.days) {
        day.finished = false;
      }
    }

    user.hasReviewedExercise = false;

    await user.save();
    res.json({ message: "Exercise plan reset and review flag cleared." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to reset exercise plan", error: err });
  }
});

// PATCH /api/exercise/submit-review
router.patch("/submit-review", async (req, res) => {
  const { email, review, weight, details } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (review && review.length > 3) {
      user.exerciseReviews.push({ text: review });
    }

    if (weight) user.weight = weight;
    if (details) user.details = details;

    user.hasReviewedExercise = true;

    await user.save();

    res.json({ message: "✅ Exercise review saved and user updated" });
  } catch (err) {
    console.error("❌ Error saving exercise review:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// 🔁 Reset + clear exercise plan after review
router.patch("/reset-plan-after-review", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.exercisePlan = [];
    user.hasReviewedExercise = false;
    await user.save();

    res.json({ message: "✅ Exercise plan cleared" });
  } catch (err) {
    console.error("❌ Error resetting plan:", err);
    res.status(500).json({ message: "❌ Failed to reset plan", error: err });
  }
});

module.exports = router;
