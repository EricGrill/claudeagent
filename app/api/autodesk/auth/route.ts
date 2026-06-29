import { NextRequest, NextResponse } from "next/server";
import { createAutodeskAuthManager, createAuthConfig } from "@/lib/autodesk/auth";

export async function GET(request: NextRequest) {
  try {
    const config = createAuthConfig();
    const authManager = createAutodeskAuthManager(config);
    
    const state = crypto.randomUUID();
    const authUrl = authManager.getAuthorizationUrl(state);
    
    const response = NextResponse.json({ authUrl, state });
    
    response.cookies.set("autodesk_auth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
    });
    
    return response;
  } catch (error) {
    console.error("Failed to generate auth URL:", error);
    return NextResponse.json(
      { error: "Failed to initiate Autodesk authentication" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken } = body;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token required" },
        { status: 400 }
      );
    }
    
    const config = createAuthConfig();
    const authManager = createAutodeskAuthManager(config);
    
    await authManager.revokeToken(accessToken);
    
    const response = NextResponse.json({ success: true });
    
    response.cookies.delete("autodesk_access_token");
    response.cookies.delete("autodesk_refresh_token");
    response.cookies.delete("autodesk_expires_at");
    
    return response;
  } catch (error) {
    console.error("Failed to revoke token:", error);
    return NextResponse.json(
      { error: "Failed to disconnect from Autodesk" },
      { status: 500 }
    );
  }
}
