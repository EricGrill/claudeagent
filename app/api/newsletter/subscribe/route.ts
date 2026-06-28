import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  subscribeToNewsletter, 
  unsubscribeFromNewsletter 
} from '@/lib/services/newsletter';

const subscribeSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  tenantId: z.string().min(1, 'Tenant ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = subscribeSchema.parse(body);

    await subscribeToNewsletter(validated.userId, validated.tenantId);

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Newsletter subscribe error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = subscribeSchema.parse(body);

    await unsubscribeFromNewsletter(validated.userId, validated.tenantId);

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Newsletter unsubscribe error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
