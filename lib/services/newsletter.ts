import { prisma } from '../db';
import { format } from 'date-fns';
import { 
  aggregateWeeklyRiskData, 
  getNewsletterRecipients 
} from './risk-aggregation';
import { sendEmail, sendBulkEmails } from './email';
import { renderNewsletterToHtml } from '../templates/newsletter-email';
import { generateNewsletterPDF } from './pdf-generator';
import type { 
  WeeklyNewsletterData, 
  NewsletterGenerationOptions,
  NewsletterSendResult,
  NewsletterRecipient,
} from '../types/newsletter';
import { NewsletterStatus } from '@prisma/client';

export interface GenerateNewsletterResult {
  data: WeeklyNewsletterData;
  htmlContent: string;
  pdfBuffer?: Buffer;
  issueId?: string;
}

export async function generateNewsletter(
  options: NewsletterGenerationOptions
): Promise<GenerateNewsletterResult> {
  const data = await aggregateWeeklyRiskData(options);

  const htmlContent = renderNewsletterToHtml(data);

  let pdfBuffer: Buffer | undefined;
  if (!options.previewMode) {
    try {
      pdfBuffer = await generateNewsletterPDF(data);
    } catch (error) {
      console.error('PDF generation error:', error);
    }
  }

  let issueId: string | undefined;
  if (!options.previewMode) {
    const config = await prisma.newsletterConfig.findUnique({
      where: { tenantId: options.tenantId },
    });

    if (config) {
      const issue = await prisma.newsletterIssue.create({
        data: {
          configId: config.id,
          weekStart: data.weekStart,
          weekEnd: data.weekEnd,
          subject: `Construction Risk Brief - ${format(data.weekStart, 'MMM d')} to ${format(data.weekEnd, 'MMM d, yyyy')}`,
          htmlContent,
          status: NewsletterStatus.DRAFT,
        },
      });
      issueId = issue.id;
    }
  }

  return {
    data,
    htmlContent,
    pdfBuffer,
    issueId,
  };
}

