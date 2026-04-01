import { GoogleGenerativeAI } from "@google/generative-ai";

// Prefer newer models first: 2.0-flash often hits free-tier quota (429) while 2.5-flash still works.
// gemini-1.5-flash IDs frequently 404 on v1beta — use -latest / lite variants as backup.
const MODEL_CANDIDATES = [
  ...new Set(
    [
      process.env.GEMINI_MODEL,
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-2.0-flash-lite",
      "gemini-2.0-flash",
      "gemini-2.0-flash-001",
    ].filter(Boolean)
  ),
];

const requireApiKey = () => {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to server/.env (see .env.example) to enable AI features."
    );
  }
  return key;
};

const extractText = (result) => {
  const response = result?.response;
  if (!response) {
    throw new Error("Empty response from AI");
  }
  try {
    return response.text();
  } catch {
    const block = response.promptFeedback?.blockReason;
    if (block) {
      throw new Error(`AI response was blocked (${block}). Try rephrasing your question.`);
    }
    throw new Error("AI returned no text. Try again or use a different prompt.");
  }
};

const shouldTryNextModel = (err) => {
  const msg = err?.message || String(err);
  if (msg.includes("API_KEY_INVALID") || msg.includes("API key not valid")) {
    return false;
  }
  return (
    msg.includes("404") ||
    msg.includes("429") ||
    msg.includes("Quota exceeded") ||
    msg.includes("Too Many Requests") ||
    msg.includes("not found") ||
    msg.includes("NOT_FOUND") ||
    msg.includes("is not supported")
  );
};

const generateWithFallback = async (prompt) => {
  const apiKey = requireApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return extractText(result);
    } catch (err) {
      lastError = err;
      const msg = err?.message || "";
      if (msg.includes("API_KEY_INVALID") || msg.includes("API key not valid")) {
        throw new Error(
          "Gemini rejected your API key. Create a new key at https://aistudio.google.com/apikey and update GEMINI_API_KEY in server/.env."
        );
      }
      if (shouldTryNextModel(err)) {
        continue;
      }
      throw err;
    }
  }

  console.error("AI: all model candidates failed:", lastError);
  const hint =
    lastError?.message?.includes("Quota") || lastError?.message?.includes("429")
      ? " Gemini free-tier quotas are per model. Wait and retry, enable billing in Google AI Studio, or set GEMINI_MODEL to another model (e.g. gemini-2.5-flash)."
      : "";
  throw new Error(
    (lastError?.message || "Could not reach Gemini. Check GEMINI_API_KEY.") + hint
  );
};

export const analyzeStock = async (symbol, stockData, newsData) => {
  if (!stockData?.price && stockData?.price !== 0) {
    throw new Error("No quote data available for analysis");
  }

  const prompt = `You are an expert stock market analyst AI. Analyze the following stock and provide insights.

Stock: ${symbol}
Current Price: ${stockData.price}
Change: ${stockData.change} (${stockData.changePercent}%)
Day High: ${stockData.high}
Day Low: ${stockData.low}
Open: ${stockData.open}
Previous Close: ${stockData.prevClose}

Recent News Headlines:
${(newsData || [])
  .slice(0, 5)
  .map((n) => `- ${n.headline}`)
  .join("\n")}

Please provide:
1. **Technical Summary** (2-3 sentences)
2. **News Sentiment** (Bullish / Bearish / Neutral with explanation)
3. **Key Levels** (Support and Resistance based on the data)
4. **Risk Assessment** (Low / Medium / High)
5. **Short-term Outlook** (1 week)
6. **AI Recommendation** (Strong Buy / Buy / Hold / Sell / Strong Sell)
7. **Confidence Score** (0-100%)

Format as JSON with keys: technicalSummary, newsSentiment, sentimentExplanation, support, resistance, riskLevel, shortTermOutlook, recommendation, confidenceScore`;

  try {
    const text = await generateWithFallback(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { raw: text };
  } catch (err) {
    console.error("AI Analysis Error:", err);
    throw err instanceof Error ? err : new Error("AI analysis failed");
  }
};

export const chatWithAI = async (message, context = "") => {
  const prompt = `You are StockVerse AI, a friendly and knowledgeable stock market assistant. 
You help users understand stocks, trading strategies, market concepts, and provide educational content.
You always remind users that this is paper trading for educational purposes and not real financial advice.

${context ? `Context about user's portfolio:\n${context}\n` : ""}

User's question: ${message}

Provide a helpful, informative, and engaging response. Use emojis occasionally. Keep it concise but thorough.`;

  try {
    return await generateWithFallback(prompt);
  } catch (err) {
    console.error("AI Chat Error:", err);
    throw err instanceof Error ? err : new Error("AI chat failed");
  }
};

export const getPortfolioInsights = async (holdings, balance, totalPnL) => {
  const holdingsList = (holdings || [])
    .map(
      (h) =>
        `${h.symbol}: ${h.quantity} shares @ avg $${h.avgPrice.toFixed(2)} (invested: $${h.totalInvested.toFixed(2)})`
    )
    .join("\n");

  const prompt = `Analyze this paper trading portfolio and provide insights:

Cash Balance: $${balance.toFixed(2)}
Total P&L: $${totalPnL.toFixed(2)}

Holdings:
${holdingsList || "No holdings"}

Provide:
1. **Portfolio Health Score** (0-100)
2. **Diversification Rating** (Poor/Fair/Good/Excellent)
3. **Risk Profile** (Conservative/Moderate/Aggressive)
4. **Top Recommendation** (one actionable insight)
5. **Sector Exposure Warning** (if any)

Format as JSON with keys: healthScore, diversification, riskProfile, recommendation, sectorWarning`;

  try {
    const text = await generateWithFallback(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { raw: text };
  } catch (err) {
    console.error("Portfolio insights error:", err);
    throw err instanceof Error ? err : new Error("Portfolio analysis failed");
  }
};

export const analyzeSentiment = async (headlines) => {
  if (!headlines?.length) {
    return { overallSentiment: "Neutral", score: 0, summary: "No headlines to analyze" };
  }

  const prompt = `Analyze the sentiment of these financial news headlines. Return a JSON object with:
- overallSentiment: "Bullish" | "Bearish" | "Neutral"
- score: number from -100 (very bearish) to 100 (very bullish)
- summary: brief 1-2 sentence summary

Headlines:
${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}`;

  try {
    const text = await generateWithFallback(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { overallSentiment: "Neutral", score: 0, summary: "Unable to analyze" };
  } catch {
    return { overallSentiment: "Neutral", score: 0, summary: "Analysis unavailable" };
  }
};
