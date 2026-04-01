import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiHome,
  FiPieChart,
  FiEye,
  FiTrendingUp,
  FiAward,
  FiCpu,
  FiFileText,
  FiSearch,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
} from "react-icons/fi";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return (
      <nav className="bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">📈</span>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                StockVerse
              </span>
            </Link>
            <div className="flex space-x-3">
              <Link to="/login" className="btn-secondary text-sm">
                Login
              </Link>
              <Link to="/register" className="btn-primary text-sm">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: FiHome },
    { to: "/portfolio", label: "Portfolio", icon: FiPieChart },
    { to: "/watchlist", label: "Watchlist", icon: FiEye },
    { to: "/screener", label: "Screener", icon: FiSearch },
    { to: "/ai-advisor", label: "AI Advisor", icon: FiCpu },
    { to: "/news", label: "News", icon: FiFileText },
    { to: "/leaderboard", label: "Leaderboard", icon: FiAward },
  ];

  return (
    <nav className="bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <span className="text-2xl">📈</span>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
              StockVerse
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === link.to
                    ? "bg-primary-600/20 text-primary-400"
                    : "text-dark-300 hover:text-white hover:bg-dark-700/50"
                }`}
              >
                <link.icon size={16} />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* User Section */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="text-right">
              <p className="text-xs text-dark-400">Balance</p>
              <p className="text-sm font-bold text-emerald-400">
                ${user.balance?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="badge-blue">Lvl {user.level || 1}</span>
              <Link
                to="/profile"
                className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold hover:bg-primary-700 transition-colors"
              >
                {user.name?.charAt(0).toUpperCase()}
              </Link>
              <button
                onClick={handleLogout}
                className="text-dark-400 hover:text-red-400 transition-colors p-2"
                title="Logout"
              >
                <FiLogOut size={18} />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-dark-300 hover:text-white"
          >
            {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-dark-900 border-t border-dark-700/50 animate-slide-up">
          <div className="px-4 py-4 space-y-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === link.to
                    ? "bg-primary-600/20 text-primary-400"
                    : "text-dark-300 hover:text-white hover:bg-dark-700/50"
                }`}
              >
                <link.icon size={18} />
                <span>{link.label}</span>
              </Link>
            ))}
            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-dark-300 hover:text-white hover:bg-dark-700/50"
            >
              <FiUser size={18} />
              <span>Profile</span>
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setMobileOpen(false);
              }}
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 w-full"
            >
              <FiLogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;