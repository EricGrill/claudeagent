import { NextRequest, NextResponse } from "next/server";
import { 
  createAutodeskAuthManager, 
  createAuthConfig,
  calculateExpiresAt 
} from "@/lib/autodesk/auth";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("autodesk_refresh_token")?.value;
  
  if (!refreshToken) {
    return NextResponse.json(
      { error: "No refresh token available" },
      { status: 401 }
    );
  }
  
  try {
    const config = createAuthConfig();
    const authManager = createAutodeskAuthManager(config);
    
    const tokenResponse = await authManager.refreshAccessToken(refreshToken);
    const expiresAt = calculateExpiresAt(tokenResponse.expires_in);
    
    const response = NextResponse.json({ success: true });
    
    response.cookies.set("autodesk_access_token", tokenResponse.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokenResponse.expires_in,
    });
    
    if (tokenResponse.refresh_token) {
      response.cookies.set("autodesk_refresh_token", tokenResponse.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 15, // 15 days
      });
    }
    
    response.cookies.set("autodesk_expires_at", String(expiresAt), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 15, // 15 days
    });
    
    return response;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    
    const response = NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 401 }
    );
    
    response.cookies.delete("autodesk_access_token");
    response.cookies.delete("autodesk_refresh_token");
    response.cookies.delete("autodesk_expires_at");
    
    return response;
  }
}
