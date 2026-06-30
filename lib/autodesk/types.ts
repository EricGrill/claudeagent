/**
 * Autodesk Platform Services (APS) Type Definitions
 * 
 * These types define the data structures used when integrating with
 * Autodesk Construction Cloud (ACC) APIs.
 */

// ============================================================================
// Authentication Types
// ============================================================================

export interface AutodeskTokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token?: string;
}

export interface AutodeskAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  scopes: AutodeskScope[];
}

export type AutodeskScope =
  | "data:read"
  | "data:write"
  | "data:create"
  | "data:search"
  | "bucket:read"
  | "bucket:create"
  | "bucket:delete"
  | "account:read"
  | "account:write"
  | "user-profile:read"
  | "viewables:read";

export interface AutodeskAuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  userId: string | null;
}

// ============================================================================
// Account Admin Types
// ============================================================================

export interface AutodeskAccount {
  id: string;
  name: string;
  region: "US" | "EMEA";
}

export interface AutodeskHub {
  id: string;
  type: "hubs";
  attributes: {
    name: string;
    region: "US" | "EMEA";
    extension: {
      type: string;
      version: string;
      data: Record<string, unknown>;
    };
  };
}

export interface AutodeskProject {
  id: string;
  type: "projects";
  attributes: {
    name: string;
    scopes: string[];
    extension: {
      type: string;
      version: string;
      data: {
        projectType?: string;
      };
    };
  };
  relationships?: {
    hub?: {
      data: {
        type: "hubs";
        id: string;
      };
    };
    rootFolder?: {
      data: {
        type: "folders";
        id: string;
      };
    };
  };
}

export interface AutodeskProjectDetails {
  id: string;
  accountId: string;
  name: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  status: "active" | "pending" | "archived" | "suspended";
  jobNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateOrProvince?: string;
  postalCode?: string;
  country?: string;
  businessUnitId?: string;
  timezone?: string;
  language?: string;
  currency?: string;
  constructionType?: string;
  contractType?: string;
  lastModifiedAt: string;
  createdAt: string;
  imageUrl?: string;
  thumbnailImageUrl?: string;
  platform: "acc" | "bim360";
  products: string[];
}

// ============================================================================
// Construction Issues Types
// ============================================================================

export interface AutodeskIssue {
  id: string;
  containerId: string;
  displayId: number;
  title: string;
  description?: string;
  status: AutodeskIssueStatus;
  issueTypeId: string;
  issueSubtypeId?: string;
  assignedTo?: string;
  assignedToType?: "user" | "company" | "role";
  dueDate?: string;
  startDate?: string;
  locationId?: string;
  locationDetails?: string;
  rootCauseId?: string;
  published: boolean;
  permittedStatuses: AutodeskIssueStatus[];
  permittedAttributes: string[];
  commentCount: number;
  attachmentCount: number;
  openedBy: string;
  openedAt: string;
  closedBy?: string;
  closedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  snapshotUrn?: string;
  linkedDocuments?: AutodeskLinkedDocument[];
  linkedDocumentCount: number;
  customAttributes?: AutodeskCustomAttribute[];
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

export type AutodeskIssueStatus =
  | "draft"
  | "open"
  | "pending"
  | "in_progress"
  | "in_review"
  | "completed"
  | "not_approved"
  | "in_dispute"
  | "closed"
  | "void";

export interface AutodeskIssueType {
  id: string;
  containerId: string;
  title: string;
  isActive: boolean;
  orderIndex: number;
  permittedActions: string[];
  permittedAttributes: string[];
  subtypes?: AutodeskIssueSubtype[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface AutodeskIssueSubtype {
  id: string;
  title: string;
  isActive: boolean;
  parentId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface AutodeskLinkedDocument {
  id: string;
  type: string;
  urn: string;
  createdBy: string;
  createdAt: string;
  createdByName?: string;
  details?: {
    viewable?: {
      name: string;
      is3D: boolean;
      guid: string;
    };
    position?: {
      x: number;
      y: number;
      z: number;
    };
  };
}

export interface AutodeskCustomAttribute {
  attributeDefinitionId: string;
  value: string | number | string[];
}

export interface AutodeskIssueComment {
  id: string;
  issueId: string;
  body: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface AutodeskRootCauseCategory {
  id: string;
  containerId: string;
  title: string;
  isActive: boolean;
  rootCauses?: AutodeskRootCause[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface AutodeskRootCause {
  id: string;
  title: string;
  isActive: boolean;
  parentId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// ============================================================================
// Data Management Types
// ============================================================================

export interface AutodeskFolder {
  id: string;
  type: "folders";
  attributes: {
    name: string;
    displayName: string;
    createTime: string;
    createUserName: string;
    lastModifiedTime: string;
    lastModifiedUserName: string;
    objectCount: number;
    hidden: boolean;
    extension: {
      type: string;
      version: string;
      data: Record<string, unknown>;
    };
  };
  relationships?: {
    parent?: {
      data: {
        type: "folders";
        id: string;
      };
    };
    contents?: {
      links: {
        related: {
          href: string;
        };
      };
    };
  };
}

export interface AutodeskItem {
  id: string;
  type: "items";
  attributes: {
    displayName: string;
    createTime: string;
    createUserName: string;
    lastModifiedTime: string;
    lastModifiedUserName: string;
    hidden: boolean;
    extension: {
      type: string;
      version: string;
      data: {
        sourceFileName?: string;
      };
    };
  };
  relationships?: {
    tip?: {
      data: {
        type: "versions";
        id: string;
      };
    };
    parent?: {
      data: {
        type: "folders";
        id: string;
      };
    };
  };
}

export interface AutodeskVersion {
  id: string;
  type: "versions";
  attributes: {
    name: string;
    displayName: string;
    createTime: string;
    createUserName: string;
    lastModifiedTime: string;
    lastModifiedUserName: string;
    versionNumber: number;
    mimeType: string;
    fileType: string;
    storageSize: number;
    extension: {
      type: string;
      version: string;
      data: Record<string, unknown>;
    };
  };
  relationships?: {
    item?: {
      data: {
        type: "items";
        id: string;
      };
    };
    storage?: {
      data: {
        type: "objects";
        id: string;
      };
    };
    derivatives?: {
      data: {
        type: "derivatives";
        id: string;
      };
    };
  };
}

// ============================================================================
// User Types
// ============================================================================

export interface AutodeskUser {
  id: string;
  accountId: string;
  role?: string;
  status: "active" | "pending" | "inactive";
  companyId?: string;
  companyName?: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  autodeskId?: string;
  imageUrl?: string;
  phone?: string;
  jobTitle?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateOrProvince?: string;
  postalCode?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutodeskCompany {
  id: string;
  accountId: string;
  name: string;
  trade?: string;
  phone?: string;
  webUrl?: string;
  description?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateOrProvince?: string;
  postalCode?: string;
  country?: string;
  imageUrl?: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface AutodeskPaginatedResponse<T> {
  data: T[];
  pagination?: {
    limit: number;
    offset: number;
    totalResults: number;
  };
  links?: {
    self?: { href: string };
    first?: { href: string };
    prev?: { href: string };
    next?: { href: string };
  };
}

export interface AutodeskSingleResponse<T> {
  data: T;
  included?: unknown[];
  links?: {
    self?: { href: string };
  };
}

export interface AutodeskError {
  type: string;
  title: string;
  detail: string;
  status?: number;
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface AutodeskWebhook {
  hookId: string;
  tenant: string;
  callbackUrl: string;
  createdBy: string;
  event: AutodeskWebhookEvent;
  createdDate: string;
  lastUpdatedDate: string;
  system: string;
  creatorType: string;
  status: "active" | "inactive";
  autoReactivateHook: boolean;
  scope: {
    folder?: string;
    project?: string;
    hub?: string;
  };
  hookAttribute?: Record<string, unknown>;
}

export type AutodeskWebhookEvent =
  | "dm.version.added"
  | "dm.version.modified"
  | "dm.version.deleted"
  | "dm.version.moved"
  | "dm.folder.added"
  | "dm.folder.modified"
  | "dm.folder.deleted"
  | "dm.folder.moved"
  | "dm.lineage.reserved"
  | "dm.lineage.unreserved";

export interface AutodeskWebhookPayload {
  hookId: string;
  eventType: AutodeskWebhookEvent;
  timestamp: string;
  payload: {
    ext: {
      [key: string]: unknown;
    };
    lineageUrn?: string;
    version?: string;
    modifiedTime?: string;
    modifiedBy?: string;
    projectId?: string;
    ancestors?: Array<{
      urn: string;
      name: string;
    }>;
  };
}

// ============================================================================
// Integration/Sync Types
// ============================================================================

export interface AutodeskSyncConfig {
  accountId: string;
  projectId: string;
  syncIssues: boolean;
  syncDocuments: boolean;
  syncUsers: boolean;
  lastSyncAt?: string;
  webhookEnabled: boolean;
  webhookId?: string;
}

export interface AutodeskProjectLink {
  autodeskProjectId: string;
  autodeskAccountId: string;
  autodeskProjectName: string;
  claimzeroProjectId: string;
  linkedAt: string;
  linkedBy: string;
  syncConfig: AutodeskSyncConfig;
}

export interface AutodeskIssueMappedToClaim {
  autodeskIssueId: string;
  claimzeroClaimId: string;
  mappedAt: string;
  mappedBy: string;
  autoSync: boolean;
}
