export { logger, generateCorrelationId } from "./logger";
export type { LogLevel, LogContext, LogEntry } from "./logger";

export { trackError, trackMessage, setUserContext, clearUserContext } from "./error-tracking";
export type { ErrorContext } from "./error-tracking";

export {
  getCorrelationId,
  getRequestContext,
  getCorrelationIdFromRequest,
  extractRequestInfo,
  CORRELATION_ID_HEADER,
} from "./request-context";

export {
  addError,
  getRecentErrors,
  getErrorById,
  getErrorsByCorrelationId,
  getErrorStats,
  clearErrors,
} from "./error-store";
export type { TrackedError } from "./error-store";
