import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import StockCard from "../components/StockCard";
import TradeModal from "../components/TradeModal";
import {
  FiSearch,
  FiTrendingUp,
  FiTrendingDown,
  FiFilter,
} from "react-icons/fi";

const Screener = () => {
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [tradeModal, setTradeModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const { data } = await api.get("/stocks/trending");
      setTrending(data);
    } catch {
      console.error("Failed to fetch trending");
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
      // Fetch quotes for search results
      const withQuotes = await Promise.allSettled(
        data.slice(0, 8).map(async (stock) => {
          try {
            const quoteRes = await api.get(`/stocks/quote/${stock.symbol}`);
            return { ...stock, ...quoteRes.data };
          } catch {
            return stock;
          }
        })
      );
      setSearchResults(
        withQuotes
          .filter((r) => r.status === "fulfilled")
          .map((r) => r.value)
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const getSortedStocks = () => {
    const stocks = searchResults.length > 0 ? searchResults : trending;
    const sorted = [...stocks];

    switch (sortBy) {
      case "gainers":
        return sorted.sort(
          (a, b) => (b.changePercent || 0) - (a.changePercent || 0)
        );
      case "losers":
        return sorted.sort(
          (a, b) => (a.changePercent || 0) - (b.changePercent || 0)
        );
      case "price_high":
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "price_low":
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      default:
        return sorted;
    }
  };

  const watchlistSectors = [
    { label: "Tech Giants", symbols: ["AAPL", "GOOGL", "MSFT", "AMZN", "META"] },
    { label: "EV & Energy", symbols: ["TSLA", "RIVN", "NIO", "ENPH", "FSLR"] },
    { label: "Finance", symbols: ["JPM", "BAC", "GS", "MS", "V"] },
    { label: "Healthcare", symbols: ["JNJ", "PFE", "UNH", "ABBV", "MRK"] },
  ];

  return (
    <div className="page-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">🔍 Stock Screener</h1>
          <p className="text-dark-400">
            Discover and analyze stocks to trade
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xl mb-6">
        <FiSearch
          className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400"
          size={18}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search any stock (e.g., Apple, TSLA, Google)..."
          className="input-field pl-11 py-4"
        />
        {searching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <FiFilter className="text-dark-400 mt-2" size={16} />
        {[
          { value: "default", label: "Default" },
          { value: "gainers", label: "Top Gainers" },
          { value: "losers", label: "Top Losers" },
          { value: "price_high", label: "Price: High → Low" },
          { value: "price_low", label: "Price: Low → High" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setSortBy(f.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              sortBy === f.value
                ? "bg-primary-600 text-white"
                : "bg-dark-800 text-dark-400 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sector Quick Lists */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">Browse by Sector</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {watchlistSectors.map((sector) => (
            <div key={sector.label} className="glass-card p-4">
              <h3 className="font-semibold text-sm mb-3">{sector.label}</h3>
              <div className="flex flex-wrap gap-1.5">
                {sector.symbols.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => navigate(`/stock/${sym}`)}
                    className="bg-dark-700 hover:bg-primary-600/20 hover:text-primary-400 text-xs font-medium px-2.5 py-1 rounded-lg transition"
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stocks Grid */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {searchResults.length > 0
            ? `Search Results (${searchResults.length})`
            : "Popular Stocks"}
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {/* Table View */}
          <div className="glass-card overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-dark-400 border-b border-dark-700/50">
                    <th className="text-left py-3 px-4">Symbol</th>
                    <th className="text-right py-3 px-4">Price</th>
                    <th className="text-right py-3 px-4">Change</th>
                    <th className="text-right py-3 px-4">% Change</th>
                    <th className="text-right py-3 px-4">High</th>
                    <th className="text-right py-3 px-4">Low</th>
                    <th className="text-center py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedStocks().map((stock) => {
                    const isPos = (stock.change || 0) >= 0;
                    return (
                      <tr
                        key={stock.symbol}
                        className="border-b border-dark-800/50 hover:bg-dark-800/30 transition cursor-pointer"
                        onClick={() => navigate(`/stock/${stock.symbol}`)}
                      >
                        <td className="py-3 px-4 font-bold">{stock.symbol}</td>
                        <td className="py-3 px-4 text-right font-medium">
                          ${stock.price?.toFixed(2)}
                        </td>
                        <td
                          className={`py-3 px-4 text-right ${
                            isPos ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {isPos ? "+" : ""}
                          {stock.change?.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                              isPos
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {isPos ? (
                              <FiTrendingUp size={10} />
                            ) : (
                              <FiTrendingDown size={10} />
                            )}
                            {stock.changePercent?.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-sm">
                          ${stock.high?.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-sm">
                          ${stock.low?.toFixed(2)}
                        </td>
                        <td
                          className="py-3 px-4 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() =>
                              setTradeModal({
                                symbol: stock.symbol,
                                price: stock.price,
                              })
                            }
                            className="text-xs btn-success py-1.5 px-3"
                          >
                            Trade
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card Grid View */}
          <h2 className="text-lg font-bold mb-4">Card View</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {getSortedStocks().map((stock) => (
              <StockCard key={stock.symbol} stock={stock} />
            ))}
          </div>
        </>
      )}

      {tradeModal && (
        <TradeModal
          stock={tradeModal}
          onClose={() => setTradeModal(null)}
          onTradeComplete={() => {}}
        />
      )}
    </div>
  );
};

export default Screener;