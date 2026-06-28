import { NextResponse } from "next/server";
import { trackError } from "@/lib/error-tracking";
import { extractRequestInfo } from "@/lib/request-context";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  const requestInfo = extractRequestInfo(request);
  const url = new URL(request.url);
  const errorType = url.searchParams.get("type") || "generic";

  logger.info("Test error endpoint called", {
    ...requestInfo,
    errorType,
  });

  let error: Error;
  
  switch (errorType) {
    case "type":
      error = new TypeError("Test TypeError - undefined is not a function");
      break;
    case "reference":
      error = new ReferenceError("Test ReferenceError - variable is not defined");
      break;
    case "syntax":
      error = new SyntaxError("Test SyntaxError - Unexpected token");
      break;
    case "range":
      error = new RangeError("Test RangeError - Maximum call stack size exceeded");
      break;
    case "database":
      error = new Error("Database connection failed: ECONNREFUSED");
      error.name = "DatabaseError";
      break;
    case "auth":
      error = new Error("Authentication failed: Invalid token");
      error.name = "AuthenticationError";
      break;
    default:
      error = new Error("Test generic error for observability testing");
  }

  const errorId = trackError(error, {
    ...requestInfo,
    statusCode: 500,
    testMode: true,
  });

  return NextResponse.json(
    {
      message: "Error tracked successfully",
      errorId,
      errorType,
      correlationId: requestInfo.correlationId,
    },
    {
      status: 200,
      headers: {
        "x-correlation-id": requestInfo.correlationId || "",
        "x-error-id": errorId,
      },
    }
  );
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  const requestInfo = extractRequestInfo(request);

  logger.info("Test error POST endpoint - simulating 500", requestInfo);

  const error = new Error("Simulated server error for testing");
  trackError(error, {
    ...requestInfo,
    statusCode: 500,
  });

  return NextResponse.json(
    {
      error: "Internal Server Error",
      message: "Simulated error for testing",
      correlationId: requestInfo.correlationId,
    },
    {
      status: 500,
      headers: {
        "x-correlation-id": requestInfo.correlationId || "",
      },
    }
  );
}
