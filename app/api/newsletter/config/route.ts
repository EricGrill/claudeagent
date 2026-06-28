import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateNewsletterConfig } from '@/lib/services/newsletter';
import { prisma } from '@/lib/db';

const configSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']).optional(),
  dayOfWeek: z.number().min(0).max(6).optional(),
  hourOfDay: z.number().min(0).max(23).optional(),
  isActive: z.boolean().optional(),
  includeAnonymized: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const config = await prisma.newsletterConfig.findUnique({
      where: { tenantId },
      include: {
        _count: {
          select: {
            subscriptions: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!config) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No newsletter configuration found',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        frequency: config.frequency,
        dayOfWeek: config.dayOfWeek,
        hourOfDay: config.hourOfDay,
        isActive: config.isActive,
        includeAnonymized: config.includeAnonymized,
        activeSubscribers: config._count.subscriptions,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Get newsletter config error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = configSchema.parse(body);

    await updateNewsletterConfig(validated.tenantId, {
      frequency: validated.frequency,
      dayOfWeek: validated.dayOfWeek,
      hourOfDay: validated.hourOfDay,
      isActive: validated.isActive,
      includeAnonymized: validated.includeAnonymized,
    });

    return NextResponse.json({
      success: true,
      message: 'Newsletter configuration updated',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Update newsletter config error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
