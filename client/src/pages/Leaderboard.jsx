import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  FiAward,
  FiTrendingUp,
  FiActivity,
  FiZap,
} from "react-icons/fi";

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState("pnl");

  useEffect(() => {
    fetchLeaderboard();
  }, [sortType]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/leaderboard?type=${sortType}`);
      setLeaderboard(data);
    } catch {
      console.error("Leaderboard fetch error");
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const sortOptions = [
    { value: "pnl", label: "Profit & Loss", icon: FiTrendingUp },
    { value: "trades", label: "Total Trades", icon: FiActivity },
    { value: "level", label: "Level / XP", icon: FiZap },
  ];

  return (
    <div className="page-container">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🏆 Leaderboard</h1>
        <p className="text-dark-400">Compete with other traders worldwide</p>
      </div>

      {/* Sort Buttons */}
      <div className="flex justify-center gap-3 mb-8">
        {sortOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSortType(opt.value)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              sortType === opt.value
                ? "bg-primary-600 text-white shadow-lg shadow-primary-600/25"
                : "bg-dark-800 text-dark-400 hover:text-white"
            }`}
          >
            <opt.icon size={16} />
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className="flex justify-center items-end gap-4 mb-10">
              {[leaderboard[1], leaderboard[0], leaderboard[2]].map(
                (u, idx) => {
                  const isFirst = idx === 1;
                  return (
                    <div
                      key={u.rank}
                      className={`text-center ${isFirst ? "mb-4" : ""}`}
                    >
                      <div
                        className={`glass-card p-6 ${
                          isFirst
                            ? "border-yellow-500/40 shadow-yellow-500/10"
                            : ""
                        } ${isFirst ? "w-40" : "w-32"}`}
                      >
                        <span className="text-3xl block mb-2">
                          {getRankBadge(u.rank)}
                        </span>
                        <div
                          className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center text-lg font-bold mb-2 ${
                            isFirst
                              ? "bg-yellow-500 text-black"
                              : "bg-primary-600 text-white"
                          }`}
                        >
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-bold text-sm truncate">{u.name}</p>
                        <p className="text-xs text-dark-400">Lvl {u.level}</p>
                        <p
                          className={`text-sm font-bold mt-2 ${
                            u.totalPnL >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {u.totalPnL >= 0 ? "+" : ""}$
                          {u.totalPnL?.toFixed(0)}
                        </p>
                        <p className="text-xs text-dark-400">
                          {u.returnPercent}% return
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

          {/* Full Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-dark-400 border-b border-dark-700/50">
                    <th className="text-left py-4 px-4">Rank</th>
                    <th className="text-left py-4 px-4">Trader</th>
                    <th className="text-right py-4 px-4">Net Worth</th>
                    <th className="text-right py-4 px-4">Total P&L</th>
                    <th className="text-right py-4 px-4">Return %</th>
                    <th className="text-right py-4 px-4">Trades</th>
                    <th className="text-right py-4 px-4">Win Rate</th>
                    <th className="text-right py-4 px-4">Level</th>
                    <th className="text-right py-4 px-4">Achievements</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((u) => {
                    const isCurrentUser = u.name === user?.name;
                    return (
                      <tr
                        key={u.rank}
                        className={`border-b border-dark-800/50 transition ${
                          isCurrentUser
                            ? "bg-primary-600/10 border-l-2 border-l-primary-500"
                            : "hover:bg-dark-800/30"
                        }`}
                      >
                        <td className="py-4 px-4 font-bold text-lg">
                          {getRankBadge(u.rank)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">
                                {u.name}
                                {isCurrentUser && (
                                  <span className="ml-2 badge-blue text-xs">
                                    You
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-medium">
                          $
                          {u.netWorth?.toLocaleString("en-US", {
                            maximumFractionDigits: 0,
                          })}
                        </td>
                        <td
                          className={`py-4 px-4 text-right font-semibold ${
                            u.totalPnL >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {u.totalPnL >= 0 ? "+" : ""}$
                          {u.totalPnL?.toFixed(2)}
                        </td>
                        <td
                          className={`py-4 px-4 text-right font-medium ${
                            parseFloat(u.returnPercent) >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {u.returnPercent}%
                        </td>
                        <td className="py-4 px-4 text-right">
                          {u.totalTrades}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span
                            className={
                              parseFloat(u.winRate) >= 50
                                ? "text-emerald-400"
                                : "text-red-400"
                            }
                          >
                            {u.winRate}%
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="badge-yellow">
                            Lvl {u.level}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          🏅 {u.achievementCount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {leaderboard.length === 0 && (
            <div className="glass-card p-12 text-center">
              <span className="text-5xl block mb-4">🏆</span>
              <h3 className="text-xl font-bold mb-2">
                No traders on the leaderboard yet
              </h3>
              <p className="text-dark-400">
                Be the first to make a trade and claim the #1 spot!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Leaderboard;