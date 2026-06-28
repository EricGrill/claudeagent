import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const fromAddress = options.from || process.env.EMAIL_FROM || 'ClaimZero <newsletter@claimzero.io>';

  try {
    const resend = getResendClient();
    const result = await resend.emails.send({
      from: fromAddress,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      reply_to: options.replyTo,
      attachments: options.attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
      })),
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error sending email';
    console.error('Email send error:', message);
    return {
      success: false,
      error: message,
    };
  }
}

export async function sendBulkEmails(
  emails: Array<Omit<EmailOptions, 'from'>>,
  fromAddress?: string
): Promise<Array<EmailResult & { to: string | string[] }>> {
  const results: Array<EmailResult & { to: string | string[] }> = [];

  for (const email of emails) {
    const result = await sendEmail({
      ...email,
      from: fromAddress,
    });
    results.push({ ...result, to: email.to });

    if (emails.length > 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}