export async function sendNewsletter(
  issueId: string,
  options?: { includePdf?: boolean }
): Promise<NewsletterSendResult> {
  const issue = await prisma.newsletterIssue.findUnique({
    where: { id: issueId },
    include: {
      config: {
        include: {
          tenant: true,
        },
      },
    },
  });

  if (!issue) {
    throw new Error(`Newsletter issue not found: ${issueId}`);
  }

  if (!issue.htmlContent) {
    throw new Error('Newsletter has no HTML content');
  }

  await prisma.newsletterIssue.update({
    where: { id: issueId },
    data: { status: NewsletterStatus.SENDING },
  });

  const recipients = await getNewsletterRecipients(issue.config.tenantId);

  if (recipients.length === 0) {
    await prisma.newsletterIssue.update({
      where: { id: issueId },
      data: { 
        status: NewsletterStatus.SENT,
        sentAt: new Date(),
        recipientCount: 0,
      },
    });
    return {
      issueId,
      sentCount: 0,
      failedCount: 0,
      errors: [],
    };
  }

  let pdfBuffer: Buffer | undefined;
  if (options?.includePdf) {
    const data = await aggregateWeeklyRiskData({
      tenantId: issue.config.tenantId,
      weekStart: issue.weekStart,
      weekEnd: issue.weekEnd,
    });
    try {
      pdfBuffer = await generateNewsletterPDF(data);
    } catch (error) {
      console.error('PDF generation error for send:', error);
    }
  }

  const emails = recipients.map(recipient => ({
    to: recipient.email,
    subject: issue.subject,
    html: issue.htmlContent!,
    attachments: pdfBuffer ? [{
      filename: `construction-risk-brief-${format(issue.weekStart, 'yyyy-MM-dd')}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }] : undefined,
  }));

  const results = await sendBulkEmails(emails);

  const sentCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;
  const errors = results
    .filter(r => !r.success)
    .map(r => ({
      email: Array.isArray(r.to) ? r.to.join(', ') : r.to,
      error: r.error || 'Unknown error',
    }));

  await prisma.newsletterIssue.update({
    where: { id: issueId },
    data: {
      status: failedCount === recipients.length ? NewsletterStatus.FAILED : NewsletterStatus.SENT,
      sentAt: new Date(),
      recipientCount: sentCount,
    },
  });

  return {
    issueId,
    sentCount,
    failedCount,
    errors,
  };
}

export async function scheduleNewsletter(tenantId: string): Promise<string> {
  const config = await prisma.newsletterConfig.findUnique({
    where: { tenantId },
  });

  if (!config || !config.isActive) {
    throw new Error('Newsletter not configured or inactive for tenant');
  }

  const result = await generateNewsletter({
    tenantId,
    previewMode: false,
  });

  if (result.issueId) {
    await prisma.newsletterIssue.update({
      where: { id: result.issueId },
      data: { status: NewsletterStatus.SCHEDULED },
    });
  }

  return result.issueId!;
}

export async function getNewsletterHistory(
  tenantId: string,
  options?: { limit?: number; offset?: number }
): Promise<Array<{
  id: string;
  weekStart: Date;
  weekEnd: Date;
  subject: string;
  status: NewsletterStatus;
  sentAt: Date | null;
  recipientCount: number;
}>> {
  const config = await prisma.newsletterConfig.findUnique({
    where: { tenantId },
  });

  if (!config) {
    return [];
  }

  const issues = await prisma.newsletterIssue.findMany({
    where: { configId: config.id },
    orderBy: { weekStart: 'desc' },
    take: options?.limit || 10,
    skip: options?.offset || 0,
    select: {
      id: true,
      weekStart: true,
      weekEnd: true,
      subject: true,
      status: true,
      sentAt: true,
      recipientCount: true,
    },
  });

  return issues;
}

export async function updateNewsletterConfig(
  tenantId: string,
  config: {
    frequency?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    dayOfWeek?: number;
    hourOfDay?: number;
    isActive?: boolean;
    includeAnonymized?: boolean;
  }
): Promise<void> {
  await prisma.newsletterConfig.upsert({
    where: { tenantId },
    create: {
      tenantId,
      frequency: config.frequency || 'WEEKLY',
      dayOfWeek: config.dayOfWeek ?? 1,
      hourOfDay: config.hourOfDay ?? 8,
      isActive: config.isActive ?? true,
      includeAnonymized: config.includeAnonymized ?? false,
    },
    update: {
      frequency: config.frequency,
      dayOfWeek: config.dayOfWeek,
      hourOfDay: config.hourOfDay,
      isActive: config.isActive,
      includeAnonymized: config.includeAnonymized,
    },
  });
}

export async function subscribeToNewsletter(
  userId: string,
  tenantId: string
): Promise<void> {
  const config = await prisma.newsletterConfig.findUnique({
    where: { tenantId },
  });

  if (!config) {
    await prisma.newsletterConfig.create({
      data: {
        tenantId,
        frequency: 'WEEKLY',
        dayOfWeek: 1,
        hourOfDay: 8,
        isActive: true,
      },
    });
  }

  const configRecord = await prisma.newsletterConfig.findUnique({
    where: { tenantId },
  });

  await prisma.newsletterSubscription.upsert({
    where: {
      userId_configId: {
        userId,
        configId: configRecord!.id,
      },
    },
    create: {
      userId,
      configId: configRecord!.id,
      isActive: true,
    },
    update: {
      isActive: true,
      unsubscribedAt: null,
    },
  });
}

export async function unsubscribeFromNewsletter(
  userId: string,
  tenantId: string
): Promise<void> {
  const config = await prisma.newsletterConfig.findUnique({
    where: { tenantId },
  });

  if (!config) {
    return;
  }

  await prisma.newsletterSubscription.updateMany({
    where: {
      userId,
      configId: config.id,
    },
    data: {
      isActive: false,
      unsubscribedAt: new Date(),
    },
  });
}
