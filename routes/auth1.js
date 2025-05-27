const express = require("express");
const router = express.Router();
const User = require("../models/blogusers");
const Post = require("../models/Post");
const upload = require("../middleware/upload");

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

// DELETE /api/auth/delete/:postId
router.delete("/delete/:postId", async (req, res) => {
  const { postId } = req.params;

  try {
    const deletedPost = await Post.findByIdAndDelete(postId);

    if (!deletedPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Server error" });
  }
});
// GET /api/auth/all
router.get("/all", async (req, res) => {
  try {
    const posts = await Post.find().populate(
      "userId",
      "name profilePhoto about"
    ); // Populate only needed fields
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/:postId/like
router.post("/:postId/like", async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
      await post.save();
    }

    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
// POST /api/auth/:postId/comment
router.post("/:postId/comment", async (req, res) => {
  const { postId } = req.params;
  const { user, text } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.comments.push({ user, text });
    await post.save();

    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post(
  "/upload-profile/:userId",
  upload.single("profile"),
  async (req, res) => {
    try {
      const userId = req.params.userId.trim(); // ✅ Fix newline issue

      const user = await User.findByIdAndUpdate(
        userId,
        { profilePhoto: req.file.path },
        { new: true }
      );

      res.status(200).json({ message: "Profile photo updated", user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update profile photo" });
    }
  }
);
// GET /api/auth/user/:userId
router.get("/user/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
// PUT /api/auth/user/:userId
router.put("/user/:userId", async (req, res) => {
  try {
    const { name, email, password, about } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { name, email, password, about },
      { new: true }
    );
    res.status(200).json({ message: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
