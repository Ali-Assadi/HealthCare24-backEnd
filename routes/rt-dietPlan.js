const express = require('express');
const router = express.Router();
const DietPlan = require('../models/DietPlan');
const User = require('../models/User');

// GET diet plan by goal
router.get('/diet-plan/:goal', async (req, res) => {
  const { goal } = req.params;

  try {
    const plan = await DietPlan.findOne({ goal: goal.toLowerCase() });

    if (!plan) {
      return res.status(404).json({ message: 'No plan found for this goal' });
    }

    res.json(plan);
  } catch (err) {
    console.error('Error fetching diet plan:', err);
    res.status(500).json({ message: 'Error fetching diet plan', error: err });
  }
});

// Mark Day In My Diet Plan
router.patch('/update-finished-day', async (req, res) => {
  const { email, weekIndex, dayIndex } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.dietPlan[weekIndex].days[dayIndex].finished = true;
    user.markModified('dietPlan');
    await user.save();

    res.json({ message: '✅ Day marked as finished successfully!' });
  } catch (err) {
    console.error('Error updating finished day:', err);
    res.status(500).json({ message: '❌ Server error', error: err });
  }
});

// ✅ Restart Diet Plan
router.patch('/reset-finished-diet', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.dietPlan && user.dietPlan.length > 0) {
      user.dietPlan.forEach(week => {
        week.days.forEach(day => {
          day.finished = false;
        });
      });
    }

    user.markModified('dietPlan');
    await user.save();

    res.json({ message: '✅ Diet plan restarted successfully!' });
  } catch (err) {
    console.error('Error restarting diet plan:', err);
    res.status(500).json({ message: '❌ Server error', error: err });
  }
});

module.exports = router;
