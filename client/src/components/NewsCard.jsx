import { FiExternalLink, FiClock } from "react-icons/fi";

const NewsCard = ({ article }) => {
  const timeAgo = (timestamp) => {
    const seconds = Math.floor(
      (Date.now() - (timestamp * 1000 || new Date(timestamp).getTime())) / 1000
    );
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card overflow-hidden hover:border-primary-500/40 transition-all duration-300 group block"
    >
      {article.image && (
        <div className="h-40 overflow-hidden">
          <img
            src={article.image}
            alt={article.headline}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => (e.target.style.display = "none")}
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-2">
          <span className="badge-blue text-xs">{article.source}</span>
          <span className="text-xs text-dark-400 flex items-center gap-1">
            <FiClock size={10} />
            {timeAgo(article.datetime)}
          </span>
        </div>
        <h3 className="font-semibold text-sm text-white group-hover:text-primary-400 transition-colors line-clamp-2 mb-2">
          {article.headline}
        </h3>
        <p className="text-xs text-dark-400 line-clamp-2">{article.summary}</p>
        <div className="flex items-center space-x-1 text-primary-400 text-xs mt-3 font-medium">
          <span>Read more</span>
          <FiExternalLink size={12} />
        </div>
      </div>
    </a>
  );
};

export default NewsCard;