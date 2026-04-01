import express from "express";
import protect from "../middleware/auth.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { getQuote } from "../services/stockService.js";

const router = express.Router();

// Helper: check and award achievements
const checkAchievements = async (user) => {
  const newAchievements = [];
  const achieved = user.achievements.map((a) => a.id);

  const checks = [
    {
      id: "first_trade",
      condition: user.totalTrades >= 1,
      title: "First Steps",
      description: "Made your first trade",
      icon: "📈",
    },
    {
      id: "ten_trades",
      condition: user.totalTrades >= 10,
      title: "Active Trader",
      description: "Completed 10 trades",
      icon: "🔥",
    },
    {
      id: "fifty_trades",
      condition: user.totalTrades >= 50,
      title: "Trading Machine",
      description: "Completed 50 trades",
      icon: "⚡",
    },
    {
      id: "first_profit",
      condition: user.profitableTrades >= 1,
      title: "Money Maker",
      description: "Made your first profitable trade",
      icon: "💰",
    },
    {
      id: "diversified",
      condition: user.holdings.length >= 5,
      title: "Diversified",
      description: "Hold 5 different stocks",
      icon: "🎯",
    },
    {
      id: "whale",
      condition: user.totalTrades >= 100,
      title: "Whale",
      description: "Completed 100 trades",
      icon: "🐋",
    },
    {
      id: "profit_1k",
      condition: user.totalPnL >= 1000,
      title: "Grand Profit",
      description: "Earned $1,000+ in total profit",
      icon: "💎",
    },
    {
      id: "profit_10k",
      condition: user.totalPnL >= 10000,
      title: "Diamond Hands",
      description: "Earned $10,000+ in total profit",
      icon: "🏆",
    },
  ];

  for (const check of checks) {
    if (check.condition && !achieved.includes(check.id)) {
      user.achievements.push({
        id: check.id,
        title: check.title,
        description: check.description,
        icon: check.icon,
      });
      user.xp += 100;
      newAchievements.push(check);
    }
  }

  // Level calculation
  user.level = Math.floor(user.xp / 200) + 1;

  return newAchievements;
};

// BUY stock
router.post("/buy", protect, async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid symbol or quantity" });
    }

    const quote = await getQuote(symbol.toUpperCase());
    if (!quote || quote.price <= 0) {
      return res.status(400).json({ message: "Could not get stock price" });
    }

    const total = quote.price * quantity;
    const user = await User.findById(req.user._id);

    if (user.balance < total) {
      return res.status(400).json({
        message: `Insufficient balance. Need
$$
{total.toFixed(2)}, have 
$$
{user.balance.toFixed(2)}`,
      });
    }

    // Deduct balance
    user.balance -= total;

    // Update or add holding
    const existingHolding = user.holdings.find(
      (h) => h.symbol === symbol.toUpperCase()
    );
    if (existingHolding) {
      const newTotal =
        existingHolding.totalInvested + total;
      const newQty = existingHolding.quantity + quantity;
      existingHolding.quantity = newQty;
      existingHolding.avgPrice = newTotal / newQty;
      existingHolding.totalInvested = newTotal;
    } else {
      user.holdings.push({
        symbol: symbol.toUpperCase(),
        name: quote.symbol,
        quantity,
        avgPrice: quote.price,
        totalInvested: total,
      });
    }

    user.totalTrades += 1;
    user.xp += 20;

    // Create transaction
    await Transaction.create({
      user: user._id,
      symbol: symbol.toUpperCase(),
      name: quote.symbol,
      type: "BUY",
      quantity,
      price: quote.price,
      total,
    });

    const newAchievements = await checkAchievements(user);
    await user.save();

    const shareWord = quantity === 1 ? "share" : "shares";
    const priceStr = Number(quote.price).toFixed(2);
    res.json({
      message: `Bought ${quantity} ${shareWord} of ${symbol.toUpperCase()} at $${priceStr}`,
      balance: user.balance,
      holdings: user.holdings,
      newAchievements,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SELL stock
router.post("/sell", protect, async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid symbol or quantity" });
    }

    const user = await User.findById(req.user._id);
    const holding = user.holdings.find(
      (h) => h.symbol === symbol.toUpperCase()
    );

    if (!holding || holding.quantity < quantity) {
      const have = holding ? holding.quantity : 0;
      const w = have === 1 ? "share" : "shares";
      return res.status(400).json({
        message: `Insufficient shares. You have ${have} ${w} of ${symbol.toUpperCase()}`,
      });
    }

    const quote = await getQuote(symbol.toUpperCase());
    if (!quote || quote.price <= 0) {
      return res.status(400).json({ message: "Could not get stock price" });
    }

    const total = quote.price * quantity;
    const pnl = (quote.price - holding.avgPrice) * quantity;

    // Add balance
    user.balance += total;
    user.totalTrades += 1;
    user.totalPnL += pnl;
    user.xp += 20;

    if (pnl > 0) {
      user.profitableTrades += 1;
      user.xp += 10; // bonus xp for profitable trade
    }

    // Update holding
    holding.quantity -= quantity;
    holding.totalInvested -= holding.avgPrice * quantity;

    if (holding.quantity === 0) {
      user.holdings = user.holdings.filter(
        (h) => h.symbol !== symbol.toUpperCase()
      );
    }

    // Create transaction
    await Transaction.create({
      user: user._id,
      symbol: symbol.toUpperCase(),
      name: quote.symbol,
      type: "SELL",
      quantity,
      price: quote.price,
      total,
      pnl,
    });

    const newAchievements = await checkAchievements(user);
    await user.save();

    const shareWord = quantity === 1 ? "share" : "shares";
    const priceStr = Number(quote.price).toFixed(2);
    const pnlStr = Number(pnl).toFixed(2);
    res.json({
      message: `Sold ${quantity} ${shareWord} of ${symbol.toUpperCase()} at $${priceStr}. P&L: $${pnlStr}`,
      balance: user.balance,
      holdings: user.holdings,
      pnl,
      newAchievements,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Transaction history
router.get("/history", protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Transaction.countDocuments({ user: req.user._id });

    res.json({
      transactions,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;