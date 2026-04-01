/**
 * Logs failed API responses so the terminal shows why the client got 4xx/5xx.
 * Many routes use res.status(n).json({ message }) without console.error — this catches those.
 */
export const attachHttpErrorLogging = () => {
  return (req, res, next) => {
    const start = Date.now();

    const summarizeBody = (data) => {
      if (data == null) return "";
      if (typeof data === "string") return data.slice(0, 500);
      if (typeof data === "object" && data.message != null) {
        return String(data.message);
      }
      try {
        return JSON.stringify(data).slice(0, 500);
      } catch {
        return "[unserializable body]";
      }
    };

    const origJson = res.json.bind(res);
    res.json = function (data) {
      if (res.statusCode >= 400) {
        const ms = Date.now() - start;
        const detail = summarizeBody(data);
        console.error(
          `[API ${res.statusCode}] ${req.method} ${req.originalUrl} (${ms}ms) → ${detail || "(no message)"}`
        );
      }
      return origJson(data);
    };

    const origSend = res.send.bind(res);
    res.send = function (data) {
      if (res.statusCode >= 400 && typeof data === "string") {
        const ms = Date.now() - start;
        console.error(
          `[API ${res.statusCode}] ${req.method} ${req.originalUrl} (${ms}ms) → ${data.slice(0, 300)}`
        );
      }
      return origSend(data);
    };

    next();
  };
};

export const logUnhandledRejections = () => {
  process.on("unhandledRejection", (reason, promise) => {
    console.error("[unhandledRejection]", reason);
    if (reason instanceof Error && reason.stack) {
      console.error(reason.stack);
    }
  });
};
