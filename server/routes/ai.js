import express from "express";
import protect from "../middleware/auth.js";
import {
  analyzeStock,
  chatWithAI,
  getPortfolioInsights,
  analyzeSentiment,
} from "../services/aiService.js";
import { getQuote, getCompanyNews } from "../services/stockService.js";
import User from "../models/User.js";

const router = express.Router();

// AI Stock Analysis
router.get("/analyze/:symbol", protect, async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const [stockData, newsData] = await Promise.all([
      getQuote(symbol),
      getCompanyNews(symbol),
    ]);

    const analysis = await analyzeStock(symbol, stockData, newsData);
    res.json({ symbol, stockData, analysis });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// AI Chat
router.post("/chat", protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }
    const user = await User.findById(req.user._id);

    const context = `User has $${user.balance.toFixed(2)} cash, ${user.holdings.length} holdings, Level ${user.level}, ${user.totalTrades} total trades.`;

    const response = await chatWithAI(message.trim(), context);
    res.json({ response });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Portfolio AI Insights
router.get("/portfolio-insights", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const insights = await getPortfolioInsights(
      user.holdings,
      user.balance,
      user.totalPnL
    );
    res.json(insights);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// News Sentiment Analysis
router.post("/sentiment", protect, async (req, res) => {
  try {
    const { headlines } = req.body;
    const sentiment = await analyzeSentiment(headlines);
    res.json(sentiment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;