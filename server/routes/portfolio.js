import express from "express";
import protect from "../middleware/auth.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { getQuote } from "../services/stockService.js";

const router = express.Router();

// Get portfolio with live prices
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    // Fetch live prices for all holdings
    const holdingsWithPrices = await Promise.all(
      user.holdings.map(async (h) => {
        try {
          const quote = await getQuote(h.symbol);
          const currentValue = quote.price * h.quantity;
          const pnl = currentValue - h.totalInvested;
          const pnlPercent = h.totalInvested > 0 
            ? (pnl / h.totalInvested) * 100 
            : 0;
          return {
            symbol: h.symbol,
            name: h.name,
            quantity: h.quantity,
            avgPrice: h.avgPrice,
            totalInvested: h.totalInvested,
            currentPrice: quote.price,
            currentValue,
            pnl,
            pnlPercent,
            dayChange: quote.change,
            dayChangePercent: quote.changePercent,
          };
        } catch {
          return {
            ...h.toObject(),
            currentPrice: h.avgPrice,
            currentValue: h.avgPrice * h.quantity,
            pnl: 0,
            pnlPercent: 0,
          };
        }
      })
    );

    const totalInvested = holdingsWithPrices.reduce(
      (sum, h) => sum + h.totalInvested,
      0
    );
    const totalCurrentValue = holdingsWithPrices.reduce(
      (sum, h) => sum + h.currentValue,
      0
    );
    const totalPnL = totalCurrentValue - totalInvested;
    const totalPnLPercent =
      totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const netWorth = user.balance + totalCurrentValue;
    const overallReturn = netWorth - user.initialBalance;
    const overallReturnPercent =
      (overallReturn / user.initialBalance) * 100;

    res.json({
      balance: user.balance,
      holdings: holdingsWithPrices,
      totalInvested,
      totalCurrentValue,
      totalPnL,
      totalPnLPercent,
      netWorth,
      overallReturn,
      overallReturnPercent,
      totalTrades: user.totalTrades,
      profitableTrades: user.profitableTrades,
      winRate:
        user.totalTrades > 0
          ? ((user.profitableTrades / user.totalTrades) * 100).toFixed(1)
          : 0,
      level: user.level,
      xp: user.xp,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get portfolio performance over time
router.get("/performance", protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({
      createdAt: 1,
    });

    let balance = 100000;
    const performance = [
      { date: transactions[0]?.createdAt || new Date(), value: balance },
    ];

    transactions.forEach((t) => {
      if (t.type === "BUY") balance -= t.total;
      else balance += t.total;
      performance.push({ date: t.createdAt, value: balance });
    });

    res.json(performance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;