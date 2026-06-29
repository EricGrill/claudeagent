import { NextRequest, NextResponse } from "next/server";
import { createAutodeskApiClient, extractProjectIdForApi } from "@/lib/autodesk/api";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const accessToken = request.cookies.get("autodesk_access_token")?.value;
  const { projectId } = await params;
  
  if (!accessToken) {
    return NextResponse.json(
      { error: "Not authenticated with Autodesk" },
      { status: 401 }
    );
  }
  
  try {
    const client = createAutodeskApiClient(accessToken);
    const apiProjectId = extractProjectIdForApi(projectId);
    const project = await client.projects.getDetails(apiProjectId);
    
    return NextResponse.json({ project });
  } catch (error) {
    console.error("Failed to fetch project details:", error);
    return NextResponse.json(
      { error: "Failed to fetch project details" },
      { status: 500 }
    );
  }
}
