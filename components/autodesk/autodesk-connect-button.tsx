"use client";

import { useState, useCallback } from "react";

interface AutodeskConnectButtonProps {
  onConnectStart?: () => void;
  onError?: (error: string) => void;
}

export function AutodeskConnectButton({
  onConnectStart,
  onError,
}: AutodeskConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = useCallback(async () => {
    setIsLoading(true);
    onConnectStart?.();

    try {
      const response = await fetch("/api/autodesk/auth");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate connection");
      }

      window.location.href = data.authUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection failed";
      onError?.(message);
      setIsLoading(false);
    }
  }, [onConnectStart, onError]);

  return (
    <button
      onClick={handleConnect}
      disabled={isLoading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.875rem 1.5rem",
        backgroundColor: "#000",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "1rem",
        fontWeight: "500",
        cursor: isLoading ? "not-allowed" : "pointer",
        opacity: isLoading ? 0.7 : 1,
        transition: "all 0.2s",
      }}
    >
      <AutodeskLogo />
      {isLoading ? "Connecting..." : "Connect to Autodesk"}
    </button>
  );
}

function AutodeskLogo() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.09 3.54L12 11.27 4.91 7.72 12 4.18zM4 8.82l7 3.5v6.86l-7-3.5V8.82zm9 10.36V12.32l7-3.5v6.86l-7 3.5z"
        fill="currentColor"
      />
    </svg>
  );
}
