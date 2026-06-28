import { prisma } from "./db";

export type SettingCategory = "storage" | "smtp" | "openai";

export interface SettingDefinition {
  key: string;
  envKey: string;
  category: SettingCategory;
  sensitive: boolean;
  label: string;
  description: string;
  required?: boolean;
  defaultValue?: string;
}

export const SETTING_DEFINITIONS: SettingDefinition[] = [
  // Storage (S3/MinIO) settings
  {
    key: "storage.endpoint",
    envKey: "S3_ENDPOINT",
    category: "storage",
    sensitive: false,
    label: "S3 Endpoint",
    description: "S3-compatible endpoint URL (e.g., https://s3.amazonaws.com or https://minio.example.com)",
  },
  {
    key: "storage.region",
    envKey: "S3_REGION",
    category: "storage",
    sensitive: false,
    label: "S3 Region",
    description: "AWS region (e.g., us-east-1)",
    defaultValue: "us-east-1",
  },
  {
    key: "storage.accessKeyId",
    envKey: "S3_ACCESS_KEY_ID",
    category: "storage",
    sensitive: true,
    label: "Access Key ID",
    description: "S3 access key ID",
  },
  {
    key: "storage.secretAccessKey",
    envKey: "S3_SECRET_ACCESS_KEY",
    category: "storage",
    sensitive: true,
    label: "Secret Access Key",
    description: "S3 secret access key",
  },
  {
    key: "storage.bucket",
    envKey: "S3_BUCKET",
    category: "storage",
    sensitive: false,
    label: "Bucket Name",
    description: "S3 bucket name for file storage",
  },
  {
    key: "storage.publicUrl",
    envKey: "S3_PUBLIC_URL",
    category: "storage",
    sensitive: false,
    label: "Public URL",
    description: "Public URL prefix for accessing stored files (optional)",
  },

  // SMTP settings
  {
    key: "smtp.host",
    envKey: "SMTP_HOST",
    category: "smtp",
    sensitive: false,
    label: "SMTP Host",
    description: "SMTP server hostname",
  },
  {
    key: "smtp.port",
    envKey: "SMTP_PORT",
    category: "smtp",
    sensitive: false,
    label: "SMTP Port",
    description: "SMTP server port (typically 587 for TLS, 465 for SSL)",
    defaultValue: "587",
  },
  {
    key: "smtp.user",
    envKey: "SMTP_USER",
    category: "smtp",
    sensitive: false,
    label: "SMTP Username",
    description: "SMTP authentication username",
  },
  {
    key: "smtp.pass",
    envKey: "SMTP_PASS",
    category: "smtp",
    sensitive: true,
    label: "SMTP Password",
    description: "SMTP authentication password",
  },
  {
    key: "smtp.fromAddress",
    envKey: "DIGEST_FROM_ADDRESS",
    category: "smtp",
    sensitive: false,
    label: "From Address",
    description: "Email address used as sender for digest emails",
  },

  // OpenAI settings
  {
    key: "openai.apiKey",
    envKey: "OPENAI_API_KEY",
    category: "openai",
    sensitive: true,
    label: "API Key",
    description: "OpenAI API key for AI analysis features",
  },
  {
    key: "openai.model",
    envKey: "OPENAI_MODEL",
    category: "openai",
    sensitive: false,
    label: "Model",
    description: "OpenAI model to use (e.g., gpt-4, gpt-3.5-turbo)",
    defaultValue: "gpt-4",
  },
  {
    key: "openai.maxTokens",
    envKey: "OPENAI_MAX_TOKENS",
    category: "openai",
    sensitive: false,
    label: "Max Tokens",
    description: "Maximum tokens per request (cluster guard limit)",
    defaultValue: "4096",
  },
  {
    key: "openai.requestsPerMinute",
    envKey: "OPENAI_REQUESTS_PER_MINUTE",
    category: "openai",
    sensitive: false,
    label: "Rate Limit",
    description: "Maximum requests per minute (cluster guard limit)",
    defaultValue: "60",
  },
];

export function getSettingDefinition(key: string): SettingDefinition | undefined {
  return SETTING_DEFINITIONS.find((def) => def.key === key);
}

export function getSettingDefinitionsByCategory(category: SettingCategory): SettingDefinition[] {
  return SETTING_DEFINITIONS.filter((def) => def.category === category);
}

