import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectById, getClaimsByProjectId } from "@/lib/data";
import { Project, Claim } from "@/lib/types";

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

function getClaimStatusStyle(status: Claim["status"]) {
  const colors = {
    pending: { bg: "#fff3cd", text: "#856404" },
    approved: { bg: "#d4edda", text: "#155724" },
    rejected: { bg: "#f8d7da", text: "#721c24" },
    "under-review": { bg: "#cce5ff", text: "#004085" },
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const project = getProjectById(id);

  if (!project) {
    notFound();
  }

  const claims = getClaimsByProjectId(id);
  const riskStyle = getRiskBadgeStyle(project.riskLevel);
  const statusStyle = getStatusBadgeStyle(project.status);

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
            href="/projects"
            style={{
              textDecoration: "none",
              color: "#0066cc",
              fontSize: "0.875rem",
              marginBottom: "0.5rem",
              display: "inline-block",
            }}
          >
            &larr; Back to Projects
          </Link>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginTop: "0.5rem",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "1.75rem",
                  fontWeight: "700",
                  color: "#1a1a1a",
                  margin: 0,
                }}
              >
                {project.name}
              </h1>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginTop: "0.75rem",
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
                <span
                  style={{
                    backgroundColor: riskStyle.bg,
                    color: riskStyle.text,
                    padding: "0.25rem 0.75rem",
                    borderRadius: "12px",
                    fontSize: "0.75rem",
                    fontWeight: "500",
                    textTransform: "uppercase",
                  }}
                >
                  {project.riskLevel} risk
                </span>
              </div>
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
              Edit Project
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "2rem",
          }}
        >
          <div>
            <section
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "1.5rem",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                border: "1px solid #e9ecef",
                marginBottom: "2rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "#1a1a1a",
                  marginTop: 0,
                  marginBottom: "1rem",
                }}
              >
                Description
              </h2>
              <p
                style={{
                  color: "#666",
                  lineHeight: "1.6",
                  margin: 0,
                }}
              >
                {project.description}
              </p>
            </section>

            <section
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "1.5rem",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                border: "1px solid #e9ecef",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    color: "#1a1a1a",
                    margin: 0,
                  }}
                >
                  Claims ({claims.length})
                </h2>
                <div
                  style={{
                    backgroundColor: "#e9ecef",
                    color: "#495057",
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    fontWeight: "500",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                >
                  + Add Claim
                </div>
              </div>

              {claims.length === 0 ? (
                <p style={{ color: "#999", textAlign: "center", padding: "2rem 0" }}>
                  No claims have been submitted for this project yet.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {claims.map((claim) => {
                    const claimStatusStyle = getClaimStatusStyle(claim.status);
                    return (
                      <div
                        key={claim.id}
                        style={{
                          padding: "1rem",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "8px",
                          border: "1px solid #e9ecef",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <h3
                            style={{
                              fontSize: "1rem",
                              fontWeight: "600",
                              color: "#1a1a1a",
                              margin: 0,
                            }}
                          >
                            {claim.title}
                          </h3>
                          <span
                            style={{
                              backgroundColor: claimStatusStyle.bg,
                              color: claimStatusStyle.text,
                              padding: "0.25rem 0.75rem",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              textTransform: "capitalize",
                            }}
                          >
                            {claim.status.replace("-", " ")}
                          </span>
                        </div>
                        <p
                          style={{
                            color: "#666",
                            fontSize: "0.875rem",
                            margin: "0 0 0.75rem 0",
                          }}
                        >
                          {claim.description}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "0.875rem",
                          }}
                        >
                          <span style={{ color: "#999" }}>
                            Submitted by {claim.submittedBy} on{" "}
                            {formatDate(claim.submittedAt)}
                          </span>
                          <span
                            style={{
                              color: "#1a1a1a",
                              fontWeight: "600",
                            }}
                          >
                            {formatCurrency(claim.amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <div>
            <section
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "1.5rem",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                border: "1px solid #e9ecef",
                marginBottom: "1.5rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "#1a1a1a",
                  marginTop: 0,
                  marginBottom: "1.5rem",
                }}
              >
                Progress
              </h2>
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <span
                  style={{
                    fontSize: "3rem",
                    fontWeight: "700",
                    color: project.progress === 100 ? "#28a745" : "#0066cc",
                  }}
                >
                  {project.progress}%
                </span>
              </div>
              <div
                style={{
                  height: "8px",
                  backgroundColor: "#e9ecef",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${project.progress}%`,
                    backgroundColor:
                      project.progress === 100 ? "#28a745" : "#0066cc",
                    borderRadius: "4px",
                  }}
                />
              </div>
            </section>

            <section
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "1.5rem",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                border: "1px solid #e9ecef",
              }}
            >
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "#1a1a1a",
                  marginTop: 0,
                  marginBottom: "1.5rem",
                }}
              >
                Details
              </h2>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#999",
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Owner
                  </span>
                  <span style={{ color: "#1a1a1a", fontWeight: "500" }}>
                    {project.owner}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#999",
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Budget
                  </span>
                  <span style={{ color: "#1a1a1a", fontWeight: "500" }}>
                    {formatCurrency(project.budget)}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#999",
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Created
                  </span>
                  <span style={{ color: "#1a1a1a", fontWeight: "500" }}>
                    {formatDate(project.createdAt)}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#999",
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Last Updated
                  </span>
                  <span style={{ color: "#1a1a1a", fontWeight: "500" }}>
                    {formatDate(project.updatedAt)}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#999",
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Total Claims
                  </span>
                  <span style={{ color: "#1a1a1a", fontWeight: "500" }}>
                    {project.claimsCount}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
