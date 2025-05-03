const express = require("express");
const router = express.Router();
const User = require("../models/User");

// ✅ Route to get all non-admin users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // exclude passwords
    res.json(users);
  } catch (err) {
    console.error("[ERROR] Failed to fetch users:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});
// Delete user
router.delete("/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user" });
  }
});
//Dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const usersWithDietPlans = await User.countDocuments({
      dietPlan: { $exists: true, $ne: [] },
    });

    const usersWithExercisePlans = await User.countDocuments({
      exercisePlan: { $exists: true, $ne: [] },
    });

    res.status(200).json({
      userCount,
      plansGenerated: usersWithDietPlans,
      exercisePlansGenerated: usersWithExercisePlans, // 👈 NEW
      message: "Dashboard stats loaded",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});
// Clear exercise plan
router.put("/users/:id/clear-exercise", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { exercisePlan: [], goal: "" });
    res.json({ message: "Exercise plan cleared" });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear exercise plan" });
  }
});

// Clear diet plan
router.put("/users/:id/clear-plan", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { dietPlan: [], goal: "" });
    res.json({ message: "Diet plan cleared" });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear diet plan" });
  }
});
// Get all diet plans
router.get("/diets", async (req, res) => {
  try {
    const users = await User.find(
      { "dietPlan.0": { $exists: true } },
      "email dietPlan"
    );
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching diets", error: err });
  }
});

// Update a specific user's diet plan
router.put("/diets/:email", async (req, res) => {
  const { email } = req.params;
  const { dietPlan } = req.body;

  try {
    const updated = await User.findOneAndUpdate(
      { email },
      { dietPlan },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Diet plan updated", user: updated });
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err });
  }
});
// ✅ Get all exercise plans for users
router.get("/exercises", async (req, res) => {
  try {
    const users = await User.find(
      { "exercisePlan.0": { $exists: true } },
      "email exercisePlan goal"
    );
    res.status(200).json(users);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching exercise plans", error: err });
  }
});
// ✅ Update a specific user's exercise plan
router.put("/exercises/:email", async (req, res) => {
  const { email } = req.params;
  const { exercisePlan } = req.body;

  try {
    const updated = await User.findOneAndUpdate(
      { email },
      { exercisePlan },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Exercise plan updated", user: updated });
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err });
  }
});

module.exports = router;
