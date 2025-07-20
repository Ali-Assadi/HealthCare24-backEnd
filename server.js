const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/rt-auth");
const chatRoutes = require("./routes/rt-chat");
const subscribeRoutes = require("./routes/rt-subscribe");
const requestRoutes = require("./routes/rt-request-dietPlan");
const dietPlanRoutes = require("./routes/rt-dietPlan");
const adminRoutes = require("./routes/rt-admin");
const exercisePlanRoutes = require("./routes/rt-exercisePlan");
const viewsRoutes = require("./routes/rt-view");
const notificationRoutes = require("./routes/rt-notification");
const cartRoutes = require("./routes/rt-cart");
const productsRoutes = require("./routes/rt-products");
const orderRoutes = require("./routes/rt-order");
const healthArticlesRoute = require("./routes/rt-healthArticle");
const nutritionRoute = require("./routes/rt-nutritionArticles");
const fitnessArticlesRoute = require("./routes/rt-fitnessArtciles");
const exePictureRoutes = require('./routes/exePicture.routes');



const app = express();

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose
  .connect("mongodb://127.0.0.1:27017/myapp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Mount routes
app.use("/api", authRoutes);
app.use("/api", subscribeRoutes);
app.use("/api", requestRoutes);
app.use("/api/dietplan", dietPlanRoutes);
app.use("/api/exercise", exercisePlanRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api", viewsRoutes);
app.use("/api", notificationRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/healthArticles", healthArticlesRoute);
app.use("/api/nutritionArticles", nutritionRoute);
app.use("/api/fitnessArticles", fitnessArticlesRoute);
app.use('/api/exePictures', exePictureRoutes);



const PORT = 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
