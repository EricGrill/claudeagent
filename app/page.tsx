export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
        Elizabethtown Jiu-Jitsu
      </h1>
      <p
        style={{
          fontSize: "1.25rem",
          color: "#666",
          textAlign: "center",
          maxWidth: "600px",
        }}
      >
        Welcome to our dojo. Train hard, stay humble.
      </p>
    </main>
  );
}
