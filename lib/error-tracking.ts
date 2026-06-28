import * as Sentry from "@sentry/nextjs";
import { v4 as uuidv4 } from "uuid";
import { logger, LogContext } from "./logger";
import { addError, TrackedError } from "./error-store";

export interface ErrorContext extends LogContext {
  digest?: string;
  userAgent?: string;
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

function sanitizeContext(context: ErrorContext): ErrorContext {
  const sanitized: ErrorContext = {};
  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "string") {
      let sanitizedValue = value;
      for (const sensitive of SENSITIVE_KEYS) {
        const regex = new RegExp(`(${sensitive}[=:]\\s*)([^\\s&]+)`, "gi");
        sanitizedValue = sanitizedValue.replace(regex, "$1[REDACTED]");
      }
      sanitized[key] = sanitizedValue;
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function determineSeverity(
  error: Error,
  statusCode?: number
): "low" | "medium" | "high" | "critical" {
  if (statusCode === 500 || statusCode === 503) {
    return "critical";
  }
  if (statusCode && statusCode >= 400 && statusCode < 500) {
    return "medium";
  }
  if (
    error.name === "TypeError" ||
    error.name === "ReferenceError" ||
    error.name === "SyntaxError"
  ) {
    return "high";
  }
  return "medium";
}

export function trackError(error: Error, context: ErrorContext = {}): string {
  const errorId = uuidv4();
  const sanitizedContext = sanitizeContext(context);
  const severity = determineSeverity(error, context.statusCode);

  const trackedError: TrackedError = {
    id: errorId,
    timestamp: new Date().toISOString(),
    correlationId: sanitizedContext.correlationId as string | undefined,
    message: error.message,
    name: error.name,
    stack: error.stack,
    digest: sanitizedContext.digest as string | undefined,
    requestPath: sanitizedContext.requestPath as string | undefined,
    userId: sanitizedContext.userId as string | undefined,
    projectId: sanitizedContext.projectId as string | undefined,
    method: sanitizedContext.method as string | undefined,
    statusCode: sanitizedContext.statusCode as number | undefined,
    userAgent: sanitizedContext.userAgent as string | undefined,
    environment: process.env.NODE_ENV || "development",
    severity,
  };

  addError(trackedError);

  logger.error(`Error tracked: ${error.message}`, {
    ...sanitizedContext,
    errorId,
    severity,
    errorName: error.name,
  }, error);

  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.withScope((scope) => {
      scope.setTag("errorId", errorId);
      scope.setTag("severity", severity);
      
      if (sanitizedContext.correlationId) {
        scope.setTag("correlationId", sanitizedContext.correlationId as string);
      }
      if (sanitizedContext.requestPath) {
        scope.setTag("requestPath", sanitizedContext.requestPath as string);
      }
      if (sanitizedContext.userId) {
        scope.setUser({ id: sanitizedContext.userId as string });
      }
      if (sanitizedContext.projectId) {
        scope.setTag("projectId", sanitizedContext.projectId as string);
      }
      if (sanitizedContext.digest) {
        scope.setTag("digest", sanitizedContext.digest as string);
      }
      
      scope.setExtras(sanitizedContext as Record<string, unknown>);
      Sentry.captureException(error);
    });
  }

  return errorId;
}

export function trackMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context: ErrorContext = {}
): void {
  const sanitizedContext = sanitizeContext(context);

  logger.info(message, sanitizedContext);

  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (sanitizedContext.correlationId) {
        scope.setTag("correlationId", sanitizedContext.correlationId as string);
      }
      if (sanitizedContext.userId) {
        scope.setUser({ id: sanitizedContext.userId as string });
      }
      scope.setExtras(sanitizedContext as Record<string, unknown>);
      Sentry.captureMessage(message, level);
    });
  }
}

export function setUserContext(userId: string, email?: string, username?: string): void {
  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.setUser({
      id: userId,
      email,
      username,
    });
  }
}

export function clearUserContext(): void {
  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.setUser(null);
  }
}
