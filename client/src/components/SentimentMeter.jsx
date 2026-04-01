const SentimentMeter = ({ score = 0, sentiment = "Neutral" }) => {
  // score: -100 to 100
  const normalizedScore = Math.max(-100, Math.min(100, score));
  const percentage = ((normalizedScore + 100) / 200) * 100;

  const getColor = () => {
    if (normalizedScore > 30) return "text-emerald-400";
    if (normalizedScore < -30) return "text-red-400";
    return "text-yellow-400";
  };

  const getBgGradient = () => {
    return "bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500";
  };

  return (
    <div className="glass-card p-4">
      <h4 className="text-sm font-medium text-dark-400 mb-3">
        Market Sentiment
      </h4>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-red-400">Bearish</span>
        <span className={`text-lg font-bold ${getColor()}`}>{sentiment}</span>
        <span className="text-xs text-emerald-400">Bullish</span>
      </div>
      <div className="relative h-3 rounded-full overflow-hidden bg-dark-700">
        <div className={`absolute inset-0 ${getBgGradient()} opacity-30`} />
        <div
          className="absolute top-0 bottom-0 w-4 bg-white rounded-full shadow-lg transform -translate-x-1/2 transition-all duration-700"
          style={{ left: `${percentage}%` }}
        />
      </div>
      <p className="text-center text-xs text-dark-400 mt-2">
        Score: {normalizedScore}
      </p>
    </div>
  );
};

export default SentimentMeter;