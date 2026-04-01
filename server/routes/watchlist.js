import express from "express";
import protect from "../middleware/auth.js";
import Watchlist from "../models/Watchlist.js";
import { getQuote } from "../services/stockService.js";

const router = express.Router();

// Get watchlist with live prices
router.get("/", protect, async (req, res) => {
  try {
    const items = await Watchlist.find({ user: req.user._id }).sort({
      addedAt: -1,
    });

    const withPrices = await Promise.all(
      items.map(async (item) => {
        try {
          const quote = await getQuote(item.symbol);
          return { ...item.toObject(), ...quote };
        } catch {
          return item.toObject();
        }
      })
    );

    res.json(withPrices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add to watchlist
router.post("/", protect, async (req, res) => {
  try {
    const { symbol, name } = req.body;
    const exists = await Watchlist.findOne({
      user: req.user._id,
      symbol: symbol.toUpperCase(),
    });
    if (exists) {
      return res.status(400).json({ message: "Already in watchlist" });
    }
    const item = await Watchlist.create({
      user: req.user._id,
      symbol: symbol.toUpperCase(),
      name: name || symbol,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove from watchlist
router.delete("/:symbol", protect, async (req, res) => {
  try {
    await Watchlist.findOneAndDelete({
      user: req.user._id,
      symbol: req.params.symbol.toUpperCase(),
    });
    res.json({ message: "Removed from watchlist" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;