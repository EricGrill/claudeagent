import { NextRequest, NextResponse } from "next/server";
import { createAutodeskApiClient, extractProjectIdForApi } from "@/lib/autodesk/api";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("autodesk_access_token")?.value;
  const projectId = request.nextUrl.searchParams.get("projectId");
  const status = request.nextUrl.searchParams.get("status");
  const search = request.nextUrl.searchParams.get("search");
  const limit = request.nextUrl.searchParams.get("limit");
  const offset = request.nextUrl.searchParams.get("offset");
  
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
    
    const issues = await client.issues.list(apiProjectId, {
      status: status ? status.split(",") : undefined,
      search: search || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
    
    return NextResponse.json({ issues });
  } catch (error) {
    console.error("Failed to fetch issues:", error);
    return NextResponse.json(
      { error: "Failed to fetch Autodesk issues" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("autodesk_access_token")?.value;
  
  if (!accessToken) {
    return NextResponse.json(
      { error: "Not authenticated with Autodesk" },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const { projectId, ...issueData } = body;
    
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }
    
    const client = createAutodeskApiClient(accessToken);
    const apiProjectId = extractProjectIdForApi(projectId);
    
    const issue = await client.issues.create(apiProjectId, issueData);
    
    return NextResponse.json({ issue });
  } catch (error) {
    console.error("Failed to create issue:", error);
    return NextResponse.json(
      { error: "Failed to create Autodesk issue" },
      { status: 500 }
    );
  }
}
