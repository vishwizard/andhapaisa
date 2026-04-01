import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiTrendingUp,
  FiShield,
  FiCpu,
  FiAward,
  FiBarChart2,
  FiMessageSquare,
} from "react-icons/fi";

const Landing = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: FiTrendingUp,
      title: "Paper Trading",
      desc: "Trade with \$100K virtual money. Practice without risk.",
      color: "text-emerald-400",
    },
    {
      icon: FiCpu,
      title: "AI Stock Advisor",
      desc: "Get AI-powered analysis, sentiment scoring & recommendations.",
      color: "text-primary-400",
    },
    {
      icon: FiBarChart2,
      title: "Real-Time Data",
      desc: "Live stock quotes, charts, and company information.",
      color: "text-cyan-400",
    },
    {
      icon: FiMessageSquare,
      title: "AI Chatbot",
      desc: "Ask questions about stocks and get instant AI answers.",
      color: "text-purple-400",
    },
    {
      icon: FiAward,
      title: "Gamified Experience",
      desc: "Earn XP, unlock achievements, climb the leaderboard.",
      color: "text-yellow-400",
    },
    {
      icon: FiShield,
      title: "Portfolio Analytics",
      desc: "AI-powered portfolio insights, risk scoring & optimization.",
      color: "text-pink-400",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-600/10 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-primary-600/10 border border-primary-500/20 rounded-full px-4 py-2 mb-8">
              <span className="text-primary-400 text-sm font-medium">
                🚀 AI-Powered Stock Trading Simulator
              </span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-extrabold mb-6">
              <span className="bg-gradient-to-r from-white via-white to-dark-300 bg-clip-text text-transparent">
                Master the
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Stock Market
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-dark-300 mb-10 max-w-2xl mx-auto">
              Practice trading with virtual money, get AI-powered insights,
              compete with others on the leaderboard, and learn without risking
              a single penny.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={user ? "/dashboard" : "/register"}
                className="btn-primary text-lg px-8 py-4"
              >
                {user ? "Go to Dashboard" : "Start Trading Free →"}
              </Link>
              {!user && (
                <Link
                  to="/login"
                  className="btn-secondary text-lg px-8 py-4"
                >
                  Login
                </Link>
              )}
            </div>

            <div className="mt-12 flex items-center justify-center space-x-8 text-dark-400">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">\$100K</p>
                <p className="text-xs">Virtual Cash</p>
              </div>
              <div className="w-px h-10 bg-dark-700" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">AI</p>
                <p className="text-xs">Powered Analysis</p>
              </div>
              <div className="w-px h-10 bg-dark-700" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">Free</p>
                <p className="text-xs">Forever</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
              learn trading
            </span>
          </h2>
          <p className="text-dark-400 text-lg">
            Packed with features that make learning fun and effective
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="glass-card p-6 hover:border-primary-500/30 transition-all duration-300 group"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-dark-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <f.icon className={f.color} size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-dark-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-dark-500 text-sm">
          <p>
            © 2024 StockVerse. Built for educational purposes. Not financial
            advice.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;