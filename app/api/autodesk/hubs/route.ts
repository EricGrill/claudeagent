import { NextRequest, NextResponse } from "next/server";
import { createAutodeskApiClient } from "@/lib/autodesk/api";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("autodesk_access_token")?.value;
  
  if (!accessToken) {
    return NextResponse.json(
      { error: "Not authenticated with Autodesk" },
      { status: 401 }
    );
  }
  
  try {
    const client = createAutodeskApiClient(accessToken);
    const hubs = await client.hubs.list();
    
    return NextResponse.json({ hubs });
  } catch (error) {
    console.error("Failed to fetch hubs:", error);
    return NextResponse.json(
      { error: "Failed to fetch Autodesk hubs" },
      { status: 500 }
    );
  }
}
