// routes/rt-exercise.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/generate", async (req, res) => {
  const { email, goal } = req.body;

  if (!email || !goal) {
    return res.status(400).json({ message: "Email and goal are required" });
  }

  const plan = [];

  const workoutTypes = {
    loss: ["Cardio", "HIIT", "Running", "Cycling"],
    mass: ["Weight Lifting", "Bodyweight Strength", "Resistance Bands", "Progressive Overload"],
    balance: ["Yoga", "Pilates", "Bodyweight", "Cardio-Strength"],
  };

  for (let week = 1; week <= 4; week++) {
    const days = [];
    for (let day = 1; day <= 4; day++) {
      const type = workoutTypes[goal][Math.floor(Math.random() * workoutTypes[goal].length)];
      days.push({
        day,
        type,
        workout: `${type} workout for day ${day} of week ${week}`,
        finished: false // ✅ now added properly
      });
    }
    plan.push({ week, days });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.goal = goal;
    user.exercisePlan = plan;

    await user.save(); // ✅ important

    res.json({
      message: "Exercise plan generated",
      exercisePlan: user.exercisePlan,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate exercise plan", error: err });
  }
});

// ✅ GET route to fetch saved exercise plan by email
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

// ✅ PATCH route to mark an exercise day as finished
router.patch("/update-finished-exercise-day", async (req, res) => {
  const { email, weekIndex, dayIndex } = req.body;

  if (!email || weekIndex === undefined || dayIndex === undefined) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.exercisePlan || !user.exercisePlan[weekIndex] || !user.exercisePlan[weekIndex].days[dayIndex]) {
      return res.status(400).json({ message: "Invalid week/day index" });
    }

    user.exercisePlan[weekIndex].days[dayIndex].finished = true;

    user.markModified("exercisePlan"); // ✅ Important so Mongoose saves changes inside arrays
    await user.save();

    res.json({ message: "✅ Exercise day marked as finished!" });
  } catch (err) {
    console.error("Error updating finished exercise day:", err);
    res.status(500).json({ message: "❌ Server error", error: err });
  }
});

// Reset all finished fields to false
router.patch("/reset-finished-exercise", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !user.exercisePlan) {
      return res.status(404).json({ message: "User not found or no exercise plan" });
    }

    user.exercisePlan.forEach(week => {
      week.days.forEach(day => {
        day.finished = false;
      });
    });

    user.markModified("exercisePlan");
    await user.save();

    res.json({ message: "✅ Exercise plan reset successfully" });
  } catch (err) {
    console.error("Error resetting exercise plan:", err);
    res.status(500).json({ message: "❌ Server error", error: err });
  }
});

module.exports = router;
