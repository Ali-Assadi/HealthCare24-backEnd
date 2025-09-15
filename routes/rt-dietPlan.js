const express = require("express");
const router = express.Router();
const DietPool = require("../models/DietPlan");
const User = require("../models/User");

/* ----------------------------- helpers ----------------------------- */
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const toBucketKey = (r) => {
  if (!r) return "default";
  const raw = String(r).trim().toLowerCase();
  if (raw === "vegetarian") return "vegetarian";
  if (raw === "gluten") return "glutenFree";
  return `no${cap(raw)}`; // egg→noEgg, milk→noMilk, etc.
};

const buildWeeks = (meals, restrictionKey) => {
  const get = (type) => {
    const poolByType = meals?.[type] || {};
    const chosen = poolByType?.[restrictionKey];
    if (Array.isArray(chosen) && chosen.length) return pickRandom(chosen);
    const def = poolByType?.default || [];
    return def.length ? pickRandom(def) : null;
  };

  return Array.from({ length: 4 }, () => ({
    days: Array.from({ length: 7 }, () => ({
      breakfast: get("breakfast"),
      lunch: get("lunch"),
      dinner: get("dinner"),
      snack: get("snack"),
      finished: false,
    })),
  }));
};

/* ------------------------------ routes ----------------------------- */

router.get("/test", (_req, res) => res.send("✅ rt-dietPlan route is working"));

/** POST /api/dietplan/generate-diet-plan
 * body: { email, goal, restriction?: string, (legacy) restrictions?: string[] }
 */
router.post("/generate-diet-plan", async (req, res) => {
  try {
    const { email, goal } = req.body;
    if (!email || !goal) {
      return res.status(400).json({ message: "Email and goal are required." });
    }

    // normalize to a single restriction
    let restriction = (req.body.restriction || "").trim();
    if (
      !restriction &&
      Array.isArray(req.body.restrictions) &&
      req.body.restrictions.length
    ) {
      restriction = String(req.body.restrictions[0] || "").trim();
    }
    if (!restriction) restriction = "default";

    const mealPool = await DietPool.findOne({
      goal: String(goal).toLowerCase(),
    });
    if (!mealPool || !mealPool.meals) {
      return res
        .status(404)
        .json({ message: "No meal pool found for this goal." });
    }

    const bucketKey = toBucketKey(restriction);
    const weeks = buildWeeks(mealPool.meals, bucketKey);

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    user.dietPlan = weeks;
    user.goal = goal;
    user.hasReviewedDiet = false;

    if (restriction === "default") {
      user.dietRestriction = "";
      user.dietRestrictions = []; // ✅ clear instead of saving "default"
    } else {
      user.dietRestriction = restriction; // single string
      user.dietRestrictions = [restriction]; // legacy shape
    }
    await user.save();

    return res.json({
      message: "✅ Custom diet plan generated and saved.",
      plan: { goal, email, weeks },
    });
  } catch (err) {
    console.error("Error generating plan:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

/** GET /api/dietplan/:email */
router.get("/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user || !Array.isArray(user.dietPlan) || user.dietPlan.length === 0) {
      return res.status(404).json({ message: "User or diet plan not found." });
    }
    return res.json({ goal: user.goal, dietPlan: user.dietPlan });
  } catch (err) {
    console.error("Fetch error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

/** PATCH /api/dietplan/mark-finished-day */
router.patch("/mark-finished-day", async (req, res) => {
  const { email, weekIndex, dayIndex } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const day = user.dietPlan?.[weekIndex]?.days?.[dayIndex];
    if (!day) return res.status(400).json({ message: "Invalid indexes" });

    day.finished = true;
    user.markModified("dietPlan");
    await user.save();

    return res.json({ message: "✅ Day marked as finished." });
  } catch (err) {
    console.error("Mark day error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

/** PATCH /api/dietplan/restart-plan */
router.patch("/restart-plan", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !user.dietPlan) {
      return res.status(404).json({ message: "User or diet plan not found." });
    }

    for (const week of user.dietPlan) {
      for (const day of week.days) day.finished = false;
    }
    user.hasReviewedDiet = false;
    user.markModified("dietPlan");
    await user.save();

    return res.json({ message: "🔁 Diet plan reset to unfinished." });
  } catch (err) {
    console.error("Restart error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

/** PATCH /api/dietplan/update-after-diet */
router.patch("/update-after-diet", async (req, res) => {
  const { email, review, weight, details } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!Array.isArray(user.dietReviews)) user.dietReviews = [];
    if (typeof review === "string" && review.trim().length > 0) {
      user.dietReviews.push({ text: review.trim() });
      user.hasReviewedDiet = true;
    }
    if (typeof weight === "number" && weight > 0) user.weight = weight;
    if (typeof details === "string" && details.trim().length > 0)
      user.details = details.trim();

    await user.save();
    return res.json({ message: "✅ Review and updates saved successfully." });
  } catch (err) {
    console.error("Update review error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

/** PATCH /api/dietplan/clear */
router.patch("/clear", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.dietPlan = [];
    user.hasReviewedDiet = false;
    await user.save();

    return res.json({ message: "Diet plan cleared and review reset." });
  } catch (err) {
    console.error("Clear plan error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

/** PATCH /api/dietplan/shuffle-meal
 * body: { email, weekIndex, dayIndex, mealType }
 */
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

    const pool = await DietPool.findOne({
      goal: String(user.goal).toLowerCase(),
    });
    if (!pool || !pool.meals?.[mealType]) {
      return res.status(404).json({ message: "Meal pool not found." });
    }

    // use single stored restriction (fallback to legacy first item)
    const r =
      user.dietRestriction ||
      (Array.isArray(user.dietRestrictions) && user.dietRestrictions[0]) ||
      "default";
    const key = toBucketKey(r);

    // collect from chosen bucket, then add default as fallback
    let mealSet = [];
    if (Array.isArray(pool.meals[mealType][key]))
      mealSet.push(...pool.meals[mealType][key]);
    if (Array.isArray(pool.meals[mealType].default))
      mealSet.push(...pool.meals[mealType].default);
    mealSet = Array.from(new Set(mealSet));

    if (!mealSet.length)
      return res.status(404).json({ message: "No meals found." });

    const randomMeal = pickRandom(mealSet);
    const day = user.dietPlan?.[weekIndex]?.days?.[dayIndex];
    if (!day) return res.status(400).json({ message: "Invalid indexes" });

    day[mealType] = randomMeal;
    user.markModified("dietPlan");
    await user.save();

    return res.json({
      message: `✅ ${mealType} updated to new random meal.`,
      newMeal: randomMeal,
    });
  } catch (err) {
    console.error("❌ shuffle-meal error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
