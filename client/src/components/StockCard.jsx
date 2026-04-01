import { Link } from "react-router-dom";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

const StockCard = ({ stock }) => {
  const isPositive = stock.change >= 0;

  return (
    <Link
      to={`/stock/${stock.symbol}`}
      className="glass-card p-4 hover:border-primary-500/40 transition-all duration-300 group block"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-white group-hover:text-primary-400 transition-colors">
            {stock.symbol}
          </h3>
          <p className="text-xs text-dark-400 truncate max-w-[120px]">
            {stock.name || stock.symbol}
          </p>
        </div>
        <div
          className={`p-2 rounded-lg ${
            isPositive ? "bg-emerald-500/10" : "bg-red-500/10"
          }`}
        >
          {isPositive ? (
            <FiTrendingUp className="text-emerald-400" size={16} />
          ) : (
            <FiTrendingDown className="text-red-400" size={16} />
          )}
        </div>
      </div>
      <div className="flex justify-between items-end">
        <span className="text-lg font-bold text-white">
          ${stock.price?.toFixed(2)}
        </span>
        <span
          className={`text-sm font-semibold ${
            isPositive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {stock.changePercent?.toFixed(2)}%
        </span>
      </div>
    </Link>
  );
};

export default StockCard;