import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, workflows } from "./preview";
import migrationHero from "./assets/migration-hero.png";

export function PreviewToolbar() {
  const [query, setQuery] = useState("");
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        search.current?.focus();
      }
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const term = query.trim().toLowerCase();
  const results = workflows.filter((item) =>
    [item.name, ...item.examples.flat()].some((value) => value.toLowerCase().includes(term)),
  );

  return <header className="dashboard-toolbar">
    <div className="global-search">
      <Icon name="search" />
      <input ref={search} type="search" aria-label="Search preview workspaces" placeholder="Search labs, machines, captures…" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setQuery(""); }} />
      <kbd>Ctrl K</kbd>
      {term && <div className="search-results" aria-label="Preview search results">
        {results.length ? results.map((item) => <a href={item.path} key={item.path}><Icon name={item.icon} />{item.name}</a>) : <p>No matching preview workspaces.</p>}
      </div>}
    </div>
    <div className="toolbar-tools">
      {[
        ["bell", "Notifications", "Notifications are being built."],
        ["help", "Help", "Explore the sample workflows. The dashboard uses illustrative data."],
        ["user", "Account", "Administrator sign-in is being built."],
      ].map(([icon, label, message]) => <details key={icon}>
        <summary aria-label={label} className={icon === "user" ? "account-icon" : undefined}><Icon name={icon} /></summary>
        <p>{message}</p>
      </details>)}
    </div>
  </header>;
}

const actions = [
  ["Capture", "Capture disks from a source machine or lab.", "/captures", "capture"],
  ["Deploy", "Restore verified captures to Proxmox.", "/deployments", "grid"],
  ["Recover", "Create a portable recovery package.", "/recovery", "recovery"],
];

const metrics = [
  ["3", "Labs", "grid"], ["12", "Machines", "monitor"], ["1.8 TB", "Storage Used", "database"], ["2", "Active Tasks", "pulse"],
];

const tasks = [
  ["Capturing LAB-DC01", "Disk 1 of 2 · 62.4 GB / 80.0 GB", 78, "/captures", "capture"],
  ["Deploying AD Lab to Proxmox", "Restoring disks · 1 of 3 VMs", 43, "/deployments", "deploy"],
] as const;

export function OverviewPreview({ health }: { health: ReactNode }) {
  return <>
    <section className="dashboard-hero" aria-label="Migration workflow example">
      <img className="hero-art" src={migrationHero} alt="" width="2172" height="724" />
      <div className="hero-copy">
        <div className="hero-caption"><span className="kicker">Overview</span><span className="badge">Design preview · sample data</span></div>
        <h1>Welcome to <em>blend<span>.</span></em></h1>
        <p>Capture, migrate, and deploy complete virtual labs — your way.</p>
      </div>
      <div className="migration-scene">
        {[
          ["Source", "Skillable / Remote VM", "monitor"],
          ["Destination", "Proxmox VE", "server"],
        ].map(([label, description, icon]) => <div className="migration-endpoint" key={label}>
          <div className="endpoint-label"><Icon name={icon} /><div><strong>{label}</strong><small>{description}</small></div></div>
        </div>)}
      </div>
    </section>

    <div className="dashboard-actions">
      {actions.map(([name, description, path, icon]) => <a className="dashboard-action" href={path} key={path}>
        <Icon name={icon} /><div><strong>{name}</strong><p>{description}</p></div><span aria-hidden="true">→</span>
      </a>)}
    </div>

    <section className="dashboard-metrics" aria-label="Illustrative dashboard metrics">
      {metrics.map(([value, label, icon]) => <div className="dashboard-metric" key={label}>
        <Icon name={icon} /><div><strong>{value}</strong><span>{label}</span></div>
      </div>)}
    </section>

    <div className="dashboard-panels">
      <section className="dashboard-panel">
        <header><h2>Active Tasks</h2><span className="badge">Sample data</span></header>
        {tasks.map(([name, description, value, path, icon]) => <a className="task-row" href={path} key={name}>
          <span className="task-icon"><Icon name={icon} /></span>
          <div className="task-description"><strong>{name}</strong><small>{description}</small></div>
          <div className="task-progress"><progress aria-label={name + " sample progress"} value={value} max={100} /><strong>{value}%</strong></div>
        </a>)}
      </section>

      <section className="dashboard-panel">
        <header><h2>System Health</h2><span className="badge">Sample resource usage</span></header>
        <div className="health-gauges">
          {([["CPU", 14], ["Memory", 28], ["Storage", 36]] as const).map(([label, value]) => <div className="health-gauge" key={label}>
            <svg viewBox="0 0 96 96" aria-hidden="true">
              <circle cx="48" cy="48" r="41" />
              <circle className="gauge-value" cx="48" cy="48" r="41" pathLength="100" strokeDasharray={`${value} 100`} transform="rotate(-90 48 48)" />
            </svg>
            <div><span>{label}</span><strong>{value}%</strong></div>
          </div>)}
        </div>
        {health}
      </section>
    </div>
  </>;
}
