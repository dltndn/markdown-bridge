export type MainLogLevel = "debug" | "info" | "warn" | "error";

export type MainLogEntry = {
  level: MainLogLevel;
  scope: "main";
  event: string;
  timestamp: string;
  details?: Record<string, unknown>;
};

export type MainLogger = {
  debug: (event: string, details?: Record<string, unknown>) => void;
  info: (event: string, details?: Record<string, unknown>) => void;
  warn: (event: string, details?: Record<string, unknown>) => void;
  error: (event: string, details?: Record<string, unknown>) => void;
};

type CreateMainLoggerOptions = {
  consoleEnabled?: boolean;
  now?: () => string;
  sink?: (entry: MainLogEntry) => void;
};

const noop = (): void => undefined;

export const noopMainLogger: MainLogger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop
};

export function createMainLogger(options: CreateMainLoggerOptions = {}): MainLogger {
  const now = options.now ?? (() => new Date().toISOString());
  const consoleEnabled = options.consoleEnabled ?? true;
  const sink = options.sink;

  const emit = (level: MainLogLevel, event: string, details?: Record<string, unknown>): void => {
    const entry: MainLogEntry = {
      level,
      scope: "main",
      event,
      timestamp: now(),
      ...(details ? { details } : {})
    };

    sink?.(entry);

    if (!consoleEnabled) {
      return;
    }

    if (level === "debug") {
      console.debug(entry);
      return;
    }

    if (level === "info") {
      console.info(entry);
      return;
    }

    if (level === "warn") {
      console.warn(entry);
      return;
    }

    console.error(entry);
  };

  return {
    debug: (event, details) => emit("debug", event, details),
    info: (event, details) => emit("info", event, details),
    warn: (event, details) => emit("warn", event, details),
    error: (event, details) => emit("error", event, details)
  };
}
