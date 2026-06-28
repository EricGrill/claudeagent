import nodemailer, { Transporter } from "nodemailer";
import { getSettingsByCategory, getSmtpStatus, ServiceStatus } from "./settings";

let transporter: Transporter | null = null;
let currentConfig: SmtpConfig | null = null;

export interface SmtpConfig {
  host: string;
  port: number;
  user?: string;
  pass?: string;
  fromAddress: string;
  secure?: boolean;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const settings = await getSettingsByCategory("smtp");
  
  const host = settings["smtp.host"];
  const fromAddress = settings["smtp.fromAddress"];

  if (!host || !fromAddress) {
    return null;
  }

  const port = parseInt(settings["smtp.port"] || "587", 10);

  return {
    host,
    port,
    user: settings["smtp.user"] || undefined,
    pass: settings["smtp.pass"] || undefined,
    fromAddress,
    secure: port === 465,
  };
}

async function getTransporter(): Promise<Transporter | null> {
  const config = await getSmtpConfig();

  if (!config) {
    transporter = null;
    currentConfig = null;
    return null;
  }

  // Check if config changed and we need a new transporter
  if (
    transporter &&
    currentConfig &&
    currentConfig.host === config.host &&
    currentConfig.port === config.port &&
    currentConfig.user === config.user &&
    currentConfig.pass === config.pass
  ) {
    return transporter;
  }

  // Create new transporter with updated config
  const transportConfig: nodemailer.TransportOptions = {
    host: config.host,
    port: config.port,
    secure: config.secure,
  } as nodemailer.TransportOptions;

  if (config.user && config.pass) {
    Object.assign(transportConfig, {
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  transporter = nodemailer.createTransport(transportConfig);
  currentConfig = config;
  return transporter;
}

export async function isEmailEnabled(): Promise<boolean> {
  const status = await getSmtpStatus();
  return status.enabled;
}

export async function getStatus(): Promise<ServiceStatus> {
  return getSmtpStatus();
}

export async function sendEmail(options: EmailOptions): Promise<SendResult> {
  const transport = await getTransporter();
  const config = await getSmtpConfig();

  if (!transport || !config) {
    return {
      success: false,
      skipped: true,
      reason: "SMTP not configured - digest emails are disabled",
    };
  }

  try {
    const mailOptions = {
      from: config.fromAddress,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      cc: options.cc
        ? Array.isArray(options.cc)
          ? options.cc.join(", ")
          : options.cc
        : undefined,
      bcc: options.bcc
        ? Array.isArray(options.bcc)
          ? options.bcc.join(", ")
          : options.bcc
        : undefined,
      attachments: options.attachments,
    };

    const info = await transport.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to send email: ${message}`,
    };
  }
}

export async function sendDigestEmail(
  to: string | string[],
  subject: string,
  htmlContent: string
): Promise<SendResult> {
  return sendEmail({
    to,
    subject,
    html: htmlContent,
  });
}

export async function testConnection(): Promise<{ success: boolean; error?: string }> {
  const transport = await getTransporter();

  if (!transport) {
    return { success: false, error: "SMTP not configured" };
  }

  try {
    await transport.verify();
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function sendTestEmail(to: string): Promise<SendResult> {
  return sendEmail({
    to,
    subject: "ClaimZero Test Email",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #333;">Test Email from ClaimZero</h1>
        <p>This is a test email to verify your SMTP configuration is working correctly.</p>
        <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
      </div>
    `,
    text: `Test Email from ClaimZero\n\nThis is a test email to verify your SMTP configuration is working correctly.\n\nSent at: ${new Date().toISOString()}`,
  });
}
