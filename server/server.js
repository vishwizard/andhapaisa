import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env from the server folder (works no matter which directory you start node from)
dotenv.config({ path: path.join(__dirname, ".env") });

// Validate required environment variables exist
const requiredEnvVars = ["GEMINI_API_KEY", "FINNHUB_API_KEY", "MONGO_URI", "JWT_SECRET"];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`❌ Missing critical environment variables: ${missingVars.join(", ")}`);
  process.exit(1);
}

import express from "express";
import "express-async-errors";
import cors from "cors";
import connectDB from "./config/db.js";
import { attachHttpErrorLogging, logUnhandledRejections } from "./middleware/httpDebugLog.js";

logUnhandledRejections();

// Initialize database
connectDB();

// Import all routes AFTER env vars are loaded
import authRoutes from "./routes/auth.js";
import stockRoutes from "./routes/stocks.js";
import portfolioRoutes from "./routes/portfolio.js";
import tradingRoutes from "./routes/trading.js";
import watchlistRoutes from "./routes/watchlist.js";
import aiRoutes from "./routes/ai.js";
import newsRoutes from "./routes/news.js";
import leaderboardRoutes from "./routes/leaderboard.js";


const app = express();

app.use(cors());
app.use(express.json());
app.use(attachHttpErrorLogging());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/trading", tradingRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

app.get("/", (req, res) => {
  res.json({ message: "StockVerse API is running 🚀" });
});

// Last-resort handler for sync throws / next(err) (must be after all routes, 4 args)
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error("[express error]", req.method, req.originalUrl, err);
  if (err?.stack) {
    console.error(err.stack);
  }
  res.status(err.statusCode || err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 StockVerse API Running             ║
╚════════════════════════════════════════╝
Port: ${PORT}
Environment: ${process.env.NODE_ENV || "development"}

🔍 Environment Variables Status:
  ✅ MONGO_URI: ${process.env.MONGO_URI ? "Configured" : "❌ Missing"}
  ${process.env.JWT_SECRET ? "✅" : "❌"} JWT_SECRET: ${process.env.JWT_SECRET ? "Configured" : "Missing"}
  ${process.env.FINNHUB_API_KEY ? "✅" : "❌"} FINNHUB_API_KEY: ${process.env.FINNHUB_API_KEY ? "Configured" : "Missing"}
  ${process.env.GEMINI_API_KEY ? "✅" : "❌"} GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? "Configured" : "Missing"}
  ${process.env.ALPHA_VANTAGE_KEY ? "✅" : "❌"} ALPHA_VANTAGE_KEY: ${process.env.ALPHA_VANTAGE_KEY ? "Configured" : "Missing"}
  ${process.env.NEWS_API_KEY ? "✅" : "❌"} NEWS_API_KEY: ${process.env.NEWS_API_KEY ? "Configured" : "Missing"}
  `);
});