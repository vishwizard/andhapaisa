import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PortfolioPieChart from "../components/PortfolioPieChart";
import AchievementBadge from "../components/AchievementBadge";
import TradeModal from "../components/TradeModal";
import toast from "react-hot-toast";
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiTarget,
  FiCpu,
  FiRefreshCw,
} from "react-icons/fi";

const Portfolio = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [tradeModal, setTradeModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("holdings");

  useEffect(() => {
    fetchPortfolio();
    fetchTransactions();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const { data } = await api.get("/portfolio");
      setPortfolio(data);
    } catch (err) {
      toast.error("Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await api.get("/trading/history?limit=50");
      setTransactions(data.transactions);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAIInsights = async () => {
    setInsightsLoading(true);
    try {
      const { data } = await api.get("/ai/portfolio-insights");
      setAiInsights(data);
    } catch {
      toast.error("AI insights failed");
    } finally {
      setInsightsLoading(false);
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

  const stats = [
    {
      label: "Cash Balance",
      value: `$${portfolio?.balance?.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: FiDollarSign,
      color: "text-blue-400",
    },
    {
      label: "Net Worth",
      value: `$${portfolio?.netWorth?.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: FiDollarSign,
      color: "text-emerald-400",
    },
    {
      label: "Total Return",
      value: `${portfolio?.overallReturn >= 0 ? "+" : ""} $${portfolio?.overallReturn?.toFixed(2)} (${portfolio?.overallReturnPercent?.toFixed(2)}%)`,
      icon: portfolio?.overallReturn >= 0 ? FiTrendingUp : FiTrendingDown,
      color: portfolio?.overallReturn >= 0 ? "text-emerald-400" : "text-red-400",
    },
    {
      label: "Win Rate",
      value: `${portfolio?.winRate}%`,
      icon: FiTarget,
      color: "text-yellow-400",
    },
  ];

  return (
    <div className="page-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <p className="text-dark-400">
            {portfolio?.holdings?.length || 0} holdings · {portfolio?.totalTrades || 0} trades
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchPortfolio} className="btn-secondary flex items-center gap-2">
            <FiRefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={fetchAIInsights}
            disabled={insightsLoading}
            className="btn-primary flex items-center gap-2"
          >
            <FiCpu size={16} />
            {insightsLoading ? "Analyzing..." : "AI Insights"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={stat.color} size={18} />
              <span className="text-xs text-dark-400">{stat.label}</span>
            </div>
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      {aiInsights && (
        <div className="glass-card p-6 mb-8 animate-fade-in">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FiCpu className="text-primary-400" /> AI Portfolio Insights
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-dark-800 rounded-xl p-4 text-center">
              <p className="text-xs text-dark-400 mb-1">Health Score</p>
              <p className="text-3xl font-bold text-primary-400">
                {aiInsights.healthScore}/100
              </p>
            </div>
            <div className="bg-dark-800 rounded-xl p-4 text-center">
              <p className="text-xs text-dark-400 mb-1">Diversification</p>
              <p className="text-lg font-bold">{aiInsights.diversification}</p>
            </div>
            <div className="bg-dark-800 rounded-xl p-4 text-center">
              <p className="text-xs text-dark-400 mb-1">Risk Profile</p>
              <p className="text-lg font-bold">{aiInsights.riskProfile}</p>
            </div>
            <div className="bg-dark-800 rounded-xl p-4 text-center">
              <p className="text-xs text-dark-400 mb-1">Sector Warning</p>
              <p className="text-sm">{aiInsights.sectorWarning || "None"}</p>
            </div>
          </div>
          {aiInsights.recommendation && (
            <div className="bg-primary-600/10 border border-primary-500/20 rounded-xl p-4">
              <p className="text-sm font-medium text-primary-400">💡 AI Recommendation</p>
              <p className="text-sm mt-1">{aiInsights.recommendation}</p>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {["holdings", "chart", "transactions", "achievements"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
              activeTab === tab
                ? "bg-primary-600 text-white"
                : "bg-dark-800 text-dark-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Holdings Tab */}
      {activeTab === "holdings" && (
        <>
          {portfolio?.holdings?.length > 0 ? (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-dark-400 border-b border-dark-700/50">
                      <th className="text-left py-4 px-4">Stock</th>
                      <th className="text-right py-4 px-4">Qty</th>
                      <th className="text-right py-4 px-4">Avg Cost</th>
                      <th className="text-right py-4 px-4">Current</th>
                      <th className="text-right py-4 px-4">Value</th>
                      <th className="text-right py-4 px-4">P&L</th>
                      <th className="text-right py-4 px-4">Day</th>
                      <th className="text-center py-4 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.holdings.map((h) => (
                      <tr
                        key={h.symbol}
                        className="border-b border-dark-800/50 hover:bg-dark-800/30 transition"
                      >
                        <td
                          className="py-4 px-4 font-bold cursor-pointer hover:text-primary-400"
                          onClick={() => navigate(`/stock/${h.symbol}`)}
                        >
                          {h.symbol}
                        </td>
                        <td className="py-4 px-4 text-right">{h.quantity}</td>
                        <td className="py-4 px-4 text-right">
                          ${h.avgPrice?.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          ${h.currentPrice?.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-right font-medium">
                          ${h.currentValue?.toFixed(2)}
                        </td>
                        <td
                          className={`py-4 px-4 text-right font-semibold ${
                            h.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {h.pnl >= 0 ? "+" : ""}${h.pnl?.toFixed(2)}
                          <span className="text-xs ml-1">
                            ({h.pnlPercent?.toFixed(1)}%)
                          </span>
                        </td>
                        <td
                          className={`py-4 px-4 text-right text-sm ${
                            h.dayChange >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {h.dayChangePercent?.toFixed(2)}%
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() =>
                              setTradeModal({
                                symbol: h.symbol,
                                price: h.currentPrice,
                              })
                            }
                            className="text-xs btn-secondary py-1.5 px-3"
                          >
                            Trade
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <span className="text-5xl mb-4 block">📭</span>
              <h3 className="text-xl font-bold mb-2">No Holdings Yet</h3>
              <p className="text-dark-400 mb-4">
                Start trading to build your portfolio!
              </p>
              <button
                onClick={() => navigate("/screener")}
                className="btn-primary"
              >
                Browse Stocks
              </button>
            </div>
          )}
        </>
      )}

      {/* Chart Tab */}
      {activeTab === "chart" && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4">Portfolio Allocation</h2>
          <PortfolioPieChart holdings={portfolio?.holdings || []} />
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <div className="glass-card overflow-hidden">
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-dark-400 border-b border-dark-700/50">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">Symbol</th>
                    <th className="text-right py-3 px-4">Qty</th>
                    <th className="text-right py-3 px-4">Price</th>
                    <th className="text-right py-3 px-4">Total</th>
                    <th className="text-right py-3 px-4">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr
                      key={t._id}
                      className="border-b border-dark-800/50 hover:bg-dark-800/30 transition text-sm"
                    >
                      <td className="py-3 px-4 text-dark-400">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={
                            t.type === "BUY" ? "badge-green" : "badge-red"
                          }
                        >
                          {t.type}
                        </span>
                      </td>
                      <td
                        className="py-3 px-4 font-bold cursor-pointer hover:text-primary-400"
                        onClick={() => navigate(`/stock/${t.symbol}`)}
                      >
                        {t.symbol}
                      </td>
                      <td className="py-3 px-4 text-right">{t.quantity}</td>
                      <td className="py-3 px-4 text-right">
                        ${t.price?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        ${t.total?.toFixed(2)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-medium ${
                          t.type === "SELL"
                            ? t.pnl >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                            : "text-dark-500"
                        }`}
                      >
                        {t.type === "SELL"
                          ? `${t.pnl >= 0 ? "+" : ""} $${t.pnl?.toFixed(2)}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-dark-400">
              No transactions yet
            </div>
          )}
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === "achievements" && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-6">
            Achievements ({user?.achievements?.length || 0})
          </h2>
          {user?.achievements?.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
              {user.achievements.map((a) => (
                <AchievementBadge key={a.id} achievement={a} />
              ))}
            </div>
          ) : (
            <p className="text-dark-400 text-center py-8">
              Make your first trade to earn achievements! 🏆
            </p>
          )}
        </div>
      )}

      {/* Trade Modal */}
      {tradeModal && (
        <TradeModal
          stock={tradeModal}
          onClose={() => setTradeModal(null)}
          onTradeComplete={() => {
            fetchPortfolio();
            fetchTransactions();
          }}
        />
      )}
    </div>
  );
};

export default Portfolio;