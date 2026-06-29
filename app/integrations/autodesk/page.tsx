"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AutodeskConnectButton,
  AutodeskConnectionStatus,
  AutodeskProjectSelector,
  AutodeskIssuesList,
} from "@/components/autodesk";
import type { AutodeskProject, AutodeskHub, AutodeskIssue } from "@/lib/autodesk/types";

function AutodeskIntegrationContent() {
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<AutodeskProject | null>(null);
  const [selectedHub, setSelectedHub] = useState<AutodeskHub | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "true") {
      setNotification({
        type: "success",
        message: "Successfully connected to Autodesk!",
      });
      setIsAuthenticated(true);
    } else if (error) {
      setNotification({
        type: "error",
        message: decodeURIComponent(error),
      });
    }
  }, [searchParams]);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/autodesk/auth/status");
        const data = await response.json();
        setIsAuthenticated(data.isAuthenticated);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  const handleProjectSelect = useCallback(
    (project: AutodeskProject, hub: AutodeskHub) => {
      setSelectedProject(project);
      setSelectedHub(hub);
    },
    []
  );

  const handleImportIssue = useCallback((issue: AutodeskIssue) => {
    setNotification({
      type: "success",
      message: `Issue "${issue.title}" imported as a new claim!`,
    });
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsAuthenticated(false);
    setSelectedProject(null);
    setSelectedHub(null);
    setNotification({
      type: "success",
      message: "Disconnected from Autodesk",
    });
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div style={{ color: "#666" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <header
        style={{
          backgroundColor: "white",
          borderBottom: "1px solid #e9ecef",
          padding: "1.5rem 2rem",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <Link
            href="/integrations"
            style={{
              textDecoration: "none",
              color: "#0066cc",
              fontSize: "0.875rem",
              marginBottom: "0.5rem",
              display: "inline-block",
            }}
          >
            &larr; Back to Integrations
          </Link>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginTop: "0.5rem",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#000",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.09 3.54L12 11.27 4.91 7.72 12 4.18zM4 8.82l7 3.5v6.86l-7-3.5V8.82zm9 10.36V12.32l7-3.5v6.86l-7 3.5z"
                  fill="white"
                />
              </svg>
            </div>
            <div>
              <h1
                style={{
                  fontSize: "1.75rem",
                  fontWeight: "700",
                  color: "#1a1a1a",
                  margin: 0,
                }}
              >
                Autodesk Construction Cloud
              </h1>
              <p style={{ color: "#666", margin: "0.25rem 0 0 0" }}>
                Connect to Autodesk to sync projects and issues with ClaimZero
              </p>
            </div>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "2rem",
        }}
      >
        {notification && (
          <div
            style={{
              padding: "1rem",
              marginBottom: "1.5rem",
              borderRadius: "8px",
              backgroundColor:
                notification.type === "success" ? "#d1fae5" : "#fee2e2",
              color: notification.type === "success" ? "#047857" : "#dc2626",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.25rem",
                cursor: "pointer",
                color: "inherit",
                lineHeight: 1,
              }}
            >
              &times;
            </button>
          </div>
        )}

        <div style={{ marginBottom: "1.5rem" }}>
          <AutodeskConnectionStatus onDisconnect={handleDisconnect} />
        </div>

        {!isAuthenticated ? (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "3rem",
              textAlign: "center",
              border: "1px solid #e9ecef",
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                color: "#1a1a1a",
                marginBottom: "0.75rem",
              }}
            >
              Connect Your Autodesk Account
            </h2>
            <p
              style={{
                color: "#666",
                marginBottom: "2rem",
                maxWidth: "400px",
                margin: "0 auto 2rem",
              }}
            >
              Link your Autodesk Construction Cloud account to sync projects,
              issues, and documents with ClaimZero.
            </p>
            <AutodeskConnectButton
              onError={(error) =>
                setNotification({ type: "error", message: error })
              }
            />
            <div
              style={{
                marginTop: "2rem",
                padding: "1rem",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#1a1a1a",
                  marginBottom: "0.5rem",
                }}
              >
                What you can do with this integration:
              </h3>
              <ul
                style={{
                  textAlign: "left",
                  color: "#666",
                  fontSize: "0.875rem",
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                }}
              >
                <li style={{ marginBottom: "0.5rem" }}>
                  ✓ View and sync Autodesk projects
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  ✓ Import issues as claims
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  ✓ Access project documents
                </li>
                <li>✓ Receive real-time updates via webhooks</li>
              </ul>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: selectedProject ? "350px 1fr" : "1fr",
              gap: "1.5rem",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "1.5rem",
                border: "1px solid #e9ecef",
              }}
            >
              <h2
                style={{
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#1a1a1a",
                  marginBottom: "1rem",
                }}
              >
                Select a Project
              </h2>
              <AutodeskProjectSelector
                onProjectSelect={handleProjectSelect}
                selectedProjectId={selectedProject?.id}
              />
            </div>

            {selectedProject && (
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  border: "1px solid #e9ecef",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                    paddingBottom: "1rem",
                    borderBottom: "1px solid #e9ecef",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: "600",
                        color: "#1a1a1a",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {selectedProject.attributes.name}
                    </h2>
                    <p style={{ fontSize: "0.875rem", color: "#666", margin: 0 }}>
                      Issues from Autodesk Construction Cloud
                    </p>
                  </div>
                  <button
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "#0066cc",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      cursor: "pointer",
                    }}
                  >
                    Link to ClaimZero Project
                  </button>
                </div>

                <AutodeskIssuesList
                  projectId={selectedProject.id}
                  onImportIssue={handleImportIssue}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AutodeskIntegrationPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Loading...
        </div>
      }
    >
      <AutodeskIntegrationContent />
    </Suspense>
  );
}
