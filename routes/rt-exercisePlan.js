// routes/rt-exercise.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const ExercisePlanModel = require("../models/ExercisePlan");

/* ----------------------------- helpers ----------------------------- */
const NUM_WEEKS = 4;
const DAYS_PER_WEEK = 4;

const shuffle = (arr) => {
  // Fisher–Yates
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const pickN = (arr, n) => shuffle(arr).slice(0, n);

/* ------------------------- Generate exercise ------------------------ */
router.post("/generate", async (req, res) => {
  try {
    const { email, goal } = req.body;

    if (!email || !goal) {
      return res.status(400).json({ message: "Email and goal are required" });
    }

    // Normalize restriction: prefer `restriction` (string), otherwise first of `restrictions` (array).
    let restriction = (req.body.restriction || "").trim();
    if (
      !restriction &&
      Array.isArray(req.body.restrictions) &&
      req.body.restrictions.length > 0
    ) {
      restriction = String(req.body.restrictions[0] || "").trim();
    }
    if (!restriction) restriction = "default";

    // Load user
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Persist user's selection
    user.exerciseRestrictions = [restriction]; // keep schema compatibility, but single item
    user.goal = goal;

    // Load plan pool for goal
    const planPool = await ExercisePlanModel.findOne({
      goal: String(goal).toLowerCase(),
    });
    if (!planPool || !planPool.plan) {
      return res
        .status(404)
        .json({ message: "No exercise plan found for this goal" });
    }

    const workoutSets = planPool.plan;

    // Use the selected restriction bucket if exists & non-empty, otherwise fallback to 'default'
    let chosenKey =
      restriction in workoutSets &&
      Array.isArray(workoutSets[restriction]) &&
      workoutSets[restriction].length
        ? restriction
        : "default";

    const exercises = workoutSets[chosenKey];
    if (!Array.isArray(exercises) || exercises.length < 3) {
      return res.status(404).json({
        message: "Not enough exercises available for the selected restriction",
        detail: {
          chosenKey,
          availableCount: Array.isArray(exercises) ? exercises.length : 0,
        },
      });
    }

    // Build plan
    const plan = Array.from({ length: NUM_WEEKS }, (_w, idx) => {
      const week = idx + 1;
      const days = Array.from({ length: DAYS_PER_WEEK }, (_d, dIdx) => ({
        day: dIdx + 1,
        type: goal,
        workout: pickN(exercises, 3),
        restriction: chosenKey,
        finished: false,
      }));
      return { week, days };
    });

    user.exercisePlan = plan;
    await user.save();

    return res.json({
      message: "✅ Exercise plan generated",
      exercisePlan: plan,
    });
  } catch (err) {
    console.error("❌ Error generating plan:", err);
    return res.status(500).json({
      message: "❌ Failed to generate plan",
      error: err.message || err,
    });
  }
});

/* ----------------------------- Get plan ----------------------------- */
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
    res
      .status(500)
      .json({ message: "Failed to load plan", error: err.message || err });
  }
});

/* -------------------- Mark day finished -------------------- */
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
    res
      .status(500)
      .json({ message: "❌ Server error", error: err.message || err });
  }
});

/* --------------------------- Reset finished -------------------------- */
router.patch("/reset-finished-exercise", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    for (const week of user.exercisePlan || []) {
      for (const day of week.days || []) {
        day.finished = false;
      }
    }

    user.hasReviewedExercise = false;

    await user.save();
    res.json({ message: "Exercise plan reset and review flag cleared." });
  } catch (err) {
    res.status(500).json({
      message: "Failed to reset exercise plan",
      error: err.message || err,
    });
  }
});

/* ---------------------------- Submit review -------------------------- */
router.patch("/submit-review", async (req, res) => {
  const { email, review, weight, details } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (review && review.length > 3) {
      user.exerciseReviews.push({ text: review });
    }

    if (weight !== undefined) user.weight = weight;
    if (details !== undefined) user.details = details;

    user.hasReviewedExercise = true;

    await user.save();

    res.json({ message: "✅ Exercise review saved and user updated" });
  } catch (err) {
    console.error("❌ Error saving exercise review:", err);
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
});

/* ----------------- Reset/Clear plan after review -------------------- */
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
    res
      .status(500)
      .json({ message: "❌ Failed to reset plan", error: err.message || err });
  }
});

/* --------------------------- Suggestions API ------------------------- */
/**
 * Accepts: goal, restriction? (string). Falls back to 'default' bucket.
 */
router.get("/suggestions", async (req, res) => {
  try {
    const goal = String(req.query.goal || "").toLowerCase();
    const restriction =
      (req.query.restriction || "default").trim() || "default";

    const planPool = await ExercisePlanModel.findOne({ goal });
    const set = planPool?.plan?.[restriction]?.length
      ? planPool.plan[restriction]
      : planPool?.plan?.default || [];

    if (!Array.isArray(set) || set.length === 0) {
      return res.status(404).json({ message: "No exercises found" });
    }

    res.json({ exercises: shuffle(set) });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
});

// PATCH /api/exercise/customize-day
router.patch("/customize-day", async (req, res) => {
  const { email, weekIndex, dayIndex, newWorkout } = req.body;

  // Validate input
  if (
    !email ||
    weekIndex === undefined ||
    dayIndex === undefined ||
    !Array.isArray(newWorkout) ||
    newWorkout.length === 0
  ) {
    return res.status(400).json({ message: "Missing or invalid data" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isSubscribed) {
      return res
        .status(403)
        .json({ message: "Only subscribed users can customize workouts" });
    }

    const day = user.exercisePlan?.[weekIndex]?.days?.[dayIndex];
    if (!day)
      return res.status(400).json({ message: "Invalid week/day index" });

    // Update workout
    day.workout = newWorkout;
    user.markModified("exercisePlan");
    await user.save();

    return res.json({ message: "✅ Day customized successfully" });
  } catch (err) {
    console.error("❌ Error customizing day:", err);
    return res
      .status(500)
      .json({ message: "❌ Server error", error: err.message || err });
  }
});

module.exports = router;
