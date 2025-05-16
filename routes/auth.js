const express = require("express");
const router = express.Router();
const User = require("../models/users");

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password, phoneno } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });
    const newUser = new User({ email, password, phoneno });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      email: user.email,
      password: user.password,
      phoneno: user.phoneno,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

//Update
router.put("/update", async (req, res) => {
  try {
    const { email, phoneno, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (phoneno) user.phoneno = phoneno;
    if (password) user.password = password;

    await user.save();

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
