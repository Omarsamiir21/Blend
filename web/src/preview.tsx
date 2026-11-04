import { useState } from "react";

type Workflow = {
  name: string;
  path: string;
  icon: string;
  summary: string;
  action: string;
  columns: [string, string, string];
  examples: [string, string, string][];
  steps: [string, string][];
};

export const workflows: Workflow[] = [
  {
    name: "Labs", path: "/labs", icon: "grid", summary: "Organize machines, network mappings, and dependencies into reusable environments.", action: "Create lab",
    columns: ["Lab", "Machines", "Capture readiness"],
    examples: [["Identity resilience", "3 machines", "Partially captured"], ["Linux fundamentals", "2 machines", "Draft"]],
    steps: [["Define the lab", "Give the environment a name and describe what it supports."], ["Group machines", "Select source machines and record the order they depend on each other."], ["Map networks", "Review destination bridges and VLANs before deployment."]],
  },
  {
    name: "Machines", path: "/machines", icon: "server", summary: "Inspect enrolled guests and review their disk layouts before a capture.", action: "Enroll machine",
    columns: ["Machine", "Platform", "Boot and disk layout"],
    examples: [["identity-dc-01", "Windows Server", "UEFI · 2 disks"], ["linux-app-01", "Ubuntu Server", "UEFI · 1 disk"]],
    steps: [["Generate enrollment token", "Create a short-lived, single-use token from the appliance."], ["Connect the agent", "Install the agent inside the authorized source guest."], ["Review inventory", "Check firmware, disks, network interfaces, and capture capabilities."]],
  },
  {
    name: "Captures", path: "/captures", icon: "capture", summary: "Review disk captures, consistency modes, and archive integrity.", action: "New capture",
    columns: ["Capture", "Consistency mode", "Lifecycle stage"],
    examples: [["linux-app-01 / baseline", "Offline", "Verified"], ["linux-tools-01 / pre-upgrade", "Snapshot", "Awaiting verification"]],
    steps: [["Select source disks", "Choose an enrolled machine and review the disks to include."], ["Run preflight", "Confirm the supported consistency mode and available storage."], ["Transfer and verify", "Resume interrupted uploads and verify the archive before deployment."]],
  },
  {
    name: "Deployments", path: "/deployments", icon: "deploy", summary: "Plan how verified archives will be reconstructed on Proxmox.", action: "Plan deployment",
    columns: ["Deployment", "Destination", "Plan status"],
    examples: [["Linux fundamentals / validation", "Example Proxmox node", "Draft"], ["Identity resilience / recovery", "Example recovery node", "Mapping required"]],
    steps: [["Choose an archive", "Select a verified capture or a lab with the required machine versions."], ["Map the destination", "Review VM IDs, storage, firmware, and network bridges."], ["Review and deploy", "Confirm the plan, import disks, and record boot validation."]],
  },
  {
    name: "Recovery", path: "/recovery", icon: "recovery", summary: "Prepare portable archive packages for offline verification and restoration.", action: "Export package",
    columns: ["Package", "Contents", "Verification"],
    examples: [["linux-app-01 / offline bundle", "Manifest and disk chunks", "Verified"], ["linux-tools-01 / backup", "Manifest and disk chunks", "Pending"]],
    steps: [["Select a capture", "Choose the verified machine version you want to export."], ["Package and verify", "Bundle the manifest and required chunks, then check integrity."], ["Restore offline", "Review the target disk and reconstruct the image with the recovery tooling."]],
  },
  {
    name: "Infrastructure", path: "/infrastructure", icon: "infra", summary: "Monitor the appliance and plan destination connections and storage.", action: "Add connection",
    columns: ["Connection", "Type", "Setup stage"],
    examples: [["Primary lab target", "Proxmox VE", "Credentials required"], ["Recovery target", "Proxmox VE", "Discovery pending"]],
    steps: [["Configure destination", "Supply a Proxmox endpoint and a restricted credential."], ["Test the connection", "Check TLS and discover nodes, storage, and network bridges."], ["Review permissions", "Confirm the destination supports the planned deployment operations."]],
  },
  {
    name: "Settings", path: "/settings", icon: "settings", summary: "Manage appliance identity, users, storage, and security policies.", action: "Configure appliance",
    columns: ["Setting", "Area", "Purpose"],
    examples: [["Administrator setup", "Identity", "Create the initial appliance administrator"], ["Archive retention", "Storage", "Control how long captures are kept"], ["Audit trail", "Security", "Review operator and agent activity"]],
    steps: [["Set up administrator", "Create the initial operator identity."], ["Define access", "Assign roles and review agent enrollment policies."], ["Set storage policy", "Choose storage limits and archive retention."]],
  },
];

const icons: Record<string, string> = {
  home: "M3 11 12 3l9 8 M5 10v11h5v-6h4v6h5V10",
  search: "M20 20l-4-4 M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  bell: "M5 16h14l-2-3V9a5 5 0 0 0-10 0v4z M10 19a2 2 0 0 0 4 0",
  help: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4 M12 17h.01",
  user: "M20 21H4v-2c0-3 3-5 8-5s8 2 8 5z M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  monitor: "M3 4h18v13H3z M12 17v4 M8 21h8",
  database: "M21 6c0 2-4 4-9 4S3 8 3 6s4-4 9-4 9 2 9 4v12c0 2-4 4-9 4s-9-2-9-4V6 M3 12c0 2 4 4 9 4s9-2 9-4",
  pulse: "M2 13h5l3-9 4 16 3-7h5",
  overview: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  grid: "M3 5h7l2 2h9v13H3z",
  server: "M3 4h18v7H3z M3 13h18v7H3z M7 7.5h.01 M7 16.5h.01 M12 7.5h5 M12 16.5h5",
  capture: "M8 4H4v4 M16 4h4v4 M20 16v4h-4 M4 16v4h4 M8 12h8 M12 8v8",
  deploy: "M4 18h16v3H4z M12 15V3 M7 8l5-5 5 5",
  recovery: "M3 11a9 9 0 1 1 2 7 M3 5v6h6 M12 7v5l3 2",
  infra: "M9 3h6v6H9z M3 15h6v6H3z M15 15h6v6h-6z M12 9v3 M6 15v-3h12v3",
  settings: "M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M10 15v6",
};

export function Icon({ name }: { name: string }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name]} /></svg>;
}

export function WorkflowPreview({ workflow }: { workflow: Workflow }) {
  const [query, setQuery] = useState("");
  const rows = workflow.examples.filter((row) =>
    row.some((value) => value.toLowerCase().includes(query.trim().toLowerCase())),
  );

  return <>
    <div className="preview-notice">
      <span className="tile-icon"><Icon name={workflow.icon} /></span>
      <div><strong>Functionality being built</strong><p>Explore the planned workflow and sample records below.</p></div>
      <a className="preview-action" href="#workflow">{workflow.action} preview <span aria-hidden="true">↗</span></a>
    </div>
    <section className="surface records" aria-labelledby="records-title">
      <div className="section-head">
        <div><h2 id="records-title">{workflow.name === "Settings" ? "Planned controls" : workflow.name + " workspace"}</h2>
        <p>Illustrative examples</p></div>
        <label className="search"><span className="sr-only">Search sample records</span>
          <input type="search" placeholder="Search examples" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr>{workflow.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
          <tbody>{rows.map(([name, type, detail]) => <tr key={name}><th scope="row">{name}</th><td>{type}</td><td>{detail}</td></tr>)}
          {rows.length === 0 && <tr><td colSpan={3}>No examples match your search.</td></tr>}</tbody>
        </table>
      </div>
    </section>
    <section className="surface workflow" id="workflow" aria-labelledby="workflow-title">
      <div className="section-head"><div><h2 id="workflow-title">{workflow.action}</h2><p>Planned workflow</p></div><span className="badge">Preview</span></div>
      <ol>{workflow.steps.map(([title, description], index) => <li key={title}>
        <details open={index === 0}><summary><span>{String(index + 1).padStart(2, "0")}</span>{title}</summary><p>{description}</p></details>
      </li>)}</ol>
    </section>
  </>;
}
