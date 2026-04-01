import { useState, useEffect } from "react";
import api from "../services/api";
import NewsCard from "../components/NewsCard";
import SentimentMeter from "../components/SentimentMeter";
import toast from "react-hot-toast";
import { FiCpu, FiRefreshCw } from "react-icons/fi";

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentiment, setSentiment] = useState(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [category, setCategory] = useState("general");

  useEffect(() => {
    fetchNews();
  }, [category]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/news/market?category=${category}`);
      setNews(data);
    } catch {
      toast.error("Failed to load news");
    } finally {
      setLoading(false);
    }
  };

  const analyzeSentiment = async () => {
    if (news.length === 0) return;
    setSentimentLoading(true);
    try {
      const headlines = news.slice(0, 15).map((n) => n.headline);
      const { data } = await api.post("/ai/sentiment", { headlines });
      setSentiment(data);
    } catch {
      toast.error("Sentiment analysis failed");
    } finally {
      setSentimentLoading(false);
    }
  };

  const categories = [
    { value: "general", label: "General" },
    { value: "forex", label: "Forex" },
    { value: "crypto", label: "Crypto" },
    { value: "merger", label: "Mergers" },
  ];

  return (
    <div className="page-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">📰 Market News</h1>
          <p className="text-dark-400">
            Stay informed with the latest market news
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={analyzeSentiment}
            disabled={sentimentLoading || news.length === 0}
            className="btn-primary flex items-center gap-2"
          >
            <FiCpu size={16} />
            {sentimentLoading ? "Analyzing..." : "AI Sentiment"}
          </button>
          <button
            onClick={fetchNews}
            className="btn-secondary flex items-center gap-2"
          >
            <FiRefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => {
              setCategory(cat.value);
              setSentiment(null);
            }}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              category === cat.value
                ? "bg-primary-600 text-white"
                : "bg-dark-800 text-dark-400 hover:text-white"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sentiment */}
      {sentiment && (
        <div className="mb-8 max-w-md animate-fade-in">
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

      {/* News Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((article, i) => (
            <NewsCard key={i} article={article} />
          ))}
        </div>
      )}

      {!loading && news.length === 0 && (
        <div className="glass-card p-12 text-center">
          <span className="text-5xl block mb-4">📰</span>
          <h3 className="text-xl font-bold mb-2">No News Available</h3>
          <p className="text-dark-400">Try a different category or refresh</p>
        </div>
      )}
    </div>
  );
};

export default News;