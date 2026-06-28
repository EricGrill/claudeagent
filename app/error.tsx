"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [errorId, setErrorId] = useState<string | null>(null);

  useEffect(() => {
    const eventId = Sentry.captureException(error, {
      tags: {
        digest: error.digest,
        errorType: "route-error",
      },
    });
    setErrorId(eventId);

    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "Route error occurred",
        context: {
          errorName: error.name,
          errorMessage: error.message,
          digest: error.digest,
          sentryEventId: eventId,
        },
      })
    );
  }, [error]);

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
        textAlign: "center",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        backgroundColor: "#f8f9fa",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          padding: "2rem",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            fontSize: "4rem",
            marginBottom: "1rem",
          }}
        >
          ⚠️
        </div>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "#1a1a1a",
            marginBottom: "0.5rem",
          }}
        >
          Something went wrong
        </h1>
        <p
          style={{
            color: "#666",
            marginBottom: "1.5rem",
            lineHeight: "1.5",
          }}
        >
          We encountered an unexpected error. Please try again or refresh the
          page.
        </p>

        {(error.digest || errorId) && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "#999",
              marginBottom: "1rem",
              fontFamily: "monospace",
            }}
          >
            Reference: {error.digest || errorId}
          </p>
        )}

        {process.env.NODE_ENV === "development" && error.message && (
          <details
            style={{
              marginBottom: "1.5rem",
              textAlign: "left",
              backgroundColor: "#f8f9fa",
              padding: "1rem",
              borderRadius: "8px",
              fontSize: "0.875rem",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: "500",
                color: "#dc3545",
              }}
            >
              Error Details
            </summary>
            <pre
              style={{
                marginTop: "0.5rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: "#666",
              }}
            >
              {error.message}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={reset}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              fontWeight: "500",
              color: "white",
              backgroundColor: "#0066cc",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = "#0052a3")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = "#0066cc")
            }
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              fontWeight: "500",
              color: "#333",
              backgroundColor: "#e9ecef",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = "#dee2e6")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = "#e9ecef")
            }
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}
