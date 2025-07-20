const express = require("express");
const router = express.Router();
const DietPool = require("../models/DietPlan"); // meal pool (gain, loss, balance)
const User = require("../models/User");

// Capitalize helper
const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);
// Random picker
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 🧠 Core generation logic
const generatePlan = (meals, restrictions = []) => {
  const cleaned = restrictions.map((r) => `no${capitalize(r)}`);
  const fallback = "default";

  const getMeal = (type) => {
    for (const key of cleaned) {
      if (meals[type][key]) return pickRandom(meals[type][key]);
    }
    return pickRandom(meals[type][fallback]);
  };

  const weeks = [];
  for (let w = 0; w < 4; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      days.push({
        breakfast: getMeal("breakfast"),
        lunch: getMeal("lunch"),
        dinner: getMeal("dinner"),
        snack: getMeal("snack"),
        finished: false,
      });
    }
    weeks.push({ days });
  }
  return weeks;
};

router.get("/test", (req, res) => {
  res.send("✅ rt-dietPlan route is working");
});

// 📥 POST /api/dietplan/generate-diet-plan
router.post("/generate-diet-plan", async (req, res) => {
  console.log("🚀 GENERATE PLAN HIT");
  const { email, goal, restrictions = [] } = req.body;

  try {
    console.log("📨 Received diet plan generation request:", req.body);
    const mealPool = await DietPool.findOne({ goal: goal.toLowerCase() });
    if (!mealPool || !mealPool.meals) {
      return res
        .status(404)
        .json({ message: "No meal pool found for this goal." });
    }
    console.log("🍽️ Using meal pool:", mealPool.goal);

    const planWeeks = generatePlan(mealPool.meals, restrictions);

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    user.dietPlan = planWeeks;
    user.goal = goal;
    user.hasReviewedDiet = false;
    user.dietRestrictions = restrictions;
    await user.save();

    res.json({
      message: "✅ Custom diet plan generated and saved.",
      plan: {
        goal,
        email,
        weeks: planWeeks,
      },
    });
  } catch (err) {
    console.error("Error generating plan:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 📤 GET /api/dietplan/:email – fetch current plan
router.get("/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user || !user.dietPlan || user.dietPlan.length === 0) {
      return res.status(404).json({ message: "User or diet plan not found." });
    }

    res.json({
      goal: user.goal,
      dietPlan: user.dietPlan,
    });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ PATCH /api/dietplan/mark-finished-day
router.patch("/mark-finished-day", async (req, res) => {
  const { email, weekIndex, dayIndex } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.dietPlan?.[weekIndex]?.days?.[dayIndex]) {
      return res.status(400).json({ message: "Invalid indexes" });
    }

    user.dietPlan[weekIndex].days[dayIndex].finished = true;
    user.markModified("dietPlan");
    await user.save();

    res.json({ message: "✅ Day marked as finished." });
  } catch (err) {
    console.error("Mark day error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🔁 PATCH /api/dietplan/restart-plan
router.patch("/restart-plan", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.dietPlan) {
      return res.status(404).json({ message: "User or diet plan not found." });
    }

    user.dietPlan.forEach((week) => {
      week.days.forEach((day) => {
        day.finished = false;
      });
    });

    user.hasReviewedDiet = false;
    user.markModified("dietPlan");
    await user.save();

    res.json({ message: "🔁 Diet plan reset to unfinished." });
  } catch (err) {
    console.error("Restart error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ PATCH /api/dietplan/update-after-diet
router.patch("/update-after-diet", async (req, res) => {
  const { email, review, weight, details } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!Array.isArray(user.dietReviews)) {
      user.dietReviews = [];
    }

    if (review && typeof review === "string" && review.trim().length > 0) {
      user.dietReviews.push({ text: review.trim() });
      user.hasReviewedDiet = true;
    }

    if (typeof weight === "number" && weight > 0) {
      user.weight = weight;
    }

    if (typeof details === "string" && details.trim().length > 0) {
      user.details = details.trim();
    }

    await user.save();

    res.json({ message: "✅ Review and updates saved successfully." });
  } catch (err) {
    console.error("Update review error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ❌ PATCH /api/dietplan/clear
router.patch("/clear", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.dietPlan = [];
    user.hasReviewedDiet = false;
    await user.save();

    res.json({ message: "Diet plan cleared and review reset." });
  } catch (err) {
    console.error("Clear plan error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ PATCH /api/dietplan/shuffle-meal
router.patch("/shuffle-meal", async (req, res) => {
  const { email, weekIndex, dayIndex, mealType } = req.body;

  if (
    !email ||
    weekIndex === undefined ||
    dayIndex === undefined ||
    !mealType
  ) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !user.goal || !user.isSubscribed) {
      return res
        .status(404)
        .json({ message: "User not found or not subscribed." });
    }

    const pool = await DietPool.findOne({ goal: user.goal.toLowerCase() });
    if (!pool || !pool.meals?.[mealType]) {
      return res.status(404).json({ message: "Meal pool not found." });
    }

    const keys = user.dietRestrictions.map((r) => {
      if (r === "gluten") return "glutenFree";
      if (r === "vegetarian") return "vegetarian";
      return `no${r.charAt(0).toUpperCase()}${r.slice(1)}`;
    });

    // Collect eligible meals
    let mealSet = [];
    keys.forEach((k) => {
      if (pool.meals[mealType][k]) {
        mealSet.push(...pool.meals[mealType][k]);
      }
    });

    mealSet.push(...(pool.meals[mealType].default || []));
    mealSet = [...new Set(mealSet)];

    if (!mealSet.length) {
      return res.status(404).json({ message: "No meals found." });
    }

    const randomMeal = mealSet[Math.floor(Math.random() * mealSet.length)];
    user.dietPlan[weekIndex].days[dayIndex][mealType] = randomMeal;

    user.markModified("dietPlan");
    await user.save();

    res.json({
      message: `✅ ${mealType} updated to new random meal.`,
      newMeal: randomMeal,
    });
  } catch (err) {
    console.error("❌ shuffle-meal error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
