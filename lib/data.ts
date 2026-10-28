import { Project, Claim } from "./types";

export const projects: Project[] = [
  {
    id: "proj-001",
    name: "Infrastructure Modernization",
    description:
      "Complete overhaul of legacy infrastructure systems to modern cloud-based solutions with improved scalability and security.",
    status: "active",
    riskLevel: "medium",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-06-20T14:30:00Z",
    owner: "Sarah Chen",
    claimsCount: 12,
    budget: 2500000,
    progress: 65,
  },
  {
    id: "proj-002",
    name: "Data Migration Initiative",
    description:
      "Migration of all historical data from on-premises systems to secure cloud storage with full audit trail.",
    status: "active",
    riskLevel: "high",
    createdAt: "2024-02-01T09:00:00Z",
    updatedAt: "2024-06-18T11:15:00Z",
    owner: "Michael Rodriguez",
    claimsCount: 8,
    budget: 1800000,
    progress: 40,
  },
  {
    id: "proj-003",
    name: "Security Compliance Audit",
    description:
      "Comprehensive security audit to ensure compliance with SOC 2 Type II and ISO 27001 standards.",
    status: "completed",
    riskLevel: "low",
    createdAt: "2024-03-10T08:30:00Z",
    updatedAt: "2024-05-30T16:45:00Z",
    owner: "Emily Watson",
    claimsCount: 5,
    budget: 450000,
    progress: 100,
  },
  {
    id: "proj-004",
    name: "Customer Portal Redesign",
    description:
      "Complete redesign of the customer-facing portal with improved UX, accessibility, and mobile responsiveness.",
    status: "on-hold",
    riskLevel: "medium",
    createdAt: "2024-04-05T13:00:00Z",
    updatedAt: "2024-06-01T10:00:00Z",
    owner: "David Park",
    claimsCount: 3,
    budget: 750000,
    progress: 25,
  },
  {
    id: "proj-005",
    name: "AI Risk Assessment Engine",
    description:
      "Development of machine learning models to automatically assess and flag high-risk claims for manual review.",
    status: "active",
    riskLevel: "critical",
    createdAt: "2024-05-20T11:30:00Z",
    updatedAt: "2024-06-22T09:20:00Z",
    owner: "Lisa Thompson",
    claimsCount: 0,
    budget: 3200000,
    progress: 15,
  },
];

export const claims: Claim[] = [
  {
    id: "claim-001",
    projectId: "proj-001",
    title: "Server Hardware Procurement",
    description: "Purchase of new server hardware for the data center",
    status: "approved",
    amount: 125000,
    submittedAt: "2024-03-15T10:30:00Z",
    submittedBy: "John Smith",
  },
  {
    id: "claim-002",
    projectId: "proj-001",
    title: "Cloud Services Q2",
    description: "AWS infrastructure costs for Q2 2024",
    status: "approved",
    amount: 85000,
    submittedAt: "2024-04-01T09:00:00Z",
    submittedBy: "Jane Doe",
  },
  {
    id: "claim-003",
    projectId: "proj-002",
    title: "Data Migration Tools License",
    description: "Annual license for enterprise data migration suite",
    status: "under-review",
    amount: 45000,
    submittedAt: "2024-05-10T14:15:00Z",
    submittedBy: "Robert Johnson",
  },
  {
    id: "claim-004",
    projectId: "proj-002",
    title: "External Consultant Fees",
    description: "Database migration specialist consulting fees",
    status: "pending",
    amount: 95000,
    submittedAt: "2024-06-01T11:00:00Z",
    submittedBy: "Maria Garcia",
  },
];

export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function getClaimsByProjectId(projectId: string): Claim[] {
  return claims.filter((c) => c.projectId === projectId);
}
