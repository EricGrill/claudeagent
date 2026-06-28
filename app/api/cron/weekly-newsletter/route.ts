import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateNewsletter, sendNewsletter } from '@/lib/services/newsletter';
import { NewsletterFrequency } from '@prisma/client';

const CRON_SECRET = process.env.CRON_SECRET;

function shouldSendNewsletter(
  frequency: NewsletterFrequency,
  dayOfWeek: number,
  hourOfDay: number
): boolean {
  const now = new Date();
  const currentDay = now.getUTCDay();
  const currentHour = now.getUTCHours();

  if (currentDay !== dayOfWeek || currentHour !== hourOfDay) {
    return false;
  }

  switch (frequency) {
    case 'WEEKLY':
      return true;
    case 'BIWEEKLY':
      const weekNumber = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
      return weekNumber % 2 === 0;
    case 'MONTHLY':
      const dayOfMonth = now.getUTCDate();
      return dayOfMonth <= 7;
    default:
      return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const configs = await prisma.newsletterConfig.findMany({
      where: { isActive: true },
      include: {
        tenant: true,
        subscriptions: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    const results: Array<{
      tenantId: string;
      tenantName: string;
      status: 'sent' | 'skipped' | 'failed';
      issueId?: string;
      error?: string;
      recipientCount?: number;
    }> = [];

    for (const config of configs) {
      if (config.subscriptions.length === 0) {
        results.push({
          tenantId: config.tenantId,
          tenantName: config.tenant.name,
          status: 'skipped',
          error: 'No active subscribers',
        });
        continue;
      }

      if (!shouldSendNewsletter(config.frequency, config.dayOfWeek, config.hourOfDay)) {
        results.push({
          tenantId: config.tenantId,
          tenantName: config.tenant.name,
          status: 'skipped',
          error: 'Not scheduled for current time',
        });
        continue;
      }

      try {
        const generated = await generateNewsletter({
          tenantId: config.tenantId,
          previewMode: false,
        });

        if (!generated.issueId) {
          results.push({
            tenantId: config.tenantId,
            tenantName: config.tenant.name,
            status: 'failed',
            error: 'Failed to generate newsletter',
          });
          continue;
        }

        const sendResult = await sendNewsletter(generated.issueId, {
          includePdf: true,
        });

        results.push({
          tenantId: config.tenantId,
          tenantName: config.tenant.name,
          status: sendResult.failedCount === 0 ? 'sent' : 'sent',
          issueId: generated.issueId,
          recipientCount: sendResult.sentCount,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          tenantId: config.tenantId,
          tenantName: config.tenant.name,
          status: 'failed',
          error: message,
        });
      }
    }

    const sent = results.filter(r => r.status === 'sent').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const failed = results.filter(r => r.status === 'failed').length;

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        sent,
        skipped,
        failed,
      },
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Cron weekly newsletter error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
