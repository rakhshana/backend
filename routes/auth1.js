const express = require("express");
const router = express.Router();
const User = require("../models/blogusers");
const Post = require("../models/Post");

// Login
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      userId: user._id,
      email: user.email,
      password: user.password,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
// Register
router.post("/registration", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });
    const newUser = new User({ email, password });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
//Create
router.post("/create", async (req, res) => {
  const { title, content, userId } = req.body;

  if (!title || !content || !userId) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const newPost = new Post({ title, content, userId });
    await newPost.save();
    res.status(201).json({ message: "Post created successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
//Get all posts
router.get("/all/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
