import { NextRequest, NextResponse } from "next/server";
import { createAutodeskApiClient, extractProjectIdForApi } from "@/lib/autodesk/api";

interface RouteParams {
  params: Promise<{ issueId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const accessToken = request.cookies.get("autodesk_access_token")?.value;
  const { issueId } = await params;
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
    
    const issue = await client.issues.get(apiProjectId, issueId);
    
    return NextResponse.json({ issue });
  } catch (error) {
    console.error("Failed to fetch issue:", error);
    return NextResponse.json(
      { error: "Failed to fetch issue details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const accessToken = request.cookies.get("autodesk_access_token")?.value;
  const { issueId } = await params;
  
  if (!accessToken) {
    return NextResponse.json(
      { error: "Not authenticated with Autodesk" },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const { projectId, ...updates } = body;
    
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }
    
    const client = createAutodeskApiClient(accessToken);
    const apiProjectId = extractProjectIdForApi(projectId);
    
    const issue = await client.issues.update(apiProjectId, issueId, updates);
    
    return NextResponse.json({ issue });
  } catch (error) {
    console.error("Failed to update issue:", error);
    return NextResponse.json(
      { error: "Failed to update issue" },
      { status: 500 }
    );
  }
}
