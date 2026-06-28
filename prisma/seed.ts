import { PrismaClient } from '@prisma/client';
import { subWeeks, startOfWeek, endOfWeek } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'acme-construction' },
    update: {},
    create: {
      name: 'Acme Construction Group',
      slug: 'acme-construction',
    },
  });

  console.log('Created tenant:', tenant.name);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email_tenantId: { email: 'john@acme.com', tenantId: tenant.id } },
      update: {},
      create: {
        email: 'john@acme.com',
        name: 'John Smith',
        role: 'OWNER',
        tenantId: tenant.id,
      },
    }),
    prisma.user.upsert({
      where: { email_tenantId: { email: 'sarah@acme.com', tenantId: tenant.id } },
      update: {},
      create: {
        email: 'sarah@acme.com',
        name: 'Sarah Johnson',
        role: 'GENERAL_CONTRACTOR',
        tenantId: tenant.id,
      },
    }),
    prisma.user.upsert({
      where: { email_tenantId: { email: 'mike@lender.com', tenantId: tenant.id } },
      update: {},
      create: {
        email: 'mike@lender.com',
        name: 'Mike Williams',
        role: 'LENDER',
        tenantId: tenant.id,
      },
    }),
  ]);

  console.log('Created users:', users.length);

  const portfolio = await prisma.portfolio.upsert({
    where: { id: 'portfolio-main' },
    update: {},
    create: {
      id: 'portfolio-main',
      name: 'Main Portfolio',
      description: 'Primary construction portfolio',
      tenantId: tenant.id,
    },
  });

  console.log('Created portfolio:', portfolio.name);

  const projects = await Promise.all([
    prisma.project.upsert({
      where: { id: 'project-tower' },
      update: {},
      create: {
        id: 'project-tower',
        name: 'Downtown Office Tower',
        description: '45-story commercial office building',
        location: 'New York, NY',
        status: 'ACTIVE',
        portfolioId: portfolio.id,
      },
    }),
    prisma.project.upsert({
      where: { id: 'project-hospital' },
      update: {},
      create: {
        id: 'project-hospital',
        name: 'Regional Medical Center',
        description: 'New wing construction',
        location: 'Chicago, IL',
        status: 'ACTIVE',
        portfolioId: portfolio.id,
      },
    }),
    prisma.project.upsert({
      where: { id: 'project-stadium' },
      update: {},
      create: {
        id: 'project-stadium',
        name: 'Sports Complex Renovation',
        description: 'Major stadium renovation',
        location: 'Los Angeles, CA',
        status: 'ACTIVE',
        portfolioId: portfolio.id,
      },
    }),
    prisma.project.upsert({
      where: { id: 'project-bridge' },
      update: {},
      create: {
        id: 'project-bridge',
        name: 'Harbor Bridge Replacement',
        description: 'Infrastructure bridge project',
        location: 'Seattle, WA',
        status: 'ACTIVE',
        portfolioId: portfolio.id,
      },
    }),
    prisma.project.upsert({
      where: { id: 'project-school' },
      update: {},
      create: {
        id: 'project-school',
        name: 'Elementary School Campus',
        description: 'New K-5 school construction',
        location: 'Denver, CO',
        status: 'ACTIVE',
        portfolioId: portfolio.id,
      },
    }),
  ]);

  console.log('Created projects:', projects.length);

  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const previousWeekStart = subWeeks(currentWeekStart, 1);
  const previousWeekEnd = subWeeks(currentWeekEnd, 1);

  const riskScoreData = [
    { projectId: 'project-tower', current: 75, previous: 65, schedule: 80, design: 70, cost: 75, dispute: 60 },
    { projectId: 'project-hospital', current: 45, previous: 55, schedule: 40, design: 50, cost: 45, dispute: 30 },
    { projectId: 'project-stadium', current: 85, previous: 70, schedule: 90, design: 80, cost: 85, dispute: 75 },
    { projectId: 'project-bridge', current: 55, previous: 50, schedule: 60, design: 45, cost: 55, dispute: 40 },
    { projectId: 'project-school', current: 30, previous: 35, schedule: 25, design: 30, cost: 35, dispute: 20 },
  ];

  for (const data of riskScoreData) {
    await prisma.riskScore.create({
      data: {
        projectId: data.projectId,
        overallScore: data.previous,
        scheduleScore: data.schedule - 10,
        designScore: data.design - 5,
        costScore: data.cost - 10,
        disputeScore: data.dispute - 5,
        threshold: getThreshold(data.previous),
        weekStart: previousWeekStart,
        weekEnd: previousWeekEnd,
      },
    });

    await prisma.riskScore.create({
      data: {
        projectId: data.projectId,
        overallScore: data.current,
        scheduleScore: data.schedule,
        designScore: data.design,
        costScore: data.cost,
        disputeScore: data.dispute,
        threshold: getThreshold(data.current),
        weekStart: currentWeekStart,
        weekEnd: currentWeekEnd,
      },
    });
  }

  console.log('Created risk scores for all projects');

  const signals = [
    {
      projectId: 'project-tower',
      category: 'SCHEDULE' as const,
      severity: 'HIGH' as const,
      title: 'Foundation work delayed by 2 weeks',
      description: 'Unexpected soil conditions require additional excavation',
      status: 'ACTIVE' as const,
    },
    {
      projectId: 'project-tower',
      category: 'COST' as const,
      severity: 'MEDIUM' as const,
      title: 'Steel prices increased 15%',
      description: 'Market volatility affecting material costs',
      status: 'ACTIVE' as const,
    },
    {
      projectId: 'project-stadium',
      category: 'SCHEDULE' as const,
      severity: 'CRITICAL' as const,
      title: 'Major contractor dispute',
      description: 'MEP contractor threatening to walk off project',
      status: 'ACTIVE' as const,
    },
    {
      projectId: 'project-stadium',
      category: 'DISPUTE' as const,
      severity: 'HIGH' as const,
      title: 'Design change claims pending',
      description: 'Multiple RFIs for structural modifications',
      status: 'ACTIVE' as const,
    },
    {
      projectId: 'project-bridge',
      category: 'WEATHER' as const,
      severity: 'MEDIUM' as const,
      title: 'Seasonal weather window closing',
      description: 'Critical concrete pours must complete before winter',
      status: 'ACTIVE' as const,
    },
    {
      projectId: 'project-hospital',
      category: 'REGULATORY' as const,
      severity: 'LOW' as const,
      title: 'Permit inspection scheduled',
      description: 'Routine inspection next week',
      status: 'MONITORING' as const,
    },
    {
      projectId: 'project-hospital',
      category: 'COST' as const,
      severity: 'MEDIUM' as const,
      title: 'Budget contingency used',
      description: 'Change order approved, contingency reduced to 3%',
      status: 'RESOLVED' as const,
      resolvedAt: new Date(),
    },
    {
      projectId: 'project-school',
      category: 'DESIGN' as const,
      severity: 'LOW' as const,
      title: 'Minor scope clarification needed',
      description: 'Playground equipment specs being finalized',
      status: 'ACTIVE' as const,
    },
  ];

  for (const signal of signals) {
    await prisma.riskSignal.create({
      data: {
        ...signal,
        detectedAt: signal.status === 'RESOLVED' ? subWeeks(new Date(), 1) : new Date(),
      },
    });
  }

  console.log('Created risk signals:', signals.length);

  const config = await prisma.newsletterConfig.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      frequency: 'WEEKLY',
      dayOfWeek: 1,
      hourOfDay: 8,
      isActive: true,
    },
  });

  console.log('Created newsletter config');

  for (const user of users) {
    await prisma.newsletterSubscription.upsert({
      where: {
        userId_configId: {
          userId: user.id,
          configId: config.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        configId: config.id,
        isActive: true,
      },
    });
  }

  console.log('Created newsletter subscriptions for all users');

  console.log('Seed completed successfully!');
}

function getThreshold(score: number): 'LOW' | 'WATCH' | 'ELEVATED' | 'CRITICAL' {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'ELEVATED';
  if (score >= 40) return 'WATCH';
  return 'LOW';
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
