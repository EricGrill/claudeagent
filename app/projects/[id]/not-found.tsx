import Link from "next/link";

export default function ProjectNotFound() {
  return (
    <div
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
          📋
        </div>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "#1a1a1a",
            marginBottom: "0.5rem",
          }}
        >
          Project Not Found
        </h1>
        <p
          style={{
            color: "#666",
            marginBottom: "1.5rem",
            lineHeight: "1.5",
          }}
        >
          The project you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Link
            href="/projects"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              fontWeight: "500",
              color: "white",
              backgroundColor: "#0066cc",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            View All Projects
          </Link>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              fontWeight: "500",
              color: "#333",
              backgroundColor: "#e9ecef",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
