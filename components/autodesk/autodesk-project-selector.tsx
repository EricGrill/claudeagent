"use client";

import { useState, useEffect, useCallback } from "react";
import type { AutodeskHub, AutodeskProject } from "@/lib/autodesk/types";

interface AutodeskProjectSelectorProps {
  onProjectSelect: (project: AutodeskProject, hub: AutodeskHub) => void;
  selectedProjectId?: string;
}

export function AutodeskProjectSelector({
  onProjectSelect,
  selectedProjectId,
}: AutodeskProjectSelectorProps) {
  const [hubs, setHubs] = useState<AutodeskHub[]>([]);
  const [projects, setProjects] = useState<AutodeskProject[]>([]);
  const [selectedHub, setSelectedHub] = useState<AutodeskHub | null>(null);
  const [isLoadingHubs, setIsLoadingHubs] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHubs() {
      try {
        const response = await fetch("/api/autodesk/hubs");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch hubs");
        }

        setHubs(data.hubs);
        if (data.hubs.length === 1) {
          setSelectedHub(data.hubs[0]);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load hubs";
        setError(message);
      } finally {
        setIsLoadingHubs(false);
      }
    }

    fetchHubs();
  }, []);

  useEffect(() => {
    async function fetchProjects() {
      if (!selectedHub) {
        setProjects([]);
        return;
      }

      setIsLoadingProjects(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/autodesk/projects?hubId=${encodeURIComponent(selectedHub.id)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch projects");
        }

        setProjects(data.projects);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load projects";
        setError(message);
      } finally {
        setIsLoadingProjects(false);
      }
    }

    fetchProjects();
  }, [selectedHub]);

  const handleHubChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const hub = hubs.find((h) => h.id === e.target.value);
      setSelectedHub(hub || null);
    },
    [hubs]
  );

  const handleProjectClick = useCallback(
    (project: AutodeskProject) => {
      if (selectedHub) {
        onProjectSelect(project, selectedHub);
      }
    },
    [selectedHub, onProjectSelect]
  );

  if (isLoadingHubs) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
        Loading accounts...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "1rem",
          backgroundColor: "#fee2e2",
          color: "#dc2626",
          borderRadius: "8px",
          marginBottom: "1rem",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div>
      {hubs.length > 1 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="hub-select"
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "0.5rem",
            }}
          >
            Select Account
          </label>
          <select
            id="hub-select"
            value={selectedHub?.id || ""}
            onChange={handleHubChange}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "1rem",
              backgroundColor: "white",
            }}
          >
            <option value="">Select an account...</option>
            {hubs.map((hub) => (
              <option key={hub.id} value={hub.id}>
                {hub.attributes.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedHub && (
        <div>
          <h3
            style={{
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "0.75rem",
            }}
          >
            Projects in {selectedHub.attributes.name}
          </h3>

          {isLoadingProjects ? (
            <div style={{ padding: "1rem", textAlign: "center", color: "#666" }}>
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div style={{ padding: "1rem", textAlign: "center", color: "#666" }}>
              No projects found in this account.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "0.75rem",
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectClick(project)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem",
                    backgroundColor:
                      project.id === selectedProjectId ? "#eff6ff" : "white",
                    border:
                      project.id === selectedProjectId
                        ? "2px solid #3b82f6"
                        : "1px solid #e5e7eb",
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    transition: "all 0.2s",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: "500",
                        color: "#1f2937",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {project.attributes.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      {project.attributes.extension.data.projectType || "Project"}
                    </div>
                  </div>
                  {project.id === selectedProjectId && (
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                      }}
                    >
                      Selected
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
