import { config } from "../config/index.js";

type LogLevel = "debug" | "info" | "warn" | "error";

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function shouldLog(level: LogLevel): boolean {
  return levelWeight[level] >= levelWeight[config.LOG_LEVEL];
}

function formatMeta(meta?: unknown): string {
  if (meta === undefined) return "";
  if (meta instanceof Error) return ` ${meta.stack ?? meta.message}`;
  return ` ${JSON.stringify(meta)}`;
}

export const logger = {
  debug(message: string, meta?: unknown) {
    if (shouldLog("debug")) console.debug(`[debug] ${message}${formatMeta(meta)}`);
  },
  info(message: string, meta?: unknown) {
    if (shouldLog("info")) console.info(`[info] ${message}${formatMeta(meta)}`);
  },
  warn(message: string, meta?: unknown) {
    if (shouldLog("warn")) console.warn(`[warn] ${message}${formatMeta(meta)}`);
  },
  error(message: string, meta?: unknown) {
    if (shouldLog("error")) console.error(`[error] ${message}${formatMeta(meta)}`);
  }
};
