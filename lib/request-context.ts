import { headers } from "next/headers";
import { generateCorrelationId, LogContext } from "./logger";

export const CORRELATION_ID_HEADER = "x-correlation-id";

export async function getCorrelationId(): Promise<string> {
  try {
    const headersList = await headers();
    return headersList.get(CORRELATION_ID_HEADER) || generateCorrelationId();
  } catch {
    return generateCorrelationId();
  }
}

export async function getRequestContext(): Promise<LogContext> {
  try {
    const headersList = await headers();
    const correlationId = headersList.get(CORRELATION_ID_HEADER) || generateCorrelationId();
    const userAgent = headersList.get("user-agent") || undefined;
    
    return {
      correlationId,
      userAgent,
    };
  } catch {
    return {
      correlationId: generateCorrelationId(),
    };
  }
}

export function getCorrelationIdFromRequest(request: Request): string {
  return request.headers.get(CORRELATION_ID_HEADER) || generateCorrelationId();
}

export function extractRequestInfo(request: Request): LogContext {
  const url = new URL(request.url);
  return {
    correlationId: getCorrelationIdFromRequest(request),
    requestPath: url.pathname,
    method: request.method,
    userAgent: request.headers.get("user-agent") || undefined,
  };
}
