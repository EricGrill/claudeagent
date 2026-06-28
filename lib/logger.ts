import { v4 as uuidv4 } from "uuid";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  correlationId?: string;
  requestPath?: string;
  userId?: string;
  projectId?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const SENSITIVE_KEYS = [
  "password",
  "secret",
  "token",
  "api_key",
  "apikey",
  "authorization",
  "auth",
  "bearer",
  "credential",
  "private",
  "key",
];

function sanitizeValue(key: string, value: unknown): unknown {
  const lowerKey = key.toLowerCase();
  if (SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive))) {
    return "[REDACTED]";
  }
  if (typeof value === "object" && value !== null) {
    return sanitizeObject(value as Record<string, unknown>);
  }
  return value;
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(key, value);
  }
  return sanitized;
}

function sanitizeError(error: Error): { name: string; message: string; stack?: string } {
  let sanitizedMessage = error.message;
  for (const sensitive of SENSITIVE_KEYS) {
    const regex = new RegExp(`(${sensitive}[=:]\\s*)([^\\s&]+)`, "gi");
    sanitizedMessage = sanitizedMessage.replace(regex, "$1[REDACTED]");
  }
  
  let sanitizedStack = error.stack;
  if (sanitizedStack) {
    for (const sensitive of SENSITIVE_KEYS) {
      const regex = new RegExp(`(${sensitive}[=:]\\s*)([^\\s&]+)`, "gi");
      sanitizedStack = sanitizedStack.replace(regex, "$1[REDACTED]");
    }
  }
  
  return {
    name: error.name,
    message: sanitizedMessage,
    stack: sanitizedStack,
  };
}

export function generateCorrelationId(): string {
  return uuidv4();
}

class Logger {
  private static instance: Logger;
  private contextStore: Map<string, LogContext> = new Map();

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setContext(correlationId: string, context: LogContext): void {
    this.contextStore.set(correlationId, { ...context, correlationId });
  }

  getContext(correlationId: string): LogContext | undefined {
    return this.contextStore.get(correlationId);
  }

  clearContext(correlationId: string): void {
    this.contextStore.delete(correlationId);
  }

  private formatEntry(
    level: LogLevel,
    message: string,
    context: LogContext = {},
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: sanitizeObject(context) as LogContext,
    };

    if (error) {
      entry.error = sanitizeError(error);
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    const logString = JSON.stringify(entry);
    
    switch (entry.level) {
      case "error":
        console.error(logString);
        break;
      case "warn":
        console.warn(logString);
        break;
      case "debug":
        if (process.env.NODE_ENV === "development") {
          console.debug(logString);
        }
        break;
      default:
        console.log(logString);
    }
  }

  debug(message: string, context?: LogContext): void {
    const entry = this.formatEntry("debug", message, context);
    this.output(entry);
  }

  info(message: string, context?: LogContext): void {
    const entry = this.formatEntry("info", message, context);
    this.output(entry);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    const entry = this.formatEntry("warn", message, context, error);
    this.output(entry);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    const entry = this.formatEntry("error", message, context, error);
    this.output(entry);
  }

  request(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const entry = this.formatEntry("info", `${method} ${path}`, {
      ...context,
      method,
      requestPath: path,
      statusCode,
      duration,
    });
    this.output(entry);
  }
}

export const logger = Logger.getInstance();
export default logger;
