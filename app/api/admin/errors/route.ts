import { NextResponse } from "next/server";
import {
  getRecentErrors,
  getErrorById,
  getErrorStats,
  getErrorsByCorrelationId,
} from "@/lib/error-store";
import { extractRequestInfo } from "@/lib/request-context";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    if (process.env.NODE_ENV === "development") {
      return true;
    }
    return false;
  }
  
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return false;
  }
  
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return false;
  }
  
  return token === adminKey;
}

export async function GET(request: Request) {
  const requestInfo = extractRequestInfo(request);
  
  if (!isAuthorized(request)) {
    logger.warn("Unauthorized admin errors access attempt", requestInfo);
    return NextResponse.json(
      { error: "Unauthorized", message: "Valid admin API key required" },
      { status: 401 }
    );
  }
  
  const url = new URL(request.url);
  const errorId = url.searchParams.get("id");
  const correlationId = url.searchParams.get("correlationId");
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 50;
  
  logger.info("Admin errors endpoint accessed", {
    ...requestInfo,
    errorId: errorId || undefined,
    queryCorrelationId: correlationId || undefined,
    limit,
  });

  if (errorId) {
    const error = getErrorById(errorId);
    if (!error) {
      return NextResponse.json(
        { error: "Not Found", message: `Error with id ${errorId} not found` },
        { status: 404 }
      );
    }
    return NextResponse.json({ error });
  }

  if (correlationId) {
    const errors = getErrorsByCorrelationId(correlationId);
    return NextResponse.json({
      correlationId,
      count: errors.length,
      errors,
    });
  }

  const errors = getRecentErrors(limit);
  const stats = getErrorStats();

  return NextResponse.json({
    stats,
    count: errors.length,
    errors,
  });
}
