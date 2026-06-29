import { NextRequest, NextResponse } from "next/server";
import { createAutodeskApiClient, extractProjectIdForApi } from "@/lib/autodesk/api";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("autodesk_access_token")?.value;
  const projectId = request.nextUrl.searchParams.get("projectId");
  
  if (!accessToken) {
    return NextResponse.json(
      { error: "Not authenticated with Autodesk" },
      { status: 401 }
    );
  }
  
  if (!projectId) {
    return NextResponse.json(
      { error: "Project ID is required" },
      { status: 400 }
    );
  }
  
  try {
    const client = createAutodeskApiClient(accessToken);
    const apiProjectId = extractProjectIdForApi(projectId);
    
    const issueTypes = await client.issues.getTypes(apiProjectId);
    
    return NextResponse.json({ issueTypes });
  } catch (error) {
    console.error("Failed to fetch issue types:", error);
    return NextResponse.json(
      { error: "Failed to fetch issue types" },
      { status: 500 }
    );
  }
}
