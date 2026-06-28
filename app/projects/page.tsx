import Link from "next/link";
import { projects } from "@/lib/data";
import { Project } from "@/lib/types";

function getRiskBadgeStyle(riskLevel: Project["riskLevel"]) {
  const colors = {
    low: { bg: "#d4edda", text: "#155724" },
    medium: { bg: "#fff3cd", text: "#856404" },
    high: { bg: "#f8d7da", text: "#721c24" },
    critical: { bg: "#dc3545", text: "#ffffff" },
  };
  return colors[riskLevel];
}

function getStatusBadgeStyle(status: Project["status"]) {
  const colors = {
    active: { bg: "#cce5ff", text: "#004085" },
    completed: { bg: "#d4edda", text: "#155724" },
    "on-hold": { bg: "#fff3cd", text: "#856404" },
    archived: { bg: "#e2e3e5", text: "#383d41" },
  };
  return colors[status];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ProjectsPage() {
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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Link
              href="/"
              style={{
                textDecoration: "none",
                color: "#0066cc",
                fontSize: "0.875rem",
                marginBottom: "0.5rem",
                display: "inline-block",
              }}
            >
              &larr; Home
            </Link>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: "700",
                color: "#1a1a1a",
                margin: 0,
              }}
            >
              Projects
            </h1>
            <p style={{ color: "#666", margin: "0.5rem 0 0 0" }}>
              Manage and monitor all active projects
            </p>
          </div>
          <div
            style={{
              backgroundColor: "#0066cc",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            + New Project
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {projects.map((project) => {
            const riskStyle = getRiskBadgeStyle(project.riskLevel);
            const statusStyle = getStatusBadgeStyle(project.status);

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    border: "1px solid #e9ecef",
                    cursor: "pointer",
                    transition: "box-shadow 0.2s, transform 0.2s",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "1rem",
                    }}
                  >
                    <h2
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: "600",
                        color: "#1a1a1a",
                        margin: 0,
                        flex: 1,
                      }}
                    >
                      {project.name}
                    </h2>
                    <span
                      style={{
                        backgroundColor: riskStyle.bg,
                        color: riskStyle.text,
                        padding: "0.25rem 0.75rem",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        textTransform: "uppercase",
                        marginLeft: "0.5rem",
                      }}
                    >
                      {project.riskLevel}
                    </span>
                  </div>

                  <p
                    style={{
                      color: "#666",
                      fontSize: "0.875rem",
                      lineHeight: "1.5",
                      marginBottom: "1rem",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {project.description}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.text,
                        padding: "0.25rem 0.75rem",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        textTransform: "capitalize",
                      }}
                    >
                      {project.status}
                    </span>
                    <span style={{ color: "#999", fontSize: "0.875rem" }}>
                      &bull; {project.claimsCount} claims
                    </span>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.75rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span style={{ color: "#666" }}>Progress</span>
                      <span style={{ color: "#1a1a1a", fontWeight: "500" }}>
                        {project.progress}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: "6px",
                        backgroundColor: "#e9ecef",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${project.progress}%`,
                          backgroundColor:
                            project.progress === 100 ? "#28a745" : "#0066cc",
                          borderRadius: "3px",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "1rem",
                      borderTop: "1px solid #e9ecef",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#999",
                          display: "block",
                        }}
                      >
                        Owner
                      </span>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: "#1a1a1a",
                        }}
                      >
                        {project.owner}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#999",
                          display: "block",
                        }}
                      >
                        Budget
                      </span>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: "#1a1a1a",
                          fontWeight: "600",
                        }}
                      >
                        {formatCurrency(project.budget)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
