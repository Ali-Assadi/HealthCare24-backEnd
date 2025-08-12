// routes/rt-exercise.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const ExercisePlanModel = require("../models/ExercisePlan");

router.post("/generate", async (req, res) => {
  const { email, goal } = req.body;
  let { restrictions = [] } = req.body;

  if (!email || !goal) {
    return res.status(400).json({ message: "Email and goal are required" });
  }

  // 🛡️ Normalize restrictions to a clean array of strings
  try {
    if (typeof restrictions === "string") {
      restrictions = restrictions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (!Array.isArray(restrictions)) {
      restrictions = [];
    } else {
      restrictions = restrictions
        .map(String)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  } catch (e) {
    console.error("❌ Restrictions normalization error:", e);
    restrictions = [];
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Save selected restrictions to user (NOTE: your frontend reads user.restrictions; consider aligning)
    user.exerciseRestrictions = restrictions;
    user.goal = goal;

    const planPool = await ExercisePlanModel.findOne({ goal });
    if (!planPool) {
      return res
        .status(404)
        .json({ message: "No exercise plan found for this goal" });
    }

    const workoutSets = planPool.plan;
    if (!workoutSets || typeof workoutSets !== "object") {
      return res.status(500).json({ message: "❌ Invalid plan format in DB" });
    }
    const defaultBucket = Array.isArray(workoutSets.default)
      ? workoutSets.default
      : [];

    // ✅ Build candidates respecting multiple restrictions
    const validKeys = (restrictions || []).filter(
      (k) => Array.isArray(workoutSets[k]) && workoutSets[k].length > 0
    );

    let appliedKeys = [];
    let candidate = [];

    // Helper: Fisher–Yates shuffle
    const shuffleInPlace = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    try {
      if (validKeys.length === 0) {
        // No valid restriction arrays → use default
        appliedKeys = ["default"];
        candidate = [...defaultBucket];
      } else {
        // AND logic (intersection)
        const toSet = (arr) => new Set(Array.isArray(arr) ? arr : []);
        const intersect = (a, b) => new Set([...a].filter((x) => b.has(x)));
        let current = toSet(workoutSets[validKeys[0]]);
        appliedKeys = [validKeys[0]];

        for (let i = 1; i < validKeys.length; i++) {
          const key = validKeys[i];
          current = intersect(current, toSet(workoutSets[key]));
          appliedKeys.push(key);
        }

        if (current.size >= 3) {
          candidate = [...current];
        } else {
          // OR logic (union)
          const union = (a, b) => new Set([...a, ...b]);
          let uni = new Set();
          for (const k of validKeys) {
            uni = union(uni, new Set(workoutSets[k] || []));
          }

          if (uni.size >= 3) {
            candidate = [...uni];
          } else {
            // Largest single bucket
            let largestKey = validKeys[0];
            for (const k of validKeys.slice(1)) {
              if (
                (workoutSets[k] || []).length >
                (workoutSets[largestKey] || []).length
              ) {
                largestKey = k;
              }
            }
            candidate = [...(workoutSets[largestKey] || [])];

            // Final fallback: default
            if (candidate.length < 3) {
              candidate = [...defaultBucket];
              appliedKeys = ["default"];
            }
          }
        }
      }
    } catch (mixErr) {
      console.error("❌ Mixing restrictions failed:", {
        restrictions,
        validKeys,
        err: mixErr,
      });
      // Safe fallback
      appliedKeys = ["default"];
      candidate = [...defaultBucket];
    }

    if (!candidate || candidate.length < 3) {
      return res.status(404).json({
        message: "Not enough exercises available for the selected restrictions",
        details: {
          restrictions: restrictions,
          appliedKeys,
          candidateLen: candidate?.length || 0,
        },
      });
    }

    const plan = [];
    for (let week = 1; week <= 4; week++) {
      const days = [];
      for (let day = 1; day <= 4; day++) {
        const shuffled = shuffleInPlace([...candidate]);
        const workout = shuffled.slice(0, 3);
        days.push({
          day,
          type: goal,
          workout,
          restriction: appliedKeys, // store all applied keys
          finished: false,
        });
      }
      plan.push({ week, days });
    }

    user.exercisePlan = plan;
    await user.save();

    res.json({ message: "✅ Exercise plan generated", exercisePlan: plan });
  } catch (err) {
    // ⛳ ADDITIONAL CONTEXT IN LOGS
    console.error("❌ Error generating plan:", {
      body: req.body,
      parsedRestrictions: restrictions,
      stack: err?.stack || err,
    });
    res
      .status(500)
      .json({
        message: "❌ Failed to generate plan",
        error: String(err?.message || err),
      });
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

router.get("/suggestions", async (req, res) => {
  const { goal, restriction = "default" } = req.query;

  try {
    const planPool = await ExercisePlanModel.findOne({ goal });
    const set = planPool?.plan?.[restriction] || [];

    if (set.length === 0) {
      return res.status(404).json({ message: "No exercises found" });
    }

    const shuffled = [...set].sort(() => 0.5 - Math.random());
    res.json({ exercises: shuffled });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

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
    if (!day) {
      return res.status(400).json({ message: "Invalid week/day index" });
    }

    // Update workout
    day.workout = newWorkout;
    user.markModified("exercisePlan");

    await user.save();

    res.json({ message: "✅ Day customized successfully" });
  } catch (err) {
    console.error("❌ Error customizing day:", err);
    res.status(500).json({ message: "❌ Server error", error: err });
  }
});

module.exports = router;
