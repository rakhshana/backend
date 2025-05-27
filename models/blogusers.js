const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePhoto: {
    type: String,
    default: "",
  },
  about: { type: String, default: "" },
});

module.exports = mongoose.model("blogusers", userSchema);
