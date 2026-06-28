import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

export const CORRELATION_ID_HEADER = "x-correlation-id";

export function middleware(request: NextRequest) {
  const requestStart = Date.now();
  const correlationId = request.headers.get(CORRELATION_ID_HEADER) || uuidv4();
  
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CORRELATION_ID_HEADER, correlationId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set(CORRELATION_ID_HEADER, correlationId);
  response.headers.set("x-request-start", requestStart.toString());

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
