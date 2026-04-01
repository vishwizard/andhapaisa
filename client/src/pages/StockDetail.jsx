import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import StockChart from "../components/StockChart";
import TradeModal from "../components/TradeModal";
import NewsCard from "../components/NewsCard";
import SentimentMeter from "../components/SentimentMeter";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiMinus,
  FiEye,
  FiCpu,
  FiTrendingUp,
  FiTrendingDown,
  FiInfo,
} from "react-icons/fi";

const StockDetail = () => {
  const { symbol } = useParams();
  const [quote, setQuote] = useState(null);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [news, setNews] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [tradeModal, setTradeModal] = useState(false);
  const [interval, setInterval] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    fetchStockData();
  }, [symbol]);

  useEffect(() => {
    fetchHistory();
  }, [symbol, interval]);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const [quoteRes, profileRes, newsRes, watchlistRes] =
        await Promise.allSettled([
          api.get(`/stocks/quote/${symbol}`),
          api.get(`/stocks/profile/${symbol}`),
          api.get(`/news/company/${symbol}`),
          api.get("/watchlist"),
        ]);

      if (quoteRes.status === "fulfilled") setQuote(quoteRes.value.data);
      if (profileRes.status === "fulfilled") setProfile(profileRes.value.data);
      if (newsRes.status === "fulfilled") setNews(newsRes.value.data);
      if (watchlistRes.status === "fulfilled") {
        const list = watchlistRes.value.data;
        setInWatchlist(list.some((w) => w.symbol === symbol.toUpperCase()));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await api.get(
        `/stocks/history/${symbol}?interval=${interval}`
      );
      setHistory(data);
    } catch {
      setHistory([]);
    }
  };

  const handleAIAnalysis = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.get(`/ai/analyze/${symbol}`);
      setAiAnalysis(data.analysis);

      // Also get sentiment
      if (news.length > 0) {
        const headlines = news.slice(0, 10).map((n) => n.headline);
        const { data: sentimentData } = await api.post("/ai/sentiment", {
          headlines,
        });
        setSentiment(sentimentData);
      }
    } catch (err) {
      toast.error("AI analysis failed. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const toggleWatchlist = async () => {
    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${symbol}`);
        setInWatchlist(false);
        toast.success("Removed from watchlist");
      } else {
        await api.post("/watchlist", {
          symbol: symbol.toUpperCase(),
          name: profile?.name || symbol,
        });
        setInWatchlist(true);
        toast.success("Added to watchlist! ⭐");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  const isPositive = (quote?.change || 0) >= 0;

  return (
    <div className="page-container">
      {/* Stock Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
        <div className="flex items-start gap-4">
          {profile?.logo && (
            <img
              src={profile.logo}
              alt={symbol}
              className="w-14 h-14 rounded-xl bg-white p-2"
              onError={(e) => (e.target.style.display = "none")}
            />
          )}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold">{symbol?.toUpperCase()}</h1>
              {profile?.exchange && (
                <span className="badge-blue">{profile.exchange}</span>
              )}
            </div>
            <p className="text-dark-400">
              {profile?.name || symbol} · {profile?.finnhubIndustry || ""}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-4xl font-bold">
                ${quote?.price?.toFixed(2)}
              </span>
              <div
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${
                  isPositive ? "bg-emerald-500/10" : "bg-red-500/10"
                }`}
              >
                {isPositive ? (
                  <FiTrendingUp className="text-emerald-400" />
                ) : (
                  <FiTrendingDown className="text-red-400" />
                )}
                <span
                  className={`font-semibold ${
                    isPositive ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {quote?.change?.toFixed(2)} ({quote?.changePercent?.toFixed(2)}
                  %)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setTradeModal(true)} className="btn-success flex items-center gap-2">
            <FiPlus size={18} />
            Trade
          </button>
          <button onClick={toggleWatchlist} className={`flex items-center gap-2 font-semibold py-2.5 px-6 rounded-xl transition-all ${inWatchlist ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "btn-secondary"}`}>
            <FiEye size={18} />
            {inWatchlist ? "Watching" : "Watch"}
          </button>
          <button
            onClick={handleAIAnalysis}
            disabled={aiLoading}
            className="btn-primary flex items-center gap-2"
          >
            <FiCpu size={18} />
            {aiLoading ? "Analyzing..." : "AI Analysis"}
          </button>
        </div>
      </div>

      {/* Price Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Open", value: `$${quote?.open?.toFixed(2)}` },
          { label: "Previous Close", value: `$${quote?.prevClose?.toFixed(2)}` },
          { label: "Day High", value: `$${quote?.high?.toFixed(2)}` },
          { label: "Day Low", value: `$${quote?.low?.toFixed(2)}` },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <p className="text-xs text-dark-400 mb-1">{s.label}</p>
            <p className="text-lg font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Price Chart</h2>
          <div className="flex gap-2">
            {["daily", "weekly", "monthly"].map((intv) => (
              <button
                key={intv}
                onClick={() => setInterval(intv)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  interval === intv
                    ? "bg-primary-600 text-white"
                    : "bg-dark-700 text-dark-400 hover:text-white"
                }`}
              >
                {intv.charAt(0).toUpperCase() + intv.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <StockChart data={history} label={`${symbol} Price`} />
      </div>

      {/* AI Analysis */}
      {aiAnalysis && (
        <div className="glass-card p-6 mb-8 animate-fade-in">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FiCpu className="text-primary-400" />
            AI Analysis for {symbol}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recommendation */}
            <div className="bg-dark-800 rounded-xl p-4">
              <p className="text-sm text-dark-400 mb-2">AI Recommendation</p>
              <div className="flex items-center gap-3">
                <span
                  className={`text-2xl font-bold ${
                    aiAnalysis.recommendation?.includes("Buy")
                      ? "text-emerald-400"
                      : aiAnalysis.recommendation?.includes("Sell")
                        ? "text-red-400"
                        : "text-yellow-400"
                  }`}
                >
                  {aiAnalysis.recommendation || "N/A"}
                </span>
                <span className="badge-blue">
                  {aiAnalysis.confidenceScore || 0}% confidence
                </span>
              </div>
            </div>

            {/* Risk */}
            <div className="bg-dark-800 rounded-xl p-4">
              <p className="text-sm text-dark-400 mb-2">Risk Assessment</p>
              <span
                className={`text-2xl font-bold ${
                  aiAnalysis.riskLevel === "Low"
                    ? "text-emerald-400"
                    : aiAnalysis.riskLevel === "High"
                      ? "text-red-400"
                      : "text-yellow-400"
                }`}
              >
                {aiAnalysis.riskLevel || "N/A"}
              </span>
            </div>

            {/* Key Levels */}
            <div className="bg-dark-800 rounded-xl p-4">
              <p className="text-sm text-dark-400 mb-2">Key Levels</p>
              <div className="flex gap-4">
                <div>
                  <p className="text-xs text-dark-400">Support</p>
                  <p className="font-bold text-emerald-400">
                    {aiAnalysis.support || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-dark-400">Resistance</p>
                  <p className="font-bold text-red-400">
                    {aiAnalysis.resistance || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Sentiment */}
            <div className="bg-dark-800 rounded-xl p-4">
              <p className="text-sm text-dark-400 mb-2">News Sentiment</p>
              <span
                className={`text-lg font-bold ${
                  aiAnalysis.newsSentiment === "Bullish"
                    ? "text-emerald-400"
                    : aiAnalysis.newsSentiment === "Bearish"
                      ? "text-red-400"
                      : "text-yellow-400"
                }`}
              >
                {aiAnalysis.newsSentiment || "N/A"}
              </span>
              <p className="text-xs text-dark-400 mt-1">
                {aiAnalysis.sentimentExplanation || ""}
              </p>
            </div>
          </div>

          {/* Technical Summary */}
          <div className="mt-4 bg-dark-800 rounded-xl p-4">
            <p className="text-sm text-dark-400 mb-2">Technical Summary</p>
            <p className="text-sm">{aiAnalysis.technicalSummary || "N/A"}</p>
          </div>

          {/* Outlook */}
          <div className="mt-4 bg-dark-800 rounded-xl p-4">
            <p className="text-sm text-dark-400 mb-2">Short-Term Outlook (1 Week)</p>
            <p className="text-sm">{aiAnalysis.shortTermOutlook || "N/A"}</p>
          </div>

          <p className="text-xs text-dark-500 mt-4 flex items-center gap-1">
            <FiInfo size={12} />
            AI analysis is for educational purposes only. Not financial advice.
          </p>
        </div>
      )}

      {/* Sentiment Meter */}
      {sentiment && (
        <div className="mb-8 animate-fade-in">
          <SentimentMeter score={sentiment.score} sentiment={sentiment.overallSentiment} />
          {sentiment.summary && (
            <p className="text-sm text-dark-400 mt-2 text-center">{sentiment.summary}</p>
          )}
        </div>
      )}

      {/* Company Info */}
      {profile && profile.name && (
        <div className="glass-card p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">About {profile.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {profile.country && (
              <div>
                <p className="text-dark-400">Country</p>
                <p className="font-medium">{profile.country}</p>
              </div>
            )}
            {profile.currency && (
              <div>
                <p className="text-dark-400">Currency</p>
                <p className="font-medium">{profile.currency}</p>
              </div>
            )}
            {profile.marketCapitalization && (
              <div>
                <p className="text-dark-400">Market Cap</p>
                <p className="font-medium">
                  ${(profile.marketCapitalization / 1000).toFixed(1)}B
                </p>
              </div>
            )}
            {profile.ipo && (
              <div>
                <p className="text-dark-400">IPO Date</p>
                <p className="font-medium">{profile.ipo}</p>
              </div>
            )}
          </div>
          {profile.weburl && (
            <a
              href={profile.weburl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 text-sm hover:underline mt-3 inline-block"
            >
              {profile.weburl} →
            </a>
          )}
        </div>
      )}

      {/* Company News */}
      {news.length > 0 && (
        <div>
          <h2 className="section-title">Recent News</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.slice(0, 6).map((article, i) => (
              <NewsCard key={i} article={article} />
            ))}
          </div>
        </div>
      )}

      {/* Trade Modal */}
      {tradeModal && quote && (
        <TradeModal
          stock={{ symbol: symbol.toUpperCase(), price: quote.price }}
          onClose={() => setTradeModal(false)}
          onTradeComplete={fetchStockData}
        />
      )}
    </div>
  );
};

export default StockDetail;