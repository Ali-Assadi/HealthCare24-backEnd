const mongoose = require("mongoose");

const userViewsSchema = new mongoose.Schema({
  email: { type: String, required: true },
  views: [
    {
      topic: { type: String },
      section: { type: String },
      subType: { type: String },
      date: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("UserViews", userViewsSchema);
