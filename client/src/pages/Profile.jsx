import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import AchievementBadge from "../components/AchievementBadge";
import toast from "react-hot-toast";
import {
  FiUser,
  FiMail,
  FiLock,
  FiSave,
  FiRefreshCw,
  FiAlertTriangle,
  FiAward,
  FiTrendingUp,
  FiActivity,
  FiTarget,
  FiDollarSign,
} from "react-icons/fi";

const Profile = () => {
  const { user, updateUser, refreshUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSave = async () => {
    if (password && password !== confirmPassword) {
      return toast.error("Passwords don't match");
    }
    if (password && password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setSaving(true);
    try {
      const payload = { name };
      if (password) payload.password = password;

      const { data } = await api.put("/auth/profile", payload);
      updateUser(data);
      setPassword("");
      setConfirmPassword("");
      toast.success("Profile updated! ✅");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await api.post("/auth/reset");
      await refreshUser();
      toast.success("Account reset successfully! Fresh start! 🚀");
      setShowResetConfirm(false);
    } catch (err) {
      toast.error("Reset failed");
    } finally {
      setResetting(false);
    }
  };

  const stats = [
    {
      icon: FiDollarSign,
      label: "Cash Balance",
      value: `$${user?.balance?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "100,000.00"}`,
      color: "text-emerald-400",
    },
    {
      icon: FiActivity,
      label: "Total Trades",
      value: user?.totalTrades || 0,
      color: "text-primary-400",
    },
    {
      icon: FiTrendingUp,
      label: "Total P&L",
      value: `${(user?.totalPnL || 0) >= 0 ? "+" : ""} $${(user?.totalPnL || 0).toFixed(2)}`,
      color: (user?.totalPnL || 0) >= 0 ? "text-emerald-400" : "text-red-400",
    },
    {
      icon: FiTarget,
      label: "Win Rate",
      value: `${user?.totalTrades > 0 ? ((user.profitableTrades / user.totalTrades) * 100).toFixed(1) : 0}%`,
      color: "text-yellow-400",
    },
    {
      icon: FiAward,
      label: "Level",
      value: user?.level || 1,
      color: "text-purple-400",
    },
    {
      icon: FiAward,
      label: "XP",
      value: user?.xp || 0,
      color: "text-cyan-400",
    },
  ];

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary-600 flex items-center justify-center text-3xl font-bold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{user?.name}</h1>
            <p className="text-dark-400">{user?.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="badge-yellow">Level {user?.level || 1}</span>
              <span className="badge-blue">{user?.xp || 0} XP</span>
              <span className="badge-green">
                {user?.achievements?.length || 0} Achievements
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={stat.color} size={18} />
                <span className="text-xs text-dark-400">{stat.label}</span>
              </div>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* XP Progress */}
        <div className="glass-card p-5 mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold flex items-center gap-2">
              <FiAward className="text-yellow-400" />
              Level {user?.level || 1} Progress
            </span>
            <span className="text-sm text-dark-400">
              {(user?.xp || 0) % 200} / 200 XP to next level
            </span>
          </div>
          <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-700"
              style={{
                width: `${(((user?.xp || 0) % 200) / 200) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Achievements */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FiAward className="text-yellow-400" />
            Achievements ({user?.achievements?.length || 0})
          </h2>
          {user?.achievements?.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-4">
              {user.achievements.map((a) => (
                <AchievementBadge key={a.id} achievement={a} />
              ))}
            </div>
          ) : (
            <p className="text-dark-400 text-center py-4">
              Start trading to earn achievements! 🏆
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Edit Profile */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-6">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-dark-400 mb-1.5 block">
                  Name
                </label>
                <div className="relative">
                  <FiUser
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field pl-11"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-dark-400 mb-1.5 block">
                  Email
                </label>
                <div className="relative">
                  <FiMail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400"
                    size={18}
                  />
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="input-field pl-11 opacity-50 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-dark-400 mb-1.5 block">
                  New Password (optional)
                </label>
                <div className="relative">
                  <FiLock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400"
                    size={18}
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="input-field pl-11"
                  />
                </div>
              </div>

              {password && (
                <div>
                  <label className="text-sm text-dark-400 mb-1.5 block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <FiLock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400"
                      size={18}
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="input-field pl-11"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FiSave size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="space-y-6">
            {/* Reset Account */}
            <div className="glass-card p-6 border-yellow-500/20">
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-yellow-400">
                <FiRefreshCw size={20} />
                Reset Account
              </h2>
              <p className="text-sm text-dark-400 mb-4">
                Reset your paper trading account back to \$100,000. This will
                clear all holdings, transactions, and stats. Achievements will be
                kept.
              </p>
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 font-semibold py-2.5 px-6 rounded-xl transition-all hover:bg-yellow-500/20 w-full"
                >
                  Reset Account
                </button>
              ) : (
                <div className="bg-yellow-500/10 rounded-xl p-4 space-y-3">
                  <p className="text-sm text-yellow-400 font-medium">
                    ⚠️ Are you sure? This cannot be undone!
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleReset}
                      disabled={resetting}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                    >
                      {resetting ? "Resetting..." : "Yes, Reset"}
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 btn-secondary py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Account Info */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold mb-4">Account Info</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-400">Account Created</span>
                  <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Starting Balance</span>
                  <span>$100,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Holdings</span>
                  <span>
                    {user?.holdings?.length || 0}{" "}
                    {(user?.holdings?.length || 0) === 1 ? "stock" : "stocks"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Profitable Trades</span>
                  <span className="text-emerald-400">
                    {user?.profitableTrades || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="btn-danger w-full flex items-center justify-center gap-2"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;