import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Get leaderboard
router.get("/", async (req, res) => {
  try {
    const type = req.query.type || "pnl"; // pnl, trades, level
    let sortField = "-totalPnL";
    if (type === "trades") sortField = "-totalTrades";
    if (type === "level") sortField = "-xp";

    const users = await User.find()
      .select("name avatar totalPnL totalTrades profitableTrades level xp holdings balance initialBalance achievements")
      .sort(sortField)
      .limit(50);

    const leaderboard = users.map((u, index) => {
      const holdingsValue = u.holdings.reduce(
        (sum, h) => sum + h.quantity * h.avgPrice,
        0
      );
      const netWorth = u.balance + holdingsValue;
      return {
        rank: index + 1,
        name: u.name,
        avatar: u.avatar,
        totalPnL: u.totalPnL,
        totalTrades: u.totalTrades,
        profitableTrades: u.profitableTrades,
        winRate:
          u.totalTrades > 0
            ? ((u.profitableTrades / u.totalTrades) * 100).toFixed(1)
            : 0,
        level: u.level,
        xp: u.xp,
        netWorth,
        returnPercent: (
          ((netWorth - u.initialBalance) / u.initialBalance) *
          100
        ).toFixed(2),
        achievementCount: u.achievements.length,
      };
    });

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;