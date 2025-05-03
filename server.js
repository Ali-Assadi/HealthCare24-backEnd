const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

// Route imports
const authRoutes = require("./routes/rt-auth");
const chatRoutes = require("./routes/rt-chat");
const subscribeRoutes = require("./routes/rt-subscribe");
const requestRoutes = require("./routes/rt-request-dietPlan");
const dietPlanRoutes = require("./routes/rt-dietPlan");
const adminRoutes = require("./routes/rt-admin");
const exercisePlanRoutes = require("./routes/rt-exercise");
const viewsRoutes = require("./routes/rt-view");
const notificationRoutes = require("./routes/rt-notification");

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Prefer this over body-parser for modern apps
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
mongoose
  .connect("mongodb://127.0.0.1:27017/myapp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Route usage
app.use("/api", authRoutes);
app.use("/api", subscribeRoutes);
app.use("/api", requestRoutes);
app.use("/api", dietPlanRoutes);
app.use("/api/exercise", exercisePlanRoutes); // ✅ Exercise plan generator
app.use("/api/admin", adminRoutes); // ✅ Admin dashboard and actions
app.use("/api/chat", chatRoutes); // ✅ Chat system
app.use("/api", viewsRoutes);
app.use("/api", notificationRoutes);

// Start server
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
