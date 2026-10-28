"use client";

import { useState, useEffect, useCallback } from "react";

interface ConnectionStatus {
  isAuthenticated: boolean;
  isExpired: boolean;
  expiresAt?: number;
}

interface AutodeskConnectionStatusProps {
  onDisconnect?: () => void;
  onRefresh?: () => void;
}

export function AutodeskConnectionStatus({
  onDisconnect,
  onRefresh,
}: AutodeskConnectionStatusProps) {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/autodesk/auth/status");
      const data = await response.json();
      setStatus(data);
    } catch {
      setStatus({ isAuthenticated: false, isExpired: true });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleDisconnect = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      await fetch("/api/autodesk/auth", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setStatus({ isAuthenticated: false, isExpired: true });
      onDisconnect?.();
    } catch {
      console.error("Failed to disconnect");
    } finally {
      setIsDisconnecting(false);
    }
  }, [onDisconnect]);

  const handleRefresh = useCallback(async () => {
    try {
      const response = await fetch("/api/autodesk/auth/refresh", {
        method: "POST",
      });
      if (response.ok) {
        await checkStatus();
        onRefresh?.();
      }
    } catch {
      console.error("Failed to refresh token");
    }
  }, [checkStatus, onRefresh]);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1rem",
          backgroundColor: "#f3f4f6",
          borderRadius: "8px",
        }}
      >
        <span style={{ color: "#6b7280" }}>Checking connection...</span>
      </div>
    );
  }

  if (!status?.isAuthenticated) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1rem",
          backgroundColor: "#fef2f2",
          borderRadius: "8px",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#ef4444",
          }}
        />
        <span style={{ color: "#991b1b" }}>Not connected to Autodesk</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 1rem",
        backgroundColor: "#f0fdf4",
        borderRadius: "8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#22c55e",
          }}
        />
        <span style={{ color: "#166534" }}>Connected to Autodesk</span>
        {status.expiresAt && (
          <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
            (expires{" "}
            {new Date(status.expiresAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            )
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          onClick={handleRefresh}
          style={{
            padding: "0.375rem 0.75rem",
            backgroundColor: "transparent",
            color: "#0066cc",
            border: "1px solid #0066cc",
            borderRadius: "6px",
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
        <button
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          style={{
            padding: "0.375rem 0.75rem",
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            border: "none",
            borderRadius: "6px",
            fontSize: "0.75rem",
            cursor: isDisconnecting ? "not-allowed" : "pointer",
            opacity: isDisconnecting ? 0.7 : 1,
          }}
        >
          {isDisconnecting ? "Disconnecting..." : "Disconnect"}
        </button>
      </div>
    </div>
  );
}
