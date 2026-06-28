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
}
