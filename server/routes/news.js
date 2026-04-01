import express from "express";
import { getMarketNews, getCompanyNews } from "../services/stockService.js";

const router = express.Router();

router.get("/market", async (req, res) => {
  try {
    const news = await getMarketNews(req.query.category || "general");
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/company/:symbol", async (req, res) => {
  try {
    const news = await getCompanyNews(req.params.symbol.toUpperCase());
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;