import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import StockCard from "../components/StockCard";
import NewsCard from "../components/NewsCard";
import {
  FiTrendingUp,
  FiDollarSign,
  FiActivity,
  FiAward,
  FiSearch,
  FiArrowRight,
  FiPieChart,
  FiTarget,
} from "react-icons/fi";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);
  const [news, setNews] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [trendingRes, newsRes, portfolioRes] = await Promise.allSettled([
        api.get("/stocks/trending"),
        api.get("/news/market"),
        api.get("/portfolio"),
      ]);

      if (trendingRes.status === "fulfilled") setTrending(trendingRes.value.data);
      if (newsRes.status === "fulfilled") setNews(newsRes.value.data.slice(0, 6));
      if (portfolioRes.status === "fulfilled") setPortfolio(portfolioRes.value.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await api.get(`/stocks/search?q=${query}`);
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const stats = [
    {
      label: "Net Worth",
      value: `$${(portfolio?.netWorth || user?.balance || 100000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: FiDollarSign,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Total P&L",
      value: `${(portfolio?.overallReturn || 0) >= 0 ? "+" : ""} $${(portfolio?.overallReturn || 0).toFixed(2)}`,
      icon: FiTrendingUp,
      color: (portfolio?.overallReturn || 0) >= 0 ? "text-emerald-400" : "text-red-400",
      bgColor: (portfolio?.overallReturn || 0) >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
    },
    {
      label: "Total Trades",
      value: portfolio?.totalTrades || user?.totalTrades || 0,
      icon: FiActivity,
      color: "text-primary-400",
      bgColor: "bg-primary-500/10",
    },
    {
      label: "Win Rate",
      value: `${portfolio?.winRate || 0}%`,
      icon: FiTarget,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
    },
  ];

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            Welcome back, {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-dark-400">
            Level {user?.level || 1} Trader · {user?.xp || 0} XP
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search stocks (e.g., AAPL, Tesla)"
            className="input-field pl-11 pr-4"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 glass-card max-h-64 overflow-y-auto z-40">
              {searchResults.map((result) => (
                <button
                  key={result.symbol}
                  onClick={() => {
                    navigate(`/stock/${result.symbol}`);
                    setSearchResults([]);
                    setSearchQuery("");
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-dark-700/50 transition flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-white">{result.symbol}</span>
                    <p className="text-xs text-dark-400 truncate max-w-[200px]">{result.name}</p>
                  </div>
                  <FiArrowRight className="text-dark-400" size={14} />
                </button>
              ))}
            </div>
          )}
          {searching && (
            <div className="absolute top-full left-0 right-0 mt-2 glass-card p-4 text-center text-dark-400 z-40">
              Searching...
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-dark-400">{stat.label}</span>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={stat.color} size={18} />
              </div>
            </div>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* XP Progress Bar */}
      <div className="glass-card p-5 mb-8">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <FiAward className="text-yellow-400" size={20} />
            <span className="font-semibold">Level {user?.level || 1}</span>
          </div>
          <span className="text-sm text-dark-400">
            {user?.xp || 0} / {((user?.level || 1) * 200)} XP
          </span>
        </div>
        <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(
                ((user?.xp || 0) % 200) / 200 * 100,
                100
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link
          to="/portfolio"
          className="glass-card p-4 hover:border-primary-500/40 transition-all text-center group"
        >
          <FiPieChart className="mx-auto mb-2 text-primary-400 group-hover:scale-110 transition-transform" size={24} />
          <span className="text-sm font-medium">My Portfolio</span>
        </Link>
        <Link
          to="/ai-advisor"
          className="glass-card p-4 hover:border-purple-500/40 transition-all text-center group"
        >
          <span className="block text-2xl mb-1 group-hover:scale-110 transition-transform">🤖</span>
          <span className="text-sm font-medium">AI Advisor</span>
        </Link>
        <Link
          to="/leaderboard"
          className="glass-card p-4 hover:border-yellow-500/40 transition-all text-center group"
        >
          <FiAward className="mx-auto mb-2 text-yellow-400 group-hover:scale-110 transition-transform" size={24} />
          <span className="text-sm font-medium">Leaderboard</span>
        </Link>
        <Link
          to="/screener"
          className="glass-card p-4 hover:border-cyan-500/40 transition-all text-center group"
        >
          <FiSearch className="mx-auto mb-2 text-cyan-400 group-hover:scale-110 transition-transform" size={24} />
          <span className="text-sm font-medium">Stock Screener</span>
        </Link>
      </div>

      {/* Holdings Summary */}
      {portfolio?.holdings?.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-title mb-0">Your Holdings</h2>
            <Link to="/portfolio" className="text-primary-400 text-sm hover:underline flex items-center gap-1">
              View All <FiArrowRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-dark-400 border-b border-dark-700/50">
                  <th className="text-left py-3 px-4">Symbol</th>
                  <th className="text-right py-3 px-4">Qty</th>
                  <th className="text-right py-3 px-4">Avg Price</th>
                  <th className="text-right py-3 px-4">Current</th>
                  <th className="text-right py-3 px-4">P&L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.holdings.slice(0, 5).map((h) => (
                  <tr
                    key={h.symbol}
                    className="border-b border-dark-800/50 hover:bg-dark-800/30 cursor-pointer transition"
                    onClick={() => navigate(`/stock/${h.symbol}`)}
                  >
                    <td className="py-3 px-4 font-bold">{h.symbol}</td>
                    <td className="py-3 px-4 text-right">{h.quantity}</td>
                    <td className="py-3 px-4 text-right">${h.avgPrice?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">${h.currentPrice?.toFixed(2)}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${h.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {h.pnl >= 0 ? "+" : ""}${h.pnl?.toFixed(2)}
                      <span className="text-xs ml-1">({h.pnlPercent?.toFixed(1)}%)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trending Stocks */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-title mb-0">🔥 Trending Stocks</h2>
          <Link to="/screener" className="text-primary-400 text-sm hover:underline flex items-center gap-1">
            View All <FiArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {trending.slice(0, 12).map((stock) => (
            <StockCard key={stock.symbol} stock={stock} />
          ))}
        </div>
        {trending.length === 0 && (
          <div className="glass-card p-8 text-center text-dark-400">
            Loading trending stocks...
          </div>
        )}
      </div>

      {/* Market News */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-title mb-0">📰 Market News</h2>
          <Link to="/news" className="text-primary-400 text-sm hover:underline flex items-center gap-1">
            View All <FiArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {news.map((article, i) => (
            <NewsCard key={i} article={article} />
          ))}
        </div>
        {news.length === 0 && (
          <div className="glass-card p-8 text-center text-dark-400">
            Loading market news...
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;