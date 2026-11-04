import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Icon, OverviewPreview, WorkflowPreview, workflows } from "./preview";
import "./styles.css";

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
  const workflow = workflows.find((entry) => entry.path === currentPath);
  const name = workflow?.name ?? "Overview";

  return (
    <div className="layout">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Blend overview">blend<span>.</span></a>
        <p className="sidebar-caption">Migration workspace</p>
        <nav aria-label="Appliance">
          <a href="/" aria-current={!workflow ? "page" : undefined}><Icon name="overview" />Overview</a>
          {workflows.map((entry) => (
            <a key={entry.path} href={entry.path} aria-current={entry.path === currentPath ? "page" : undefined}>
              <Icon name={entry.icon} />{entry.name}
            </a>
          ))}
        </nav>
        <div className="sidebar-foot"><span className="preview-dot" /> Design preview</div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>Appliance <span className="breadcrumb-separator">/</span> <strong>{name}</strong></span>
          <span className="badge"><span className="preview-dot" /> UI preview</span>
        </header>
        <main>
          <div className="page-heading">
            <span className="kicker">{workflow ? "Workspace" : "Appliance overview"}</span>
            <h1>{workflow?.name ?? "Welcome to blend."}</h1>
            <p className="description">{workflow?.summary ?? "Capture, migrate, and deploy complete virtual labs — your way."}</p>
          </div>
          {workflow ? <WorkflowPreview workflow={workflow} /> : <OverviewPreview />}
          {(!workflow || workflow.path === "/infrastructure") && <SystemHealth />}
        </main>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
