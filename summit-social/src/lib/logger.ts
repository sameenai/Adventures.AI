const isDev = process.env.NODE_ENV !== "production";

type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, message: string, data?: unknown) {
  if (!isDev && level === "info") return;
  const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
  if (data !== undefined) {
    console[level](`${prefix} ${message}`, data);
  } else {
    console[level](`${prefix} ${message}`);
  }
}

export const logger = {
  info: (message: string, data?: unknown) => log("info", message, data),
  warn: (message: string, data?: unknown) => log("warn", message, data),
  error: (message: string, data?: unknown) => log("error", message, data),
};
