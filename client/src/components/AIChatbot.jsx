import { useState, useRef, useEffect } from "react";
import { FiMessageSquare, FiX, FiSend, FiCpu } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const AIChatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "Hey! 👋 I'm StockVerse AI. Ask me anything about stocks, trading strategies, or market concepts!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!user) return null;

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const { data } = await api.post("/ai/chat", { message: userMsg });
      setMessages((prev) => [...prev, { role: "ai", content: data.response }]);
    } catch (err) {
      const hint =
        err.response?.data?.message ||
        "Sorry, I encountered an error. Try again! 😅";
      setMessages((prev) => [...prev, { role: "ai", content: hint }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-2xl shadow-primary-600/30 transition-all hover:scale-110 z-50"
        >
          <FiMessageSquare size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] glass-card flex flex-col z-50 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-700/50">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <FiCpu size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm">StockVerse AI</h3>
                <p className="text-xs text-emerald-400">Online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-dark-700 rounded-lg transition"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary-600 text-white rounded-br-md"
                      : "bg-dark-700 text-gray-200 rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-dark-700 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-dark-700/50">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about stocks..."
                className="input-field text-sm py-2.5"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="btn-primary px-4 disabled:opacity-50"
              >
                <FiSend size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;