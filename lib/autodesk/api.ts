/**
 * Autodesk Platform Services API Client
 * 
 * Provides a unified interface for interacting with Autodesk Construction Cloud APIs
 * including Account Admin, Data Management, and Construction Issues.
 */

import {
  AutodeskAccount,
  AutodeskHub,
  AutodeskProject,
  AutodeskProjectDetails,
  AutodeskIssue,
  AutodeskIssueType,
  AutodeskIssueComment,
  AutodeskRootCauseCategory,
  AutodeskFolder,
  AutodeskItem,
  AutodeskVersion,
  AutodeskUser,
  AutodeskCompany,
  AutodeskPaginatedResponse,
  AutodeskSingleResponse,
  AutodeskError,
} from "./types";

const APS_BASE_URL = "https://developer.api.autodesk.com";

export interface AutodeskApiClient {
  hubs: {
    list(): Promise<AutodeskHub[]>;
    get(hubId: string): Promise<AutodeskHub>;
  };
  projects: {
    list(hubId: string): Promise<AutodeskProject[]>;
    get(hubId: string, projectId: string): Promise<AutodeskProject>;
    getDetails(projectId: string): Promise<AutodeskProjectDetails>;
    listByAccount(accountId: string, options?: ProjectListOptions): Promise<AutodeskProjectDetails[]>;
  };
  issues: {
    list(projectId: string, options?: IssueListOptions): Promise<AutodeskIssue[]>;
    get(projectId: string, issueId: string): Promise<AutodeskIssue>;
    create(projectId: string, issue: CreateIssuePayload): Promise<AutodeskIssue>;
    update(projectId: string, issueId: string, updates: UpdateIssuePayload): Promise<AutodeskIssue>;
    getTypes(projectId: string): Promise<AutodeskIssueType[]>;
    getRootCauses(projectId: string): Promise<AutodeskRootCauseCategory[]>;
    getComments(projectId: string, issueId: string): Promise<AutodeskIssueComment[]>;
    addComment(projectId: string, issueId: string, body: string): Promise<AutodeskIssueComment>;
  };
  folders: {
    get(projectId: string, folderId: string): Promise<AutodeskFolder>;
    getContents(projectId: string, folderId: string): Promise<(AutodeskFolder | AutodeskItem)[]>;
    getTopFolders(hubId: string, projectId: string): Promise<AutodeskFolder[]>;
  };
  items: {
    get(projectId: string, itemId: string): Promise<AutodeskItem>;
    getVersions(projectId: string, itemId: string): Promise<AutodeskVersion[]>;
  };
  users: {
    listAccountUsers(accountId: string, options?: UserListOptions): Promise<AutodeskUser[]>;
    listProjectUsers(projectId: string, options?: UserListOptions): Promise<AutodeskUser[]>;
    getMe(projectId: string): Promise<AutodeskUser>;
  };
  companies: {
    list(accountId: string): Promise<AutodeskCompany[]>;
    get(accountId: string, companyId: string): Promise<AutodeskCompany>;
  };
}

export interface ProjectListOptions {
  limit?: number;
  offset?: number;
  status?: string[];
  name?: string;
  platform?: "acc" | "bim360";
}

export interface IssueListOptions {
  limit?: number;
  offset?: number;
  status?: string[];
  issueTypeId?: string;
  assignedTo?: string;
  dueDate?: string;
  search?: string;
}

export interface UserListOptions {
  limit?: number;
  offset?: number;
  email?: string;
  name?: string;
}

export interface CreateIssuePayload {
  title: string;
  description?: string;
  issueTypeId: string;
  issueSubtypeId?: string;
  status?: string;
  assignedTo?: string;
  assignedToType?: "user" | "company" | "role";
  dueDate?: string;
  startDate?: string;
  locationId?: string;
  locationDetails?: string;
  rootCauseId?: string;
  customAttributes?: Array<{ attributeDefinitionId: string; value: unknown }>;
}

export interface UpdateIssuePayload {
  title?: string;
  description?: string;
  status?: string;
  assignedTo?: string;
  assignedToType?: "user" | "company" | "role";
  dueDate?: string;
  startDate?: string;
  locationId?: string;
  locationDetails?: string;
  rootCauseId?: string;
  customAttributes?: Array<{ attributeDefinitionId: string; value: unknown }>;
}

