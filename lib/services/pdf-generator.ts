import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { NewsletterPDF } from '../templates/newsletter-pdf';
import type { WeeklyNewsletterData } from '../types/newsletter';

export async function generateNewsletterPDF(data: WeeklyNewsletterData): Promise<Buffer> {
  const element = React.createElement(NewsletterPDF, { data });
  const buffer = await renderToBuffer(element as any);
  return buffer as Buffer;
}
