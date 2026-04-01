import express from "express";
import {
  getQuote,
  searchStocks,
  getCompanyProfile,
  getHistoricalData,
  getTrendingStocks,
  getMarketStatus,
} from "../services/stockService.js";
import { apiLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.use(apiLimiter);

// Search stocks
router.get("/search", async (req, res) => {
  try {
    const results = await searchStocks(req.query.q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get stock quote
router.get("/quote/:symbol", async (req, res) => {
  try {
    const quote = await getQuote(req.params.symbol.toUpperCase());
    res.json(quote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get company profile
router.get("/profile/:symbol", async (req, res) => {
  try {
    const profile = await getCompanyProfile(req.params.symbol.toUpperCase());
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get historical data
router.get("/history/:symbol", async (req, res) => {
  try {
    const interval = req.query.interval || "daily";
    const data = await getHistoricalData(
      req.params.symbol.toUpperCase(),
      interval
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get trending/popular stocks
router.get("/trending", async (req, res) => {
  try {
    const stocks = await getTrendingStocks();
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Market status
router.get("/market-status", async (req, res) => {
  try {
    const status = await getMarketStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;