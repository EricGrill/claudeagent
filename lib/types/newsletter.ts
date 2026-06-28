import { 
  RiskThreshold, 
  RiskCategory, 
  SignalSeverity, 
  SignalStatus,
  NewsletterFrequency,
  UserRole 
} from '@prisma/client';

export interface PortfolioRiskSummary {
  portfolioId: string;
  portfolioName: string;
  totalProjects: number;
  activeProjects: number;
  averageRiskScore: number;
  previousAverageScore: number;
  scoreDelta: number;
  trend: 'improving' | 'stable' | 'worsening';
}

export interface ProjectRiskSnapshot {
  projectId: string;
  projectName: string;
  location: string | null;
  currentScore: number;
  previousScore: number;
  scoreDelta: number;
  threshold: RiskThreshold;
  previousThreshold: RiskThreshold | null;
  thresholdChanged: boolean;
  scheduleScore: number | null;
  designScore: number | null;
  costScore: number | null;
  disputeScore: number | null;
  topRiskCategory: RiskCategory | null;
}

export interface RiskSignalSummary {
  signalId: string;
  projectId: string;
  projectName: string;
  category: RiskCategory;
  severity: SignalSeverity;
  title: string;
  description: string | null;
  status: SignalStatus;
  detectedAt: Date;
}

export interface ThresholdCrossing {
  projectId: string;
  projectName: string;
  previousThreshold: RiskThreshold;
  currentThreshold: RiskThreshold;
  direction: 'escalated' | 'deescalated';
  currentScore: number;
}

export interface RiskCategoryTrend {
  category: RiskCategory;
  projectCount: number;
  averageScore: number;
  trend: 'improving' | 'stable' | 'worsening';
  topProjects: Array<{
    projectId: string;
    projectName: string;
    score: number;
  }>;
}

export interface WeeklyNewsletterData {
  tenantId: string;
  tenantName: string;
  weekStart: Date;
  weekEnd: Date;
  generatedAt: Date;

  portfolioSummary: PortfolioRiskSummary;
  
  riskCounts: {
    total: number;
    new: number;
    worsening: number;
    resolved: number;
    critical: number;
    watch: number;
  };

  projectsToWatch: ProjectRiskSnapshot[];
  
  thresholdCrossings: ThresholdCrossing[];
  
  newSignals: RiskSignalSummary[];
  
  resolvedSignals: RiskSignalSummary[];
  
  topRiskThemes: RiskCategoryTrend[];
  
  projectBreakdown: {
    critical: ProjectRiskSnapshot[];
    watch: ProjectRiskSnapshot[];
    elevated: ProjectRiskSnapshot[];
    low: ProjectRiskSnapshot[];
  };
}

export interface NewsletterRecipient {
  userId: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export interface NewsletterGenerationOptions {
  tenantId: string;
  weekStart?: Date;
  weekEnd?: Date;
  includeAnonymized?: boolean;
  previewMode?: boolean;
}

export interface NewsletterSendResult {
  issueId: string;
  sentCount: number;
  failedCount: number;
  errors: Array<{
    email: string;
    error: string;
  }>;
}

export interface SubscriptionPreferences {
  userId: string;
  configId: string;
  frequency: NewsletterFrequency;
  isActive: boolean;
}
