"use client";

import { useState, useEffect, useCallback } from "react";
import type { AutodeskIssue, AutodeskIssueStatus } from "@/lib/autodesk/types";

interface AutodeskIssuesListProps {
  projectId: string;
  onIssueSelect?: (issue: AutodeskIssue) => void;
  onImportIssue?: (issue: AutodeskIssue) => void;
}

const statusColors: Record<AutodeskIssueStatus, { bg: string; text: string }> = {
  draft: { bg: "#f3f4f6", text: "#374151" },
  open: { bg: "#dbeafe", text: "#1d4ed8" },
  pending: { bg: "#fef3c7", text: "#b45309" },
  in_progress: { bg: "#e0e7ff", text: "#4338ca" },
  in_review: { bg: "#fce7f3", text: "#be185d" },
  completed: { bg: "#d1fae5", text: "#047857" },
  not_approved: { bg: "#fee2e2", text: "#dc2626" },
  in_dispute: { bg: "#fecaca", text: "#b91c1c" },
  closed: { bg: "#e5e7eb", text: "#6b7280" },
  void: { bg: "#f3f4f6", text: "#9ca3af" },
};

export function AutodeskIssuesList({
  projectId,
  onIssueSelect,
  onImportIssue,
}: AutodeskIssuesListProps) {
  const [issues, setIssues] = useState<AutodeskIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ projectId });
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(`/api/autodesk/issues?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch issues");
      }

      setIssues(data.issues);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load issues";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, searchTerm, statusFilter]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    fetchIssues();
  }, [fetchIssues]);

  if (error) {
    return (
      <div
        style={{
          padding: "1rem",
          backgroundColor: "#fee2e2",
          color: "#dc2626",
          borderRadius: "8px",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <form onSubmit={handleSearch} style={{ flex: 1, minWidth: "200px" }}>
          <input
            type="text"
            placeholder="Search issues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "0.875rem",
            }}
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "0.75rem",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            fontSize: "0.875rem",
            backgroundColor: "white",
          }}
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {isLoading ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
          Loading issues...
        </div>
      ) : issues.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
          No issues found.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {issues.map((issue) => {
            const statusStyle = statusColors[issue.status] || {
              bg: "#f3f4f6",
              text: "#374151",
            };

            return (
              <div
                key={issue.id}
                style={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          fontWeight: "500",
                        }}
                      >
                        #{issue.displayId}
                      </span>
                      <span
                        style={{
                          padding: "0.125rem 0.5rem",
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.text,
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                          textTransform: "capitalize",
                        }}
                      >
                        {issue.status.replace("_", " ")}
                      </span>
                    </div>
                    <h4
                      style={{
                        fontSize: "0.9375rem",
                        fontWeight: "500",
                        color: "#1f2937",
                        marginBottom: "0.25rem",
                        cursor: onIssueSelect ? "pointer" : "default",
                      }}
                      onClick={() => onIssueSelect?.(issue)}
                    >
                      {issue.title}
                    </h4>
                    {issue.description && (
                      <p
                        style={{
                          fontSize: "0.8125rem",
                          color: "#6b7280",
                          lineHeight: "1.4",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {issue.description}
                      </p>
                    )}
                  </div>
                  {onImportIssue && (
                    <button
                      onClick={() => onImportIssue(issue)}
                      style={{
                        padding: "0.5rem 0.75rem",
                        backgroundColor: "#0066cc",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Import as Claim
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    fontSize: "0.75rem",
                    color: "#6b7280",
                  }}
                >
                  {issue.dueDate && (
                    <span>
                      Due: {new Date(issue.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  <span>
                    Created: {new Date(issue.createdAt).toLocaleDateString()}
                  </span>
                  {issue.commentCount > 0 && (
                    <span>{issue.commentCount} comments</span>
                  )}
                  {issue.attachmentCount > 0 && (
                    <span>{issue.attachmentCount} attachments</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
