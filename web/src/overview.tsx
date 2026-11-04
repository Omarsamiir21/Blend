import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon, workflows } from "./preview";

function Globe() {
  return <svg className="hero-globe" viewBox="0 0 700 340" aria-hidden="true">
    <defs>
      <linearGradient id="globe-fill" x2="0" y2="1">
        <stop stopColor="#72cdf1" /><stop offset="1" stopColor="#eef6ff" stopOpacity=".12" />
      </linearGradient>
    </defs>
    <path d="M5 330C82 140 228 24 397 25c144-2 254 61 303 119v186Z" fill="url(#globe-fill)" />
    <g fill="#e3f4fb" opacity=".76">
      <path d="m135 157 22-29 47-26 36-9 13-19 67-21 39-9 8 7-25 10 16 10-30 14 19 10-26 16-28-1-11 25-39 11-15 22-29-6-18 10 13 11-14 13-19-16-28 1z" />
      <path d="m261 170 26 3 28 24 20 6-8 29-24 26-18 36-13-8 7-45-17-26-10-25zM342 60l28-10 48-6 34 6-17 17-43 7-22-2z" />
      <path d="m441 110 13-18 29 1 14-16 42 5 24-8 60 18 23 15-17 9 35 12 21 28-24 7-26-17-30 4-19 18-17-12-36 5-8 23-22-16-30-8-12-23-23-4z" />
      <path d="m453 150 35 5 18 20 25 7-11 26-21 28-21 7-15-29-12-7-12-27zM614 217l25-12 25 6 19 23-16 17-38-4-21-15z" />
    </g>
    <path d="M52 244C220 167 499 139 698 185M112 169C261 107 493 87 674 126M289 38c-58 39-104 111-117 190m233-203c-6 51-8 115 2 189m82-177c66 27 123 81 151 151" fill="none" stroke="#f5fbff" strokeOpacity=".31" />
  </svg>;
}

function Rack() {
  const id = useId();
  return <svg className="rack-art" viewBox="0 0 260 156" aria-hidden="true">
    <defs>
      <linearGradient id={id} x2="1" y2="1"><stop stopColor="#416d88" /><stop offset="1" stopColor="#102e46" /></linearGradient>
    </defs>
    <ellipse cx="130" cy="140" rx="115" ry="11" fill="#51cee4" opacity=".27" />
    <path d="M13 129 123 105 247 125 135 151Z" fill="#5796ac" />
    <path d="M13 129v8l122 18 112-23v-7l-112 26Z" fill="#28536e" />
    <path d="M23 134l82 12m50 1 81-18" stroke="#35e8ff" strokeWidth="2.5" strokeLinecap="round" />
    <path d="m37 64 35-13v76l-35 7zM195 53l26 9v68l-26-5z" fill="#315e78" />
    <path d="M63 43 126 16l74 25v87l-74 13-63-13Z" fill="#143b54" />
    <path d="M63 43 126 16v125l-63-13Z" fill={`url(#${id})`} />
    <path d="M126 16 200 41v87l-74 13Z" fill="#274f69" />
    <path d="M78 49 116 35v91l-38-5Zm59-14 48 14v72l-48 7Z" fill="#08283e" />
    <g stroke="#15cae8" strokeWidth="4" opacity=".88">
      <path d="m82 55 30-10m-30 17 30-10m-30 17 30-10m29-14 40 11m-40-4 40 11m-40-4 40 11" />
    </g>
    <path d="M126 17v123M64 44l62-26 74 24" fill="none" stroke="#638ba3" strokeWidth="1.5" />
  </svg>;
}

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
      <Globe />
      <div className="hero-copy">
        <div className="hero-caption"><span className="kicker">Overview</span><span className="badge">Design preview · sample data</span></div>
        <h1>Welcome to <em>blend<span>.</span></em></h1>
        <p>Capture, migrate, and deploy complete virtual labs — your way.</p>
      </div>
      <div className="migration-scene">
        <div className="migration-line" aria-hidden="true" />
        {[
          ["Source", "Skillable / Remote VM", "monitor"],
          ["Destination", "Proxmox VE", "server"],
        ].map(([label, description, icon]) => <div className="migration-endpoint" key={label}>
          <Rack />
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
