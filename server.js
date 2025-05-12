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
const cartRoutes = require("./routes/rt-Cart");
const productsRoutes = require("./routes/rt-Products");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
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
app.use("/api/exercise", exercisePlanRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api", viewsRoutes);
app.use("/api", notificationRoutes);
app.use("/api/cart", cartRoutes);       // <-- Updated: Routes like /api/cart/:userId
app.use("/api/products", productsRoutes); // <-- Updated: Routes like /api/products/:id

// Start server
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
