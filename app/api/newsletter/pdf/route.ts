import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aggregateWeeklyRiskData } from '@/lib/services/risk-aggregation';
import { generateNewsletterPDF } from '@/lib/services/pdf-generator';
import { format } from 'date-fns';

const pdfSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  weekStart: z.string().datetime().optional(),
  weekEnd: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = pdfSchema.parse(body);

    const data = await aggregateWeeklyRiskData({
      tenantId: validated.tenantId,
      weekStart: validated.weekStart ? new Date(validated.weekStart) : undefined,
      weekEnd: validated.weekEnd ? new Date(validated.weekEnd) : undefined,
    });

    const pdfBuffer = await generateNewsletterPDF(data);

    const filename = `construction-risk-brief-${format(data.weekStart, 'yyyy-MM-dd')}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
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
    console.error('PDF generation error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
