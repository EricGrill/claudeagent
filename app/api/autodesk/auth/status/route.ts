import { NextRequest, NextResponse } from "next/server";
import { isTokenExpired } from "@/lib/autodesk/auth";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("autodesk_access_token")?.value;
  const expiresAtStr = request.cookies.get("autodesk_expires_at")?.value;
  
  if (!accessToken) {
    return NextResponse.json({
      isAuthenticated: false,
      isExpired: true,
    });
  }
  
  const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;
  const expired = isTokenExpired(expiresAt);
  
  return NextResponse.json({
    isAuthenticated: !expired,
    isExpired: expired,
    expiresAt,
  });
}
