export interface TrackedError {
  id: string;
  timestamp: string;
  correlationId?: string;
  message: string;
  name: string;
  stack?: string;
  digest?: string;
  requestPath?: string;
  userId?: string;
  projectId?: string;
  method?: string;
  statusCode?: number;
  userAgent?: string;
  environment: string;
  severity: "low" | "medium" | "high" | "critical";
}

const MAX_ERRORS = 100;
const errors: TrackedError[] = [];

export function addError(error: TrackedError): void {
  errors.unshift(error);
  if (errors.length > MAX_ERRORS) {
    errors.pop();
  }
}

export function getRecentErrors(limit = 50): TrackedError[] {
  return errors.slice(0, Math.min(limit, MAX_ERRORS));
}

export function getErrorById(id: string): TrackedError | undefined {
  return errors.find((e) => e.id === id);
}

export function getErrorsByCorrelationId(correlationId: string): TrackedError[] {
  return errors.filter((e) => e.correlationId === correlationId);
}

export function getErrorStats(): {
  total: number;
  bySeverity: Record<string, number>;
  last24h: number;
  last1h: number;
} {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const stats = {
    total: errors.length,
    bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
    last24h: 0,
    last1h: 0,
  };

  for (const error of errors) {
    stats.bySeverity[error.severity]++;
    const errorTime = new Date(error.timestamp).getTime();
    if (errorTime >= oneDayAgo) {
      stats.last24h++;
    }
    if (errorTime >= oneHourAgo) {
      stats.last1h++;
    }
  }

  return stats;
}

export function clearErrors(): void {
  errors.length = 0;
}
