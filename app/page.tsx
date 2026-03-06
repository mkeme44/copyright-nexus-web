export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Copyright Compass — API Ready</h1>
      <p>
        Backend is running. Send a POST request to{" "}
        <code>/api/query</code> with{" "}
        <code>{`{ "question": "your question here" }`}</code>
      </p>
      <p style={{ color: "#888", fontSize: "0.875rem" }}>
        UI coming soon.
      </p>
    </main>
  );
}
