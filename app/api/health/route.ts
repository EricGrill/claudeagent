import { NextResponse } from "next/server";
import { getErrorStats } from "@/lib/error-store";
import { extractRequestInfo } from "@/lib/request-context";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  correlationId: string;
  version: string;
  environment: string;
  runtime: {
    nodeVersion: string;
    platform: string;
    uptime: number;
    memoryUsage: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
  };
  services: {
    sentry: {
      configured: boolean;
    };
  };
  errors?: {
    last1h: number;
    last24h: number;
  };
}

function getHealthStatus(errorStats: ReturnType<typeof getErrorStats>): "healthy" | "degraded" | "unhealthy" {
  if (errorStats.bySeverity.critical > 0 || errorStats.last1h > 10) {
    return "unhealthy";
  }
  if (errorStats.last1h > 5 || errorStats.bySeverity.high > 0) {
    return "degraded";
  }
  return "healthy";
}

export async function GET(request: Request) {
  const requestInfo = extractRequestInfo(request);
  
  logger.info("Health check requested", requestInfo);

  const errorStats = getErrorStats();
  const status = getHealthStatus(errorStats);
  const memoryUsage = process.memoryUsage();

  const response: HealthResponse = {
    status,
    timestamp: new Date().toISOString(),
    correlationId: requestInfo.correlationId || "",
    version: process.env.npm_package_version || "0.1.0",
    environment: process.env.NODE_ENV || "development",
    runtime: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
      },
    },
    services: {
      sentry: {
        configured: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
      },
    },
    errors: {
      last1h: errorStats.last1h,
      last24h: errorStats.last24h,
    },
  };

  const httpStatus = status === "healthy" ? 200 : status === "degraded" ? 200 : 503;

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "x-correlation-id": requestInfo.correlationId || "",
    },
  });
}
