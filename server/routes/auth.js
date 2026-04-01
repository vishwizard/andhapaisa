import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import protect from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// Register
router.post("/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password });

    // First achievement
    user.achievements.push({
      id: "welcome",
      title: "Welcome to StockVerse!",
      description: "Created your account",
      icon: "🎉",
    });
    user.xp += 50;
    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      balance: user.balance,
      level: user.level,
      xp: user.xp,
      achievements: user.achievements,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        holdings: user.holdings,
        achievements: user.achievements,
        totalTrades: user.totalTrades,
        profitableTrades: user.profitableTrades,
        totalPnL: user.totalPnL,
        level: user.level,
        xp: user.xp,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get profile
router.get("/profile", protect, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.json(user);
});

// Update profile
router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = req.body.name || user.name;
    user.avatar = req.body.avatar || user.avatar;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updated = await user.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      avatar: updated.avatar,
      balance: updated.balance,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset account (paper trading reset)
router.post("/reset", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.balance = 100000;
    user.holdings = [];
    user.totalTrades = 0;
    user.profitableTrades = 0;
    user.totalPnL = 0;
    user.xp = 50;
    user.level = 1;
    await user.save();
    res.json({ message: "Account reset successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;