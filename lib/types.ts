export interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "completed" | "on-hold" | "archived";
  riskLevel: "low" | "medium" | "high" | "critical";
  createdAt: string;
  updatedAt: string;
  owner: string;
  claimsCount: number;
  budget: number;
  progress: number;
  autodeskIntegration?: AutodeskProjectIntegration;
}

export interface AutodeskProjectIntegration {
  enabled: boolean;
  autodeskProjectId: string;
  autodeskAccountId: string;
  autodeskProjectName: string;
  linkedAt: string;
  linkedBy: string;
  syncSettings: {
    syncIssues: boolean;
    syncDocuments: boolean;
    syncUsers: boolean;
    autoImportNewIssues: boolean;
  };
  lastSyncAt?: string;
  syncStatus?: "idle" | "syncing" | "error";
  syncError?: string;
}

export interface Claim {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: "pending" | "approved" | "rejected" | "under-review";
  amount: number;
  submittedAt: string;
  submittedBy: string;
  autodeskIssueLink?: AutodeskIssueLink;
}

export interface AutodeskIssueLink {
  autodeskIssueId: string;
  autodeskProjectId: string;
  displayId: number;
  syncEnabled: boolean;
  linkedAt: string;
  linkedBy: string;
  lastSyncedAt?: string;
}
