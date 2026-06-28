import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateNewsletter } from '@/lib/services/newsletter';

const generateSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  weekStart: z.string().datetime().optional(),
  weekEnd: z.string().datetime().optional(),
  previewMode: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = generateSchema.parse(body);

    const result = await generateNewsletter({
      tenantId: validated.tenantId,
      weekStart: validated.weekStart ? new Date(validated.weekStart) : undefined,
      weekEnd: validated.weekEnd ? new Date(validated.weekEnd) : undefined,
      previewMode: validated.previewMode,
    });

    return NextResponse.json({
      success: true,
      data: {
        issueId: result.issueId,
        weekStart: result.data.weekStart,
        weekEnd: result.data.weekEnd,
        tenantName: result.data.tenantName,
        portfolioSummary: result.data.portfolioSummary,
        riskCounts: result.data.riskCounts,
        projectsToWatchCount: result.data.projectsToWatch.length,
        thresholdCrossingsCount: result.data.thresholdCrossings.length,
        newSignalsCount: result.data.newSignals.length,
        resolvedSignalsCount: result.data.resolvedSignals.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Newsletter generation error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
