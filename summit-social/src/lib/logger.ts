const isProd = process.env.NODE_ENV === "production";

type LogLevel = "info" | "warn" | "error";

function serialize(data: unknown): string | undefined {
  if (data === undefined) return undefined;
  if (data instanceof Error) {
    return JSON.stringify({ message: data.message, stack: data.stack });
  }
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

function log(level: LogLevel, message: string, data?: unknown) {
  if (isProd) {
    const entry: Record<string, unknown> = {
      severity: level.toUpperCase(),
      message,
      timestamp: new Date().toISOString(),
    };
    if (data !== undefined) {
      entry.data = data instanceof Error ? { message: data.message, stack: data.stack } : data;
    }
    console[level](JSON.stringify(entry));
  } else {
    const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
    const extra = serialize(data);
    console[level](extra ? `${prefix} ${message} ${extra}` : `${prefix} ${message}`);
  }
}

export const logger = {
  info: (message: string, data?: unknown) => log("info", message, data),
  warn: (message: string, data?: unknown) => log("warn", message, data),
  error: (message: string, data?: unknown) => log("error", message, data),
};