export async function getSetting(key: string): Promise<string | null> {
  const definition = getSettingDefinition(key);
  if (!definition) {
    return null;
  }

  // First, check database for override
  try {
    const dbSetting = await prisma.systemSetting.findUnique({
      where: { key },
    });
    if (dbSetting?.value) {
      return dbSetting.value;
    }
  } catch {
    // Database might not be available, fall through to env
  }

  // Fall back to environment variable
  const envValue = process.env[definition.envKey];
  if (envValue) {
    return envValue;
  }

  // Fall back to default value
  return definition.defaultValue ?? null;
}

export async function getSettings(keys: string[]): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  await Promise.all(
    keys.map(async (key) => {
      result[key] = await getSetting(key);
    })
  );
  return result;
}

export async function getSettingsByCategory(category: SettingCategory): Promise<Record<string, string | null>> {
  const definitions = getSettingDefinitionsByCategory(category);
  const keys = definitions.map((def) => def.key);
  return getSettings(keys);
}

export async function setSetting(key: string, value: string): Promise<void> {
  const definition = getSettingDefinition(key);
  if (!definition) {
    throw new Error(`Unknown setting key: ${key}`);
  }

  await prisma.systemSetting.upsert({
    where: { key },
    update: {
      value,
      encrypted: definition.sensitive,
      updatedAt: new Date(),
    },
    create: {
      key,
      value,
      encrypted: definition.sensitive,
      category: definition.category,
    },
  });
}

export async function setSettings(settings: Record<string, string>): Promise<void> {
  await Promise.all(
    Object.entries(settings).map(([key, value]) => setSetting(key, value))
  );
}

export async function deleteSetting(key: string): Promise<void> {
  try {
    await prisma.systemSetting.delete({
      where: { key },
    });
  } catch {
    // Setting might not exist, that's ok
  }
}

export async function getAllDbSettings(): Promise<Record<string, string>> {
  const settings = await prisma.systemSetting.findMany();
  return settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);
}

export interface ServiceStatus {
  enabled: boolean;
  configured: boolean;
  message: string;
  missingFields?: string[];
}

export async function getStorageStatus(): Promise<ServiceStatus> {
  const settings = await getSettingsByCategory("storage");
  const requiredFields = ["storage.endpoint", "storage.accessKeyId", "storage.secretAccessKey", "storage.bucket"];
  const missingFields = requiredFields.filter((key) => !settings[key]);

  if (missingFields.length === requiredFields.length) {
    return {
      enabled: false,
      configured: false,
      message: "Not configured - using local HTML downloads",
      missingFields,
    };
  }

  if (missingFields.length > 0) {
    return {
      enabled: false,
      configured: false,
      message: `Partially configured - missing: ${missingFields.map((k) => k.split(".")[1]).join(", ")}`,
      missingFields,
    };
  }

  return {
    enabled: true,
    configured: true,
    message: "S3-compatible storage configured and ready",
  };
}

export async function getSmtpStatus(): Promise<ServiceStatus> {
  const settings = await getSettingsByCategory("smtp");
  const requiredFields = ["smtp.host", "smtp.fromAddress"];
  const missingFields = requiredFields.filter((key) => !settings[key]);

  if (missingFields.length === requiredFields.length) {
    return {
      enabled: false,
      configured: false,
      message: "Not configured - digest emails disabled",
      missingFields,
    };
  }

  if (missingFields.length > 0) {
    return {
      enabled: false,
      configured: false,
      message: `Partially configured - missing: ${missingFields.map((k) => k.split(".")[1]).join(", ")}`,
      missingFields,
    };
  }

  return {
    enabled: true,
    configured: true,
    message: "SMTP configured and ready",
  };
}

export async function getOpenAIStatus(): Promise<ServiceStatus> {
  const settings = await getSettingsByCategory("openai");
  const requiredFields = ["openai.apiKey"];
  const missingFields = requiredFields.filter((key) => !settings[key]);

  if (missingFields.length > 0) {
    return {
      enabled: false,
      configured: false,
      message: "Not configured - running in deterministic stub mode",
      missingFields,
    };
  }

  return {
    enabled: true,
    configured: true,
    message: `OpenAI configured with model: ${settings["openai.model"] || "gpt-4"}`,
  };
}

export async function getAllServiceStatuses(): Promise<{
  storage: ServiceStatus;
  smtp: ServiceStatus;
  openai: ServiceStatus;
}> {
  const [storage, smtp, openai] = await Promise.all([
    getStorageStatus(),
    getSmtpStatus(),
    getOpenAIStatus(),
  ]);

  return { storage, smtp, openai };
}
