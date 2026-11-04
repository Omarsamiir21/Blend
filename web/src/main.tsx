import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const sections = [
  ["Overview", "/", "Appliance status"],
  ["Labs", "/labs", "Logical machine groups and network mappings"],
  ["Machines", "/machines", "Enrolled guest inventory"],
  ["Captures", "/captures", "Verified disk archives"],
  ["Deployments", "/deployments", "Proxmox plans and deployment history"],
  ["Recovery", "/recovery", "Portable packages and offline restoration"],
  ["Infrastructure", "/infrastructure", "Appliance dependencies and destination connections"],
  ["Settings", "/settings", "Appliance identity, storage, and policies"],
] as const;

type Readiness = "Checking" | "Ready" | "Unavailable" | "Connection failed";

function SystemHealth() {
  const [status, setStatus] = useState<Readiness>("Checking");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function check() {
      try {
        const response = await fetch("/api/v1/system/health", { signal: controller.signal });
        const result = await response.json();
        if (response.ok && result.status === "ready" && result.database === "ready") {
          setStatus("Ready");
        } else if (response.status === 503 && result.database === "unavailable") {
          setStatus("Unavailable");
        } else {
          setStatus("Connection failed");
        }
      } catch {
        if (!controller.signal.aborted) setStatus("Connection failed");
      }
    }
    void check();
    return () => controller.abort();
  }, [attempt]);

  return (
    <section className="panel" aria-labelledby="health-title">
      <div>
        <h2 id="health-title">System health</h2>
        <p>PostgreSQL connectivity and schema readiness</p>
      </div>
      <p role="status" className={status === "Ready" ? "ready" : undefined}>{status}</p>
      <button disabled={status === "Checking"} onClick={() => {
        setStatus("Checking");
        setAttempt(attempt + 1);
      }}>Refresh</button>
    </section>
  );
}

function App() {
  const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
  const [name, href, description] = sections.find((entry) => entry[1] === currentPath) ?? sections[0];
  return (
    <div className="layout">
      <aside>
        <a className="brand" href="/" aria-label="Blend overview">blend<span>.</span></a>
        <nav aria-label="Appliance">
          {sections.map(([label, link]) => (
            <a key={link} href={link} aria-current={link === href ? "page" : undefined}>{label}</a>
          ))}
        </nav>
      </aside>
      <main>
        <header className="eyebrow">Blend appliance / {name}</header>
        <h1>{href === "/" ? "Welcome to blend." : name}</h1>
        <p className="description">{description}</p>
        {href === "/" || href === "/infrastructure" ? <SystemHealth /> : (
          <section className="panel"><p>This workflow is unavailable in the foundation build.</p></section>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
