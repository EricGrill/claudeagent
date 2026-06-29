import { NextRequest, NextResponse } from "next/server";
import { 
  createAutodeskAuthManager, 
  createAuthConfig,
  calculateExpiresAt 
} from "@/lib/autodesk/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectPath = "/integrations/autodesk";
  
  if (error) {
    console.error("Autodesk OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${baseUrl}${redirectPath}?error=${encodeURIComponent(errorDescription || error)}`
    );
  }
  
  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}${redirectPath}?error=${encodeURIComponent("Authorization code not received")}`
    );
  }
  
  const storedState = request.cookies.get("autodesk_auth_state")?.value;
  if (state && storedState && state !== storedState) {
    return NextResponse.redirect(
      `${baseUrl}${redirectPath}?error=${encodeURIComponent("Invalid state parameter")}`
    );
  }
  
  try {
    const config = createAuthConfig();
    const authManager = createAutodeskAuthManager(config);
    
    const tokenResponse = await authManager.exchangeCodeForToken(code);
    const expiresAt = calculateExpiresAt(tokenResponse.expires_in);
    
    const response = NextResponse.redirect(
      `${baseUrl}${redirectPath}?success=true`
    );
    
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
    
    response.cookies.delete("autodesk_auth_state");
    
    return response;
  } catch (error) {
    console.error("Failed to exchange code for token:", error);
    const errorMessage = error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.redirect(
      `${baseUrl}${redirectPath}?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
