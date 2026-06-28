import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 150px)",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "2.5rem",
          fontWeight: "700",
          marginBottom: "1rem",
          color: "#1a1a1a",
        }}
      >
        Hippo Bitcoin ATM
      </h1>
      <p
        style={{
          fontSize: "1.25rem",
          color: "#666",
          maxWidth: "600px",
          marginBottom: "2rem",
          lineHeight: "1.6",
        }}
      >
        #1 provider of Bitcoin ATMs in Pennsylvania. Buy and sell Bitcoin easily at our convenient locations.
      </p>
      <Link
        href="/locations"
        style={{
          backgroundColor: "#f5c518",
          color: "#1a1a1a",
          padding: "1rem 2rem",
          fontSize: "1rem",
          fontWeight: "600",
          borderRadius: "8px",
          transition: "background-color 0.2s",
        }}
      >
        Find a Bitcoin ATM
      </Link>
    </main>
  );
}