export class AutodeskApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorDetails?: AutodeskError
  ) {
    super(message);
    this.name = "AutodeskApiError";
  }
}

export function createAutodeskApiClient(accessToken: string, region: "US" | "EMEA" = "US"): AutodeskApiClient {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "x-ads-region": region,
  };

  async function request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${APS_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorDetails: AutodeskError | undefined;
      try {
        errorDetails = await response.json();
      } catch {
        // Response may not be JSON
      }
      throw new AutodeskApiError(
        errorDetails?.detail || `API request failed: ${response.status}`,
        response.status,
        errorDetails
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  function buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, String(v)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    }
    
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
  }

  return {
    hubs: {
      async list(): Promise<AutodeskHub[]> {
        const response = await request<AutodeskPaginatedResponse<AutodeskHub>>(
          "/project/v1/hubs"
        );
        return response.data;
      },

      async get(hubId: string): Promise<AutodeskHub> {
        const response = await request<AutodeskSingleResponse<AutodeskHub>>(
          `/project/v1/hubs/${hubId}`
        );
        return response.data;
      },
    },

    projects: {
      async list(hubId: string): Promise<AutodeskProject[]> {
        const response = await request<AutodeskPaginatedResponse<AutodeskProject>>(
          `/project/v1/hubs/${hubId}/projects`
        );
        return response.data;
      },

      async get(hubId: string, projectId: string): Promise<AutodeskProject> {
        const response = await request<AutodeskSingleResponse<AutodeskProject>>(
          `/project/v1/hubs/${hubId}/projects/${projectId}`
        );
        return response.data;
      },

      async getDetails(projectId: string): Promise<AutodeskProjectDetails> {
        const response = await request<AutodeskProjectDetails>(
          `/construction/admin/v1/projects/${projectId}`
        );
        return response;
      },

      async listByAccount(accountId: string, options?: ProjectListOptions): Promise<AutodeskProjectDetails[]> {
        const query = buildQueryString({
          limit: options?.limit || 100,
          offset: options?.offset || 0,
          "filter[status]": options?.status?.join(","),
          "filter[name]": options?.name,
          "filter[platform]": options?.platform,
        });
        
        const response = await request<{ results: AutodeskProjectDetails[] }>(
          `/construction/admin/v1/accounts/${accountId}/projects${query}`
        );
        return response.results;
      },
    },

    issues: {
      async list(projectId: string, options?: IssueListOptions): Promise<AutodeskIssue[]> {
        const query = buildQueryString({
          limit: options?.limit || 100,
          offset: options?.offset || 0,
          "filter[status]": options?.status?.join(","),
          "filter[issueTypeId]": options?.issueTypeId,
          "filter[assignedTo]": options?.assignedTo,
          "filter[dueDate]": options?.dueDate,
          "filter[search]": options?.search,
        });
        
        const response = await request<{ results: AutodeskIssue[] }>(
          `/construction/issues/v1/projects/${projectId}/issues${query}`
        );
        return response.results;
      },

      async get(projectId: string, issueId: string): Promise<AutodeskIssue> {
        const response = await request<AutodeskIssue>(
          `/construction/issues/v1/projects/${projectId}/issues/${issueId}`
        );
        return response;
      },

      async create(projectId: string, issue: CreateIssuePayload): Promise<AutodeskIssue> {
        const response = await request<AutodeskIssue>(
          `/construction/issues/v1/projects/${projectId}/issues`,
          {
            method: "POST",
            body: JSON.stringify(issue),
          }
        );
        return response;
      },

      async update(projectId: string, issueId: string, updates: UpdateIssuePayload): Promise<AutodeskIssue> {
        const response = await request<AutodeskIssue>(
          `/construction/issues/v1/projects/${projectId}/issues/${issueId}`,
          {
            method: "PATCH",
            body: JSON.stringify(updates),
          }
        );
        return response;
      },

      async getTypes(projectId: string): Promise<AutodeskIssueType[]> {
        const response = await request<{ results: AutodeskIssueType[] }>(
          `/construction/issues/v1/projects/${projectId}/issue-types?include=subtypes`
        );
        return response.results;
      },

      async getRootCauses(projectId: string): Promise<AutodeskRootCauseCategory[]> {
        const response = await request<{ results: AutodeskRootCauseCategory[] }>(
          `/construction/issues/v1/projects/${projectId}/issue-root-cause-categories?include=rootcauses`
        );
        return response.results;
      },

      async getComments(projectId: string, issueId: string): Promise<AutodeskIssueComment[]> {
        const response = await request<{ results: AutodeskIssueComment[] }>(
          `/construction/issues/v1/projects/${projectId}/issues/${issueId}/comments`
        );
        return response.results;
      },

      async addComment(projectId: string, issueId: string, body: string): Promise<AutodeskIssueComment> {
        const response = await request<AutodeskIssueComment>(
          `/construction/issues/v1/projects/${projectId}/issues/${issueId}/comments`,
          {
            method: "POST",
            body: JSON.stringify({ body }),
          }
        );
        return response;
      },
    },

    folders: {
      async get(projectId: string, folderId: string): Promise<AutodeskFolder> {
        const response = await request<AutodeskSingleResponse<AutodeskFolder>>(
          `/data/v1/projects/${projectId}/folders/${folderId}`
        );
        return response.data;
      },

      async getContents(projectId: string, folderId: string): Promise<(AutodeskFolder | AutodeskItem)[]> {
        const response = await request<AutodeskPaginatedResponse<AutodeskFolder | AutodeskItem>>(
          `/data/v1/projects/${projectId}/folders/${folderId}/contents`
        );
        return response.data;
      },

      async getTopFolders(hubId: string, projectId: string): Promise<AutodeskFolder[]> {
        const response = await request<AutodeskPaginatedResponse<AutodeskFolder>>(
          `/project/v1/hubs/${hubId}/projects/${projectId}/topFolders`
        );
        return response.data;
      },
    },

    items: {
      async get(projectId: string, itemId: string): Promise<AutodeskItem> {
        const response = await request<AutodeskSingleResponse<AutodeskItem>>(
          `/data/v1/projects/${projectId}/items/${itemId}`
        );
        return response.data;
      },

      async getVersions(projectId: string, itemId: string): Promise<AutodeskVersion[]> {
        const response = await request<AutodeskPaginatedResponse<AutodeskVersion>>(
          `/data/v1/projects/${projectId}/items/${itemId}/versions`
        );
        return response.data;
      },
    },

    users: {
      async listAccountUsers(accountId: string, options?: UserListOptions): Promise<AutodeskUser[]> {
        const query = buildQueryString({
          limit: options?.limit || 100,
          offset: options?.offset || 0,
          "filter[email]": options?.email,
          "filter[name]": options?.name,
        });
        
        const response = await request<{ results: AutodeskUser[] }>(
          `/construction/admin/v1/accounts/${accountId}/users${query}`
        );
        return response.results;
      },

      async listProjectUsers(projectId: string, options?: UserListOptions): Promise<AutodeskUser[]> {
        const query = buildQueryString({
          limit: options?.limit || 100,
          offset: options?.offset || 0,
          "filter[email]": options?.email,
          "filter[name]": options?.name,
        });
        
        const response = await request<{ results: AutodeskUser[] }>(
          `/construction/admin/v1/projects/${projectId}/users${query}`
        );
        return response.results;
      },

      async getMe(projectId: string): Promise<AutodeskUser> {
        const response = await request<AutodeskUser>(
          `/construction/issues/v1/projects/${projectId}/users/me`
        );
        return response;
      },
    },

    companies: {
      async list(accountId: string): Promise<AutodeskCompany[]> {
        const response = await request<AutodeskCompany[]>(
          `/hq/v1/accounts/${accountId}/companies`
        );
        return response;
      },

      async get(accountId: string, companyId: string): Promise<AutodeskCompany> {
        const response = await request<AutodeskCompany>(
          `/hq/v1/accounts/${accountId}/companies/${companyId}`
        );
        return response;
      },
    },
  };
}

export function extractAccountIdFromHub(hubId: string): string {
  return hubId.replace(/^b\./, "");
}

export function extractProjectIdForApi(projectId: string): string {
  return projectId.replace(/^b\./, "");
}

export function formatHubId(accountId: string): string {
  return accountId.startsWith("b.") ? accountId : `b.${accountId}`;
}

export function formatProjectId(projectId: string): string {
  return projectId.startsWith("b.") ? projectId : `b.${projectId}`;
}
