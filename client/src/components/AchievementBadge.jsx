const AchievementBadge = ({ achievement, size = "md" }) => {
  const sizes = {
    sm: "w-10 h-10 text-lg",
    md: "w-14 h-14 text-2xl",
    lg: "w-20 h-20 text-3xl",
  };

  return (
    <div className="flex flex-col items-center text-center group">
      <div
        className={`${sizes[size]} bg-dark-700 rounded-2xl flex items-center justify-center border border-dark-600 group-hover:border-primary-500/50 group-hover:bg-dark-600 transition-all duration-300`}
        title={achievement.description}
      >
        {achievement.icon}
      </div>
      <span className="text-xs text-dark-400 mt-1.5 max-w-[80px] truncate">
        {achievement.title}
      </span>
    </div>
  );
};

export default AchievementBadge;