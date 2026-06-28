import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateNewsletter } from '@/lib/services/newsletter';

const previewSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  weekStart: z.string().datetime().optional(),
  weekEnd: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = previewSchema.parse(body);

    const result = await generateNewsletter({
      tenantId: validated.tenantId,
      weekStart: validated.weekStart ? new Date(validated.weekStart) : undefined,
      weekEnd: validated.weekEnd ? new Date(validated.weekEnd) : undefined,
      previewMode: true,
    });

    return new NextResponse(result.htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
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
    console.error('Newsletter preview error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
