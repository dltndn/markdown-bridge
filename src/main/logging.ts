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
const REDACTED_VALUE = "[redacted]";
const SENSITIVE_LOG_KEYS = new Set([
  "body",
  "content",
  "documentBody",
  "documentContent",
  "markdown",
  "rawContent",
  "rawText",
  "extractedText"
]);

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
    const sanitizedDetails = details ? sanitizeLogDetails(details) : undefined;
    const entry: MainLogEntry = {
      level,
      scope: "main",
      event,
      timestamp: now(),
      ...(sanitizedDetails ? { details: sanitizedDetails } : {})
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

function sanitizeLogDetails(details: Record<string, unknown>): Record<string, unknown> {
  return sanitizeValue(details) as Record<string, unknown>;
}

function sanitizeValue(value: unknown, key?: string): unknown {
  if (key && SENSITIVE_LOG_KEYS.has(key)) {
    return REDACTED_VALUE;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === "object") {
    const sanitized: Record<string, unknown> = {};

    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
      sanitized[childKey] = sanitizeValue(childValue, childKey);
    }

    return sanitized;
  }

  return value;
}
