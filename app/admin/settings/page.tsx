"use client";

import { useState, useEffect } from "react";
import { SettingsForm, SettingField } from "@/components/admin/settings-form";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { HardDrive, Mail, Brain } from "lucide-react";

interface ServiceStatus {
  enabled: boolean;
  configured: boolean;
  message: string;
}

interface SettingsData {
  values: Record<string, string>;
  statuses: {
    storage: ServiceStatus;
    smtp: ServiceStatus;
    openai: ServiceStatus;
  };
}

const storageFields: SettingField[] = [
  {
    key: "storage.endpoint",
    label: "S3 Endpoint",
    description: "S3-compatible endpoint URL (e.g., https://s3.amazonaws.com or https://minio.example.com)",
    type: "text",
    placeholder: "https://s3.amazonaws.com",
  },
  {
    key: "storage.region",
    label: "Region",
    description: "AWS region (e.g., us-east-1)",
    type: "text",
    placeholder: "us-east-1",
  },
  {
    key: "storage.accessKeyId",
    label: "Access Key ID",
    description: "S3 access key ID",
    type: "password",
  },
  {
    key: "storage.secretAccessKey",
    label: "Secret Access Key",
    description: "S3 secret access key",
    type: "password",
  },
  {
    key: "storage.bucket",
    label: "Bucket Name",
    description: "S3 bucket name for file storage",
    type: "text",
    placeholder: "my-bucket",
  },
  {
    key: "storage.publicUrl",
    label: "Public URL (Optional)",
    description: "Public URL prefix for accessing stored files",
    type: "text",
    placeholder: "https://files.example.com",
  },
];

const smtpFields: SettingField[] = [
  {
    key: "smtp.host",
    label: "SMTP Host",
    description: "SMTP server hostname",
    type: "text",
    placeholder: "smtp.example.com",
  },
  {
    key: "smtp.port",
    label: "SMTP Port",
    description: "SMTP server port (typically 587 for TLS, 465 for SSL)",
    type: "number",
    placeholder: "587",
  },
  {
    key: "smtp.user",
    label: "Username",
    description: "SMTP authentication username",
    type: "text",
  },
  {
    key: "smtp.pass",
    label: "Password",
    description: "SMTP authentication password",
    type: "password",
  },
  {
    key: "smtp.fromAddress",
    label: "From Address",
    description: "Email address used as sender for digest emails",
    type: "text",
    placeholder: "noreply@example.com",
  },
];

const openaiFields: SettingField[] = [
  {
    key: "openai.apiKey",
    label: "API Key",
    description: "OpenAI API key for AI analysis features",
    type: "password",
  },
  {
    key: "openai.model",
    label: "Model",
    description: "OpenAI model to use (e.g., gpt-4, gpt-3.5-turbo)",
    type: "text",
    placeholder: "gpt-4",
  },
  {
    key: "openai.maxTokens",
    label: "Max Tokens",
    description: "Maximum tokens per request (cluster guard limit)",
    type: "number",
    placeholder: "4096",
  },
  {
    key: "openai.requestsPerMinute",
    label: "Rate Limit",
    description: "Maximum requests per minute (cluster guard limit)",
    type: "number",
    placeholder: "60",
  },
];

export default function AdminSettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings");
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveSettings = async (values: Record<string, string>) => {
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: values }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to save settings");
    }

    // Refresh settings after save
    await fetchSettings();
  };

  const testStorage = async () => {
    const response = await fetch("/api/admin/settings/test/storage", {
      method: "POST",
    });
    const result = await response.json();
    return {
      success: result.success,
      message: result.success ? "Connection successful!" : result.error,
    };
  };

  const testSmtp = async () => {
    const response = await fetch("/api/admin/settings/test/smtp", {
      method: "POST",
    });
    const result = await response.json();
    return {
      success: result.success,
      message: result.success ? "Connection verified!" : result.error,
    };
  };

  const testOpenai = async () => {
    const response = await fetch("/api/admin/settings/test/openai", {
      method: "POST",
    });
    const result = await response.json();
    return {
      success: result.success,
      message: result.success ? `Connected to ${result.model}` : result.error,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="error">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure optional services for storage, email, and AI analysis. Services with missing
            configuration will gracefully degrade to fallback behavior.
          </p>
        </div>

        <div className="space-y-6">
          <SettingsForm
            title="Object Storage (S3/MinIO)"
            description="Configure S3-compatible storage for file uploads and exports"
            icon={<HardDrive className="w-6 h-6" />}
            fields={storageFields}
            values={data.values}
            status={data.statuses.storage}
            onSave={saveSettings}
            onTest={testStorage}
            testLabel="Test Connection"
          />

          <SettingsForm
            title="Email (SMTP)"
            description="Configure SMTP server for sending digest emails"
            icon={<Mail className="w-6 h-6" />}
            fields={smtpFields}
            values={data.values}
            status={data.statuses.smtp}
            onSave={saveSettings}
            onTest={testSmtp}
            testLabel="Verify SMTP"
          />

          <SettingsForm
            title="AI Analysis (OpenAI)"
            description="Configure OpenAI for AI-powered risk analysis"
            icon={<Brain className="w-6 h-6" />}
            fields={openaiFields}
            values={data.values}
            status={data.statuses.openai}
            onSave={saveSettings}
            onTest={testOpenai}
            testLabel="Test API"
          />
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-medium text-blue-900">Environment Variable Fallback</h3>
          <p className="text-sm text-blue-700 mt-1">
            Settings configured here take precedence over environment variables. If a setting is not
            configured in the UI, the system will fall back to the corresponding environment
            variable. Existing deployments using environment variables will continue to work
            unchanged.
          </p>
        </div>
      </div>
    </div>
  );
}
