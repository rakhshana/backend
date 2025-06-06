const express = require("express");
const router = express.Router();
const User = require("../models/blogusers");
const Post = require("../models/Post");
const upload = require("../middleware/upload");
const mongoose = require("mongoose");

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
    console.log("Request body:", req.body); // 🔍 Check what’s actually coming in

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });

    const newUser = new User({ email, password });
    console.log("New User object:", newUser); // 🔍 Show what’s being saved

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err); // 🔍 Log the real error
    res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }
});

//Create
router.post("/create", upload.single("image"), async (req, res) => {
  const { title, content, userId, videoUrl } = req.body; // include videoUrl here
  const image = req.file ? req.file.filename : null;

  if (!title || !content || !userId) {
    return res
      .status(400)
      .json({ error: "Title, content, and userId are required" });
  }

  try {
    const newPost = new Post({
      title,
      content,
      userId,
      videoUrl: videoUrl || null,
      image,
    });

    await newPost.save();
    res
      .status(201)
      .json({ message: "Post created successfully", post: newPost });
  } catch (err) {
    console.error("Error creating post:", err);
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
    const posts = await Post.find()
      .populate("userId", "name profilePhoto about")
      .populate("comments.user", "name profilePhoto");

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

router.post("/:postId/comment", async (req, res) => {
  const { postId } = req.params;
  const { userId, text } = req.body;

  // Validate postId and userId are valid ObjectIds
  if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ error: "Invalid postId" });
  }

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid userId" });
  }

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Comment text is required" });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Remove corrupted comments
    post.comments = post.comments.filter(
      (c) => c.user && c.text && mongoose.Types.ObjectId.isValid(c.user)
    );

    // Add the new comment
    post.comments.push({ user: userId, text });
    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate("userId", "name profilePhoto about")
      .populate("comments.user", "name profilePhoto");

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error adding comment:", error.stack);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

router.post(
  "/upload-profile/:userId",
  upload.single("profile"),
  async (req, res) => {
    try {
      const userId = req.params.userId.trim();

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

// GET /api/auth/post/:postId - Get a single post by ID
router.get("/:postId", async (req, res) => {
  const { postId } = req.params;

  // Validate postId
  if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ error: "Invalid postId" });
  }

  try {
    const post = await Post.findById(postId)
      .populate("userId", "name profilePhoto about")
      .populate("comments.user", "name profilePhoto");

    if (!post) return res.status(404).json({ error: "Post not found" });

    res.status(200).json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

module.exports = router;
