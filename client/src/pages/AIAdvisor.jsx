import { useState, useEffect } from "react";
import api from "../services/api";
import SentimentMeter from "../components/SentimentMeter";
import toast from "react-hot-toast";
import {
  FiCpu,
  FiSearch,
  FiTrendingUp,
  FiTrendingDown,
  FiShield,
  FiTarget,
  FiInfo,
  FiZap,
} from "react-icons/fi";

const AIAdvisor = () => {
  const [symbol, setSymbol] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [portfolioInsights, setPortfolioInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState("");

  const handleSearch = async (query) => {
    setSymbol(query);
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }
    try {
      const { data } = await api.get(`/stocks/search?q=${query}`);
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    }
  };

  const analyzeStock = async (sym) => {
    setActiveSymbol(sym.toUpperCase());
    setSymbol(sym.toUpperCase());
    setSearchResults([]);
    setLoading(true);
    setAnalysis(null);
    setSentiment(null);

    try {
      const { data } = await api.get(`/ai/analyze/${sym}`);
      setAnalysis(data.analysis);
      setStockData(data.stockData);

      // Get news sentiment too
      try {
        const newsRes = await api.get(`/news/company/${sym}`);
        if (newsRes.data?.length > 0) {
          const headlines = newsRes.data.slice(0, 10).map((n) => n.headline);
          const sentimentRes = await api.post("/ai/sentiment", { headlines });
          setSentiment(sentimentRes.data);
        }
      } catch {
        // Sentiment optional
      }
    } catch (err) {
      toast.error("AI analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioInsights = async () => {
    setInsightsLoading(true);
    try {
      const { data } = await api.get("/ai/portfolio-insights");
      setPortfolioInsights(data);
    } catch {
      toast.error("Failed to get portfolio insights");
    } finally {
      setInsightsLoading(false);
    }
  };

  const getRecommendationColor = (rec) => {
    if (!rec) return "text-dark-400";
    if (rec.includes("Strong Buy")) return "text-emerald-400";
    if (rec.includes("Buy")) return "text-emerald-400";
    if (rec.includes("Strong Sell")) return "text-red-400";
    if (rec.includes("Sell")) return "text-red-400";
    return "text-yellow-400";
  };

  const getRiskColor = (risk) => {
    if (risk === "Low") return "text-emerald-400";
    if (risk === "High") return "text-red-400";
    return "text-yellow-400";
  };

  const quickStocks = ["AAPL", "GOOGL", "TSLA", "MSFT", "AMZN", "NVDA", "META", "NFLX"];

  return (
    <div className="page-container">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600/20 mb-4">
          <FiCpu className="text-primary-400" size={32} />
        </div>
        <h1 className="text-3xl font-bold mb-2">AI Stock Advisor</h1>
        <p className="text-dark-400 max-w-lg mx-auto">
          Get AI-powered analysis, sentiment scoring, risk assessment, and
          personalized recommendations powered by Google Gemini
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <FiSearch
            className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400"
            size={20}
          />
          <input
            type="text"
            value={symbol}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && symbol.trim()) {
                analyzeStock(symbol.trim());
              }
            }}
            placeholder="Enter stock symbol (e.g., AAPL, TSLA)..."
            className="input-field pl-12 pr-32 py-4 text-lg"
          />
          <button
            onClick={() => symbol.trim() && analyzeStock(symbol.trim())}
            disabled={loading || !symbol.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary px-6 disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 glass-card max-h-64 overflow-y-auto z-40">
              {searchResults.map((r) => (
                <button
                  key={r.symbol}
                  onClick={() => analyzeStock(r.symbol)}
                  className="w-full text-left px-4 py-3 hover:bg-dark-700/50 transition flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold">{r.symbol}</span>
                    <p className="text-xs text-dark-400">{r.name}</p>
                  </div>
                  <FiCpu className="text-primary-400" size={14} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Select */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {quickStocks.map((s) => (
            <button
              key={s}
              onClick={() => analyzeStock(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeSymbol === s
                  ? "bg-primary-600 text-white"
                  : "bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Portfolio Insights Button */}
      <div className="text-center mb-8">
        <button
          onClick={fetchPortfolioInsights}
          disabled={insightsLoading}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <FiZap size={16} />
          {insightsLoading
            ? "Analyzing Portfolio..."
            : "Get AI Portfolio Insights"}
        </button>
      </div>

      {/* Portfolio Insights */}
      {portfolioInsights && (
        <div className="glass-card p-6 mb-8 max-w-4xl mx-auto animate-fade-in">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FiZap className="text-yellow-400" />
            AI Portfolio Insights
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-dark-800 rounded-xl p-4 text-center">
              <p className="text-xs text-dark-400 mb-1">Health Score</p>
              <p
                className={`text-3xl font-bold ${
                  portfolioInsights.healthScore >= 70
                    ? "text-emerald-400"
                    : portfolioInsights.healthScore >= 40
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                {portfolioInsights.healthScore}
              </p>
              <p className="text-xs text-dark-400">out of 100</p>
            </div>
            <div className="bg-dark-800 rounded-xl p-4 text-center">
              <p className="text-xs text-dark-400 mb-1">Diversification</p>
              <p className="text-lg font-bold">
                {portfolioInsights.diversification}
              </p>
            </div>
            <div className="bg-dark-800 rounded-xl p-4 text-center">
              <p className="text-xs text-dark-400 mb-1">Risk Profile</p>
              <p
                className={`text-lg font-bold ${
                  portfolioInsights.riskProfile === "Conservative"
                    ? "text-emerald-400"
                    : portfolioInsights.riskProfile === "Aggressive"
                      ? "text-red-400"
                      : "text-yellow-400"
                }`}
              >
                {portfolioInsights.riskProfile}
              </p>
            </div>
            <div className="bg-dark-800 rounded-xl p-4 text-center">
              <p className="text-xs text-dark-400 mb-1">Sector Warning</p>
              <p className="text-sm">{portfolioInsights.sectorWarning || "None ✅"}</p>
            </div>
          </div>
          {portfolioInsights.recommendation && (
            <div className="bg-primary-600/10 border border-primary-500/20 rounded-xl p-4">
              <p className="text-sm font-medium text-primary-400 mb-1">
                💡 AI Recommendation
              </p>
              <p className="text-sm text-gray-200">
                {portfolioInsights.recommendation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-12 text-center animate-pulse">
            <div className="w-16 h-16 rounded-2xl bg-primary-600/20 mx-auto mb-4 flex items-center justify-center">
              <FiCpu className="text-primary-400 animate-spin" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">
              Analyzing {activeSymbol}...
            </h3>
            <p className="text-dark-400">
              AI is crunching market data, news sentiment, and technical
              indicators
            </p>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !loading && (
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Stock Header */}
          {stockData && (
            <div className="glass-card p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{activeSymbol}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-3xl font-bold">
                      ${stockData.price?.toFixed(2)}
                    </span>
                    <span
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-semibold ${
                        stockData.change >= 0
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {stockData.change >= 0 ? (
                        <FiTrendingUp size={14} />
                      ) : (
                        <FiTrendingDown size={14} />
                      )}
                      {stockData.change >= 0 ? "+" : ""}
                      {stockData.changePercent?.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Big Recommendation */}
                <div className="text-right">
                  <p className="text-xs text-dark-400 mb-1">AI Verdict</p>
                  <p
                    className={`text-3xl font-extrabold ${getRecommendationColor(
                      analysis.recommendation
                    )}`}
                  >
                    {analysis.recommendation || "N/A"}
                  </p>
                  <p className="text-sm text-dark-400">
                    {analysis.confidenceScore || 0}% confidence
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Risk */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <FiShield className={getRiskColor(analysis.riskLevel)} size={20} />
                <span className="text-sm text-dark-400">Risk Assessment</span>
              </div>
              <p className={`text-2xl font-bold ${getRiskColor(analysis.riskLevel)}`}>
                {analysis.riskLevel || "N/A"}
              </p>
            </div>

            {/* Key Levels */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <FiTarget className="text-primary-400" size={20} />
                <span className="text-sm text-dark-400">Key Levels</span>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-dark-400">Support</p>
                  <p className="text-lg font-bold text-emerald-400">
                    {analysis.support || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-dark-400">Resistance</p>
                  <p className="text-lg font-bold text-red-400">
                    {analysis.resistance || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Sentiment */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <FiTrendingUp className="text-yellow-400" size={20} />
                <span className="text-sm text-dark-400">News Sentiment</span>
              </div>
              <p
                className={`text-2xl font-bold ${
                  analysis.newsSentiment === "Bullish"
                    ? "text-emerald-400"
                    : analysis.newsSentiment === "Bearish"
                      ? "text-red-400"
                      : "text-yellow-400"
                }`}
              >
                {analysis.newsSentiment || "N/A"}
              </p>
            </div>
          </div>

          {/* Sentiment Meter */}
          {sentiment && (
            <div className="mb-6">
              <SentimentMeter
                score={sentiment.score}
                sentiment={sentiment.overallSentiment}
              />
              {sentiment.summary && (
                <p className="text-sm text-dark-400 mt-2 text-center">
                  {sentiment.summary}
                </p>
              )}
            </div>
          )}

          {/* Detailed Analysis */}
          <div className="space-y-4 mb-6">
            {analysis.technicalSummary && (
              <div className="glass-card p-5">
                <h3 className="font-bold mb-2 text-sm text-dark-400">
                  📊 Technical Summary
                </h3>
                <p className="text-sm leading-relaxed">
                  {analysis.technicalSummary}
                </p>
              </div>
            )}

            {analysis.sentimentExplanation && (
              <div className="glass-card p-5">
                <h3 className="font-bold mb-2 text-sm text-dark-400">
                  📰 Sentiment Analysis
                </h3>
                <p className="text-sm leading-relaxed">
                  {analysis.sentimentExplanation}
                </p>
              </div>
            )}

            {analysis.shortTermOutlook && (
              <div className="glass-card p-5">
                <h3 className="font-bold mb-2 text-sm text-dark-400">
                  🔮 Short-Term Outlook (1 Week)
                </h3>
                <p className="text-sm leading-relaxed">
                  {analysis.shortTermOutlook}
                </p>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
            <FiInfo className="text-yellow-400 mt-0.5 shrink-0" size={18} />
            <p className="text-xs text-dark-400">
              <span className="text-yellow-400 font-medium">Disclaimer:</span>{" "}
              This AI analysis is generated for educational and paper trading
              purposes only. It does not constitute financial advice. Always do
              your own research before making real investment decisions.
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !loading && (
        <div className="max-w-2xl mx-auto glass-card p-12 text-center">
          <span className="text-6xl block mb-4">🤖</span>
          <h3 className="text-xl font-bold mb-2">
            Enter a stock symbol to get started
          </h3>
          <p className="text-dark-400">
            Our AI will analyze market data, news sentiment, and technical
            indicators to give you actionable insights
          </p>
        </div>
      )}
    </div>
  );
};

export default AIAdvisor;