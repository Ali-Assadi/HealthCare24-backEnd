const mongoose = require("mongoose");

const exePictureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  path: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("ExePictures", exePictureSchema);
