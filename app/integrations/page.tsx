import Link from "next/link";

interface Integration {
  id: string;
  name: string;
  description: string;
  logo: React.ReactNode;
  status: "available" | "coming-soon" | "connected";
  href: string;
}

const integrations: Integration[] = [
  {
    id: "autodesk",
    name: "Autodesk Construction Cloud",
    description:
      "Connect to Autodesk to sync projects, issues, and documents with ClaimZero.",
    logo: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.09 3.54L12 11.27 4.91 7.72 12 4.18zM4 8.82l7 3.5v6.86l-7-3.5V8.82zm9 10.36V12.32l7-3.5v6.86l-7 3.5z"
          fill="currentColor"
        />
      </svg>
    ),
    status: "available",
    href: "/integrations/autodesk",
  },
  {
    id: "procore",
    name: "Procore",
    description:
      "Sync project management data and daily logs from Procore.",
    logo: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="24" height="24" rx="4" fill="#F47920" />
        <path
          d="M7 8h10v2H7V8zm0 3h10v2H7v-2zm0 3h6v2H7v-2z"
          fill="white"
        />
      </svg>
    ),
    status: "coming-soon",
    href: "#",
  },
  {
    id: "oracle-primavera",
    name: "Oracle Primavera P6",
    description:
      "Import project schedules and track delays from Primavera.",
    logo: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="24" height="24" rx="4" fill="#C74634" />
        <path
          d="M6 6h12v12H6V6zm2 2v8h8V8H8z"
          fill="white"
        />
      </svg>
    ),
    status: "coming-soon",
    href: "#",
  },
  {
    id: "microsoft-project",
    name: "Microsoft Project",
    description:
      "Sync tasks and milestones from Microsoft Project Online.",
    logo: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="24" height="24" rx="4" fill="#31752F" />
        <path
          d="M6 7h4v2H8v6h2v2H6V7zm6 0h4l2 4-2 4h-4v-2h3l1-2-1-2h-3V7z"
          fill="white"
        />
      </svg>
    ),
    status: "coming-soon",
    href: "#",
  },
];

export default function IntegrationsPage() {
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
              margin: "0.5rem 0 0 0",
            }}
          >
            Integrations
          </h1>
          <p style={{ color: "#666", margin: "0.5rem 0 0 0" }}>
            Connect ClaimZero with your favorite construction management tools
          </p>
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
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {integrations.map((integration) => (
            <Link
              key={integration.id}
              href={integration.href}
              style={{
                textDecoration: "none",
                pointerEvents:
                  integration.status === "coming-soon" ? "none" : "auto",
              }}
            >
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  border: "1px solid #e9ecef",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "box-shadow 0.2s, transform 0.2s",
                  cursor:
                    integration.status === "coming-soon"
                      ? "default"
                      : "pointer",
                  opacity: integration.status === "coming-soon" ? 0.7 : 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#1a1a1a",
                    }}
                  >
                    {integration.logo}
                  </div>
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: "500",
                      backgroundColor:
                        integration.status === "available"
                          ? "#dbeafe"
                          : integration.status === "connected"
                          ? "#d1fae5"
                          : "#f3f4f6",
                      color:
                        integration.status === "available"
                          ? "#1d4ed8"
                          : integration.status === "connected"
                          ? "#047857"
                          : "#6b7280",
                    }}
                  >
                    {integration.status === "available"
                      ? "Available"
                      : integration.status === "connected"
                      ? "Connected"
                      : "Coming Soon"}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    color: "#1a1a1a",
                    marginBottom: "0.5rem",
                  }}
                >
                  {integration.name}
                </h3>

                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#666",
                    lineHeight: "1.5",
                    flex: 1,
                  }}
                >
                  {integration.description}
                </p>

                {integration.status === "available" && (
                  <div
                    style={{
                      marginTop: "1rem",
                      paddingTop: "1rem",
                      borderTop: "1px solid #e9ecef",
                    }}
                  >
                    <span
                      style={{
                        color: "#0066cc",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                      }}
                    >
                      Configure &rarr;
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
