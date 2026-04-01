import axios from "axios";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 60 }); // 60s cache

const FINNHUB_BASE = "https://finnhub.io/api/v1";
const ALPHA_VANTAGE_BASE = "https://www.alphavantage.co/query";

export const getQuote = async (symbol) => {
  const cacheKey = `quote_${symbol}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get(`${FINNHUB_BASE}/quote`, {
      params: { symbol, token: process.env.FINNHUB_API_KEY },
    });
    // data: { c: current, d: change, dp: percent change, h: high, l: low, o: open, pc: previous close }
    const result = {
      symbol,
      price: data.c,
      change: data.d,
      changePercent: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      prevClose: data.pc,
    };
    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    throw new Error("Failed to fetch quote");
  }
};

export const searchStocks = async (query) => {
  const cacheKey = `search_${query}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get(`${FINNHUB_BASE}/search`, {
      params: { q: query, token: process.env.FINNHUB_API_KEY },
    });
    const results = (data.result || [])
      .filter((r) => r.type === "Common Stock")
      .slice(0, 10)
      .map((r) => ({
        symbol: r.symbol,
        name: r.description,
      }));
    cache.set(cacheKey, results, 300);
    return results;
  } catch (err) {
    throw new Error("Search failed");
  }
};

export const getCompanyProfile = async (symbol) => {
  const cacheKey = `profile_${symbol}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get(`${FINNHUB_BASE}/stock/profile2`, {
      params: { symbol, token: process.env.FINNHUB_API_KEY },
    });
    cache.set(cacheKey, data, 3600);
    return data;
  } catch (err) {
    throw new Error("Failed to fetch company profile");
  }
};

export const getHistoricalData = async (symbol, interval = "daily") => {
  const cacheKey = `history_${symbol}_${interval}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    let func = "TIME_SERIES_DAILY";
    let seriesKey = "Time Series (Daily)";

    if (interval === "weekly") {
      func = "TIME_SERIES_WEEKLY";
      seriesKey = "Weekly Time Series";
    } else if (interval === "monthly") {
      func = "TIME_SERIES_MONTHLY";
      seriesKey = "Monthly Time Series";
    }

    const { data } = await axios.get(ALPHA_VANTAGE_BASE, {
      params: {
        function: func,
        symbol,
        apikey: process.env.ALPHA_VANTAGE_KEY,
        outputsize: "compact",
      },
    });

    const timeSeries = data[seriesKey];
    if (!timeSeries) return [];

    const result = Object.entries(timeSeries)
      .slice(0, 90)
      .map(([date, values]) => ({
        date,
        open: parseFloat(values["1. open"]),
        high: parseFloat(values["2. high"]),
        low: parseFloat(values["3. low"]),
        close: parseFloat(values["4. close"]),
        volume: parseInt(values["5. volume"]),
      }))
      .reverse();

    cache.set(cacheKey, result, 900);
    return result;
  } catch (err) {
    throw new Error("Failed to fetch historical data");
  }
};

export const getMarketNews = async (category = "general") => {
  const cacheKey = `news_${category}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get(`${FINNHUB_BASE}/news`, {
      params: { category, token: process.env.FINNHUB_API_KEY },
    });
    const results = data.slice(0, 20);
    cache.set(cacheKey, results, 300);
    return results;
  } catch (err) {
    throw new Error("Failed to fetch news");
  }
};

export const getCompanyNews = async (symbol) => {
  const cacheKey = `companynews_${symbol}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const today = new Date().toISOString().split("T")[0];
  const lastWeek = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .split("T")[0];

  try {
    const { data } = await axios.get(`${FINNHUB_BASE}/company-news`, {
      params: {
        symbol,
        from: lastWeek,
        to: today,
        token: process.env.FINNHUB_API_KEY,
      },
    });
    const results = data.slice(0, 15);
    cache.set(cacheKey, results, 300);
    return results;
  } catch (err) {
    throw new Error("Failed to fetch company news");
  }
};

export const getTrendingStocks = async () => {
  // Use a predefined list of popular stocks and fetch their quotes
  const symbols = [
    "AAPL",
    "GOOGL",
    "MSFT",
    "AMZN",
    "TSLA",
    "META",
    "NVDA",
    "NFLX",
    "AMD",
    "DIS",
    "BA",
    "JPM",
  ];
  const quotes = await Promise.allSettled(
    symbols.map((s) => getQuote(s))
  );
  return quotes
    .filter((q) => q.status === "fulfilled" && q.value.price > 0)
    .map((q) => q.value);
};

export const getMarketStatus = async () => {
  try {
    const { data } = await axios.get(
      `${FINNHUB_BASE}/stock/market-status`,
      {
        params: { exchange: "US", token: process.env.FINNHUB_API_KEY },
      }
    );
    return data;
  } catch {
    return { isOpen: false };
  }
};