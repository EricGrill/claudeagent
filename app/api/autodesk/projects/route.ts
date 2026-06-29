import { NextRequest, NextResponse } from "next/server";
import { createAutodeskApiClient } from "@/lib/autodesk/api";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("autodesk_access_token")?.value;
  const hubId = request.nextUrl.searchParams.get("hubId");
  
  if (!accessToken) {
    return NextResponse.json(
      { error: "Not authenticated with Autodesk" },
      { status: 401 }
    );
  }
  
  if (!hubId) {
    return NextResponse.json(
      { error: "Hub ID is required" },
      { status: 400 }
    );
  }
  
  try {
    const client = createAutodeskApiClient(accessToken);
    const projects = await client.projects.list(hubId);
    
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch Autodesk projects" },
      { status: 500 }
    );
  }
}
