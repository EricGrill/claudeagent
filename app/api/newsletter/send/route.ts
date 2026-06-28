import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendNewsletter } from '@/lib/services/newsletter';

const sendSchema = z.object({
  issueId: z.string().min(1, 'Issue ID is required'),
  includePdf: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = sendSchema.parse(body);

    const result = await sendNewsletter(validated.issueId, {
      includePdf: validated.includePdf,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Newsletter send error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
