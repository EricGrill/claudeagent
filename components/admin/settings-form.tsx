"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ServiceStatusBadge } from "./service-status-badge";

export interface SettingField {
  key: string;
  label: string;
  description: string;
  type: "text" | "password" | "number";
  placeholder?: string;
  required?: boolean;
}

export interface SettingsFormProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  fields: SettingField[];
  values: Record<string, string>;
  status: {
    enabled: boolean;
    configured: boolean;
    message: string;
  };
  onSave: (values: Record<string, string>) => Promise<void>;
  onTest?: () => Promise<{ success: boolean; message: string }>;
  testLabel?: string;
}

export function SettingsForm({
  title,
  description,
  icon,
  fields,
  values,
  status,
  onSave,
  onTest,
  testLabel = "Test Connection",
}: SettingsFormProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>(values);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await onSave(formValues);
      setMessage({ type: "success", text: "Settings saved successfully" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save settings";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!onTest) return;
    
    setTesting(true);
    setMessage(null);

    try {
      const result = await onTest();
      setMessage({
        type: result.success ? "success" : "error",
        text: result.message,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Test failed";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <div className="text-gray-500">{icon}</div>}
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <ServiceStatusBadge enabled={status.enabled} configured={status.configured} />
        </div>
        <p className="text-sm text-gray-600 mt-2">{status.message}</p>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant={message.type === "success" ? "success" : "error"}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {fields.map((field) => (
            <Input
              key={field.key}
              label={field.label}
              type={field.type}
              value={formValues[field.key] || ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              hint={field.description}
            />
          ))}
        </CardContent>

        <CardFooter className="flex justify-between">
          <div>
            {onTest && (
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                loading={testing}
                disabled={saving}
              >
                {testLabel}
              </Button>
            )}
          </div>
          <Button type="submit" loading={saving} disabled={testing}>
            Save Settings
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
