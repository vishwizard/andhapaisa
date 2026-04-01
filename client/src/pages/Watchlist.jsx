import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import TradeModal from "../components/TradeModal";
import toast from "react-hot-toast";
import {
  FiTrash2,
  FiTrendingUp,
  FiTrendingDown,
  FiPlus,
  FiSearch,
} from "react-icons/fi";

const Watchlist = () => {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tradeModal, setTradeModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const { data } = await api.get("/watchlist");
      setWatchlist(data);
    } catch {
      toast.error("Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (symbol) => {
    try {
      await api.delete(`/watchlist/${symbol}`);
      setWatchlist((prev) => prev.filter((w) => w.symbol !== symbol));
      toast.success("Removed from watchlist");
    } catch {
      toast.error("Failed to remove");
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
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

  const addToWatchlist = async (symbol, name) => {
    try {
      await api.post("/watchlist", { symbol, name });
      toast.success(`${symbol} added to watchlist! ⭐`);
      setSearchQuery("");
      setSearchResults([]);
      fetchWatchlist();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add");
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

  return (
    <div className="page-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Watchlist ⭐</h1>
          <p className="text-dark-400">{watchlist.length} stocks tracked</p>
        </div>

        {/* Add Stock Search */}
        <div className="relative w-full md:w-80">
          <FiSearch
            className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400"
            size={18}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search stocks to add..."
            className="input-field pl-11"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 glass-card max-h-64 overflow-y-auto z-40">
              {searchResults.map((r) => (
                <button
                  key={r.symbol}
                  onClick={() => addToWatchlist(r.symbol, r.name)}
                  className="w-full text-left px-4 py-3 hover:bg-dark-700/50 transition flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold">{r.symbol}</span>
                    <p className="text-xs text-dark-400 truncate max-w-[200px]">
                      {r.name}
                    </p>
                  </div>
                  <FiPlus className="text-primary-400" size={16} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {watchlist.length > 0 ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-dark-400 border-b border-dark-700/50">
                  <th className="text-left py-4 px-4">Symbol</th>
                  <th className="text-right py-4 px-4">Price</th>
                  <th className="text-right py-4 px-4">Change</th>
                  <th className="text-right py-4 px-4">High</th>
                  <th className="text-right py-4 px-4">Low</th>
                  <th className="text-center py-4 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((item) => {
                  const isPos = (item.change || 0) >= 0;
                  return (
                    <tr
                      key={item.symbol}
                      className="border-b border-dark-800/50 hover:bg-dark-800/30 transition"
                    >
                      <td
                        className="py-4 px-4 font-bold cursor-pointer hover:text-primary-400"
                        onClick={() => navigate(`/stock/${item.symbol}`)}
                      >
                        <div>
                          {item.symbol}
                          <p className="text-xs text-dark-400 font-normal">
                            {item.name}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-medium">
                        ${item.price?.toFixed(2) || "—"}
                      </td>
                      <td
                        className={`py-4 px-4 text-right font-semibold ${
                          isPos ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {isPos ? (
                            <FiTrendingUp size={14} />
                          ) : (
                            <FiTrendingDown size={14} />
                          )}
                          {item.changePercent?.toFixed(2) || 0}%
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right text-sm">
                        ${item.high?.toFixed(2) || "—"}
                      </td>
                      <td className="py-4 px-4 text-right text-sm">
                        ${item.low?.toFixed(2) || "—"}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() =>
                              setTradeModal({
                                symbol: item.symbol,
                                price: item.price,
                              })
                            }
                            className="text-xs btn-success py-1.5 px-3"
                          >
                            Trade
                          </button>
                          <button
                            onClick={() => removeFromWatchlist(item.symbol)}
                            className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <span className="text-5xl mb-4 block">⭐</span>
          <h3 className="text-xl font-bold mb-2">Your Watchlist is Empty</h3>
          <p className="text-dark-400 mb-4">
            Search for stocks above to start watching them
          </p>
        </div>
      )}

      {tradeModal && (
        <TradeModal
          stock={tradeModal}
          onClose={() => setTradeModal(null)}
          onTradeComplete={fetchWatchlist}
        />
      )}
    </div>
  );
};

export default Watchlist;