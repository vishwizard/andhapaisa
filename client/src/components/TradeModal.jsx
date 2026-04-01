import { useState } from "react";
import { FiX, FiMinus, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const TradeModal = ({ stock, onClose, onTradeComplete }) => {
  const { user, refreshUser } = useAuth();
  const [type, setType] = useState("BUY");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const total = stock.price * quantity;
  const holding = user?.holdings?.find((h) => h.symbol === stock.symbol);
  const maxBuyQty = Math.floor((user?.balance || 0) / stock.price);
  const maxSellQty = holding?.quantity || 0;

  const handleTrade = async () => {
    if (quantity <= 0) return toast.error("Enter a valid quantity");

    if (type === "BUY" && total > user.balance) {
      return toast.error("Insufficient balance");
    }
    if (type === "SELL" && quantity > maxSellQty) {
      return toast.error(`You only have ${maxSellQty} shares`);
    }

    setLoading(true);
    try {
      const endpoint = type === "BUY" ? "/trading/buy" : "/trading/sell";
      const { data } = await api.post(endpoint, {
        symbol: stock.symbol,
        quantity,
      });

      toast.success(data.message);

      if (data.newAchievements?.length > 0) {
        data.newAchievements.forEach((a) => {
          toast.success(`🏆 Achievement: ${a.title}!`, { duration: 5000 });
        });
      }

      await refreshUser();
      onTradeComplete?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Trade failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md p-6 animate-slide-up">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">{stock.symbol}</h2>
            <p className="text-sm text-dark-400">${stock.price?.toFixed(2)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-700 rounded-lg transition"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Buy/Sell Toggle */}
        <div className="flex bg-dark-800 rounded-xl p-1 mb-6">
          <button
            onClick={() => setType("BUY")}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              type === "BUY"
                ? "bg-emerald-600 text-white shadow-lg"
                : "text-dark-400 hover:text-white"
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setType("SELL")}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              type === "SELL"
                ? "bg-red-600 text-white shadow-lg"
                : "text-dark-400 hover:text-white"
            }`}
          >
            Sell
          </button>
        </div>

        {/* Quantity */}
        <div className="mb-6">
          <label className="text-sm text-dark-400 mb-2 block">Quantity</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-3 bg-dark-700 rounded-xl hover:bg-dark-600 transition"
            >
              <FiMinus size={16} />
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="input-field text-center text-xl font-bold"
              min="1"
            />
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-3 bg-dark-700 rounded-xl hover:bg-dark-600 transition"
            >
              <FiPlus size={16} />
            </button>
          </div>
          <div className="flex justify-between mt-2 text-xs text-dark-400">
            <span>
              Max: {type === "BUY" ? maxBuyQty : maxSellQty} shares
            </span>
            {type === "BUY" && (
              <button
                onClick={() => setQuantity(maxBuyQty)}
                className="text-primary-400 hover:underline"
              >
                Max Buy
              </button>
            )}
            {type === "SELL" && maxSellQty > 0 && (
              <button
                onClick={() => setQuantity(maxSellQty)}
                className="text-primary-400 hover:underline"
              >
                Sell All
              </button>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-dark-800 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-dark-400">Price per share</span>
            <span className="font-medium">${stock.price?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-dark-400">Quantity</span>
            <span className="font-medium">{quantity}</span>
          </div>
          <hr className="border-dark-600" />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span
              className={type === "BUY" ? "text-emerald-400" : "text-red-400"}
            >
              ${total.toFixed(2)}
            </span>
          </div>
          {type === "BUY" && (
            <p className="text-xs text-dark-400">
              Balance after: $
              {(user.balance - total).toFixed(2)}
            </p>
          )}
          {type === "SELL" && holding && (
            <p className="text-xs text-dark-400">
              Est. P&L: $
              {((stock.price - holding.avgPrice) * quantity).toFixed(2)}
            </p>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleTrade}
          disabled={loading}
          className={`w-full py-3.5 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50 ${
            type === "BUY"
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {loading
            ? "Processing..."
            : `${type === "BUY" ? "Buy" : "Sell"} ${stock.symbol}`}
        </button>
      </div>
    </div>
  );
};

export default TradeModal;