import { prisma } from '../db';
import { 
  RiskThreshold, 
  RiskCategory, 
  ProjectStatus 
} from '@prisma/client';
import { 
  startOfWeek, 
  endOfWeek, 
  subWeeks, 
  format 
} from 'date-fns';
import type {
  WeeklyNewsletterData,
  PortfolioRiskSummary,
  ProjectRiskSnapshot,
  RiskSignalSummary,
  ThresholdCrossing,
  RiskCategoryTrend,
  NewsletterGenerationOptions,
} from '../types/newsletter';

const THRESHOLD_SEVERITY: Record<RiskThreshold, number> = {
  LOW: 1,
  WATCH: 2,
  ELEVATED: 3,
  CRITICAL: 4,
};

function getThresholdFromScore(score: number): RiskThreshold {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'ELEVATED';
  if (score >= 40) return 'WATCH';
  return 'LOW';
}

function getTrend(current: number, previous: number): 'improving' | 'stable' | 'worsening' {
  const delta = current - previous;
  if (delta > 5) return 'worsening';
  if (delta < -5) return 'improving';
  return 'stable';
}

export async function aggregateWeeklyRiskData(
  options: NewsletterGenerationOptions
): Promise<WeeklyNewsletterData> {
  const { tenantId, weekStart: customWeekStart, weekEnd: customWeekEnd } = options;

  const now = new Date();
  const weekEnd = customWeekEnd || endOfWeek(now, { weekStartsOn: 1 });
  const weekStart = customWeekStart || startOfWeek(now, { weekStartsOn: 1 });
  const previousWeekStart = subWeeks(weekStart, 1);
  const previousWeekEnd = subWeeks(weekEnd, 1);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      portfolios: {
        include: {
          projects: {
            where: { status: { not: ProjectStatus.CANCELLED } },
          },
        },
      },
    },
  });

  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  const allProjects = tenant.portfolios.flatMap(p => p.projects);
  const projectIds = allProjects.map(p => p.id);

  const [currentScores, previousScores, newSignals, resolvedSignals, allActiveSignals] = await Promise.all([
    prisma.riskScore.findMany({
      where: {
        projectId: { in: projectIds },
        weekStart: { gte: weekStart },
        weekEnd: { lte: weekEnd },
      },
      orderBy: { computedAt: 'desc' },
    }),
    prisma.riskScore.findMany({
      where: {
        projectId: { in: projectIds },
        weekStart: { gte: previousWeekStart },
        weekEnd: { lte: previousWeekEnd },
      },
      orderBy: { computedAt: 'desc' },
    }),
    prisma.riskSignal.findMany({
      where: {
        projectId: { in: projectIds },
        detectedAt: { gte: weekStart, lte: weekEnd },
      },
      include: { project: true },
      orderBy: { severity: 'desc' },
    }),
    prisma.riskSignal.findMany({
      where: {
        projectId: { in: projectIds },
        resolvedAt: { gte: weekStart, lte: weekEnd },
      },
      include: { project: true },
      orderBy: { resolvedAt: 'desc' },
    }),
    prisma.riskSignal.findMany({
      where: {
        projectId: { in: projectIds },
        status: 'ACTIVE',
      },
      include: { project: true },
    }),
  ]);

  const currentScoreMap = new Map<string, typeof currentScores[0]>();
  for (const score of currentScores) {
    if (!currentScoreMap.has(score.projectId)) {
      currentScoreMap.set(score.projectId, score);
    }
  }

  const previousScoreMap = new Map<string, typeof previousScores[0]>();
  for (const score of previousScores) {
    if (!previousScoreMap.has(score.projectId)) {
      previousScoreMap.set(score.projectId, score);
    }
  }

  const portfolioSummary = calculatePortfolioSummary(
    tenant.portfolios[0],
    allProjects,
    currentScoreMap,
    previousScoreMap
  );

  const projectSnapshots = buildProjectSnapshots(
    allProjects,
    currentScoreMap,
    previousScoreMap
  );

  const thresholdCrossings = findThresholdCrossings(projectSnapshots);

  const projectsToWatch = projectSnapshots
    .filter(p => 
      p.threshold === 'CRITICAL' || 
      p.threshold === 'ELEVATED' || 
      p.thresholdChanged ||
      p.scoreDelta > 10
    )
    .sort((a, b) => b.currentScore - a.currentScore)
    .slice(0, 10);

  const topRiskThemes = calculateRiskThemes(
    projectSnapshots,
    currentScoreMap,
    allActiveSignals
  );

  const riskCounts = {
    total: allActiveSignals.length,
    new: newSignals.length,
    worsening: projectSnapshots.filter(p => p.scoreDelta > 10).length,
    resolved: resolvedSignals.length,
    critical: projectSnapshots.filter(p => p.threshold === 'CRITICAL').length,
    watch: projectSnapshots.filter(p => p.threshold === 'WATCH').length,
  };

  const projectBreakdown = {
    critical: projectSnapshots.filter(p => p.threshold === 'CRITICAL'),
    elevated: projectSnapshots.filter(p => p.threshold === 'ELEVATED'),
    watch: projectSnapshots.filter(p => p.threshold === 'WATCH'),
    low: projectSnapshots.filter(p => p.threshold === 'LOW'),
  };

  return {
    tenantId,
    tenantName: tenant.name,
    weekStart,
    weekEnd,
    generatedAt: new Date(),
    portfolioSummary,
    riskCounts,
    projectsToWatch,
    thresholdCrossings,
    newSignals: formatSignals(newSignals),
    resolvedSignals: formatSignals(resolvedSignals),
    topRiskThemes,
    projectBreakdown,
  };
}

function calculatePortfolioSummary(
  portfolio: { id: string; name: string } | undefined,
  projects: Array<{ id: string; status: ProjectStatus }>,
  currentScores: Map<string, { overallScore: number }>,
  previousScores: Map<string, { overallScore: number }>
): PortfolioRiskSummary {
  const activeProjects = projects.filter(p => p.status === ProjectStatus.ACTIVE);
  
  let totalCurrentScore = 0;
  let totalPreviousScore = 0;
  let scoredProjectCount = 0;

  for (const project of activeProjects) {
    const current = currentScores.get(project.id);
    const previous = previousScores.get(project.id);
    
    if (current) {
      totalCurrentScore += current.overallScore;
      scoredProjectCount++;
    }
    if (previous) {
      totalPreviousScore += previous.overallScore;
    }
  }

  const averageRiskScore = scoredProjectCount > 0 
    ? totalCurrentScore / scoredProjectCount 
    : 0;
  const previousAverageScore = scoredProjectCount > 0 
    ? totalPreviousScore / scoredProjectCount 
    : 0;
  const scoreDelta = averageRiskScore - previousAverageScore;

  return {
    portfolioId: portfolio?.id || 'default',
    portfolioName: portfolio?.name || 'Portfolio',
    totalProjects: projects.length,
    activeProjects: activeProjects.length,
    averageRiskScore: Math.round(averageRiskScore * 10) / 10,
    previousAverageScore: Math.round(previousAverageScore * 10) / 10,
    scoreDelta: Math.round(scoreDelta * 10) / 10,
    trend: getTrend(averageRiskScore, previousAverageScore),
  };
}

function buildProjectSnapshots(
  projects: Array<{ id: string; name: string; location: string | null }>,
  currentScores: Map<string, {
    overallScore: number;
    scheduleScore: number | null;
    designScore: number | null;
    costScore: number | null;
    disputeScore: number | null;
    threshold: RiskThreshold;
  }>,
  previousScores: Map<string, { overallScore: number; threshold: RiskThreshold }>
): ProjectRiskSnapshot[] {
  return projects.map(project => {
    const current = currentScores.get(project.id);
    const previous = previousScores.get(project.id);

    const currentScore = current?.overallScore || 0;
    const previousScore = previous?.overallScore || 0;
    const currentThreshold = current?.threshold || getThresholdFromScore(currentScore);
    const previousThreshold = previous?.threshold || null;

    const categoryScores: Record<string, number | null> = {
      SCHEDULE: current?.scheduleScore ?? null,
      DESIGN: current?.designScore ?? null,
      COST: current?.costScore ?? null,
      DISPUTE: current?.disputeScore ?? null,
    };

    let topCategory: RiskCategory | null = null;
    let topScore = 0;
    for (const [cat, score] of Object.entries(categoryScores)) {
      if (score !== null && score > topScore) {
        topScore = score;
        topCategory = cat as RiskCategory;
      }
    }

    return {
      projectId: project.id,
      projectName: project.name,
      location: project.location,
      currentScore,
      previousScore,
      scoreDelta: currentScore - previousScore,
      threshold: currentThreshold,
      previousThreshold,
      thresholdChanged: previousThreshold !== null && currentThreshold !== previousThreshold,
      scheduleScore: current?.scheduleScore ?? null,
      designScore: current?.designScore ?? null,
      costScore: current?.costScore ?? null,
      disputeScore: current?.disputeScore ?? null,
      topRiskCategory: topCategory,
    };
  });
}

function findThresholdCrossings(snapshots: ProjectRiskSnapshot[]): ThresholdCrossing[] {
  return snapshots
    .filter(s => s.thresholdChanged && s.previousThreshold !== null)
    .map(s => ({
      projectId: s.projectId,
      projectName: s.projectName,
      previousThreshold: s.previousThreshold!,
      currentThreshold: s.threshold,
      direction: THRESHOLD_SEVERITY[s.threshold] > THRESHOLD_SEVERITY[s.previousThreshold!]
        ? 'escalated' as const
        : 'deescalated' as const,
      currentScore: s.currentScore,
    }))
    .sort((a, b) => {
      if (a.direction !== b.direction) {
        return a.direction === 'escalated' ? -1 : 1;
      }
      return b.currentScore - a.currentScore;
    });
}

function calculateRiskThemes(
  snapshots: ProjectRiskSnapshot[],
  currentScores: Map<string, { 
    scheduleScore: number | null;
    designScore: number | null;
    costScore: number | null;
    disputeScore: number | null;
  }>,
  activeSignals: Array<{ category: RiskCategory; project: { id: string; name: string } }>
): RiskCategoryTrend[] {
  const categories: RiskCategory[] = ['SCHEDULE', 'DESIGN', 'COST', 'DISPUTE'];
  const themes: RiskCategoryTrend[] = [];

  for (const category of categories) {
    const signalsInCategory = activeSignals.filter(s => s.category === category);
    const projectsWithCategory = new Map<string, { name: string; score: number }>();

    for (const signal of signalsInCategory) {
      const score = currentScores.get(signal.project.id);
      let categoryScore = 0;
      
      switch (category) {
        case 'SCHEDULE':
          categoryScore = score?.scheduleScore ?? 0;
          break;
        case 'DESIGN':
          categoryScore = score?.designScore ?? 0;
          break;
        case 'COST':
          categoryScore = score?.costScore ?? 0;
          break;
        case 'DISPUTE':
          categoryScore = score?.disputeScore ?? 0;
          break;
      }

      if (!projectsWithCategory.has(signal.project.id) || 
          projectsWithCategory.get(signal.project.id)!.score < categoryScore) {
        projectsWithCategory.set(signal.project.id, {
          name: signal.project.name,
          score: categoryScore,
        });
      }
    }

    if (projectsWithCategory.size > 0) {
      const topProjects = Array.from(projectsWithCategory.entries())
        .map(([id, data]) => ({
          projectId: id,
          projectName: data.name,
          score: data.score,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      const avgScore = topProjects.reduce((sum, p) => sum + p.score, 0) / topProjects.length;

      themes.push({
        category,
        projectCount: projectsWithCategory.size,
        averageScore: Math.round(avgScore * 10) / 10,
        trend: 'stable',
        topProjects,
      });
    }
  }

  return themes.sort((a, b) => b.projectCount - a.projectCount);
}

function formatSignals(
  signals: Array<{
    id: string;
    projectId: string;
    category: RiskCategory;
    severity: any;
    title: string;
    description: string | null;
    status: any;
    detectedAt: Date;
    project: { name: string };
  }>
): RiskSignalSummary[] {
  return signals.map(s => ({
    signalId: s.id,
    projectId: s.projectId,
    projectName: s.project.name,
    category: s.category,
    severity: s.severity,
    title: s.title,
    description: s.description,
    status: s.status,
    detectedAt: s.detectedAt,
  }));
}

export async function getNewsletterRecipients(tenantId: string) {
  const config = await prisma.newsletterConfig.findUnique({
    where: { tenantId },
    include: {
      subscriptions: {
        where: { isActive: true },
        include: {
          user: true,
        },
      },
    },
  });

  if (!config) {
    return [];
  }

  return config.subscriptions.map(sub => ({
    userId: sub.user.id,
    email: sub.user.email,
    name: sub.user.name,
    role: sub.user.role,
  }));
}
