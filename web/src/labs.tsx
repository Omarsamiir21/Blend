import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Icon } from "./preview";
import {
  captureUrl, draftId, labUrl, normalizeSubnet, relationships,
  type Lab, type Machine, type MachinePlan,
} from "./lab-model";

export type SaveLab = (lab: Lab) => boolean;

export function PreviewNote() {
  return <p className="lab-preview-note"><span className="badge">UI preview</span> Drafts and sample results stay in this browser. Live capture and deployment are being built.</p>;
}

export function MachineStatus({ machine }: { machine: Machine }) {
  return <span className={`lab-status${machine.sample ? " lab-status-sample" : ""}`}>
    {machine.sample?.reviewed ? "Sample reviewed" : machine.sample ? "Sample captured" : "Not captured"}
  </span>;
}

function LabStatus({ lab }: { lab: Lab }) {
  const captured = lab.machines.filter((machine) => machine.sample).length;
  const reviewed = lab.machines.filter((machine) => machine.sample?.reviewed).length;
  const total = lab.machines.length;
  const label = !total ? "Draft" : !captured ? "Not captured" : captured < total ? "Partially captured · sample" :
    reviewed < total ? "Review pending · sample" : "Review complete · sample";
  return <span className={`lab-status${captured ? " lab-status-sample" : ""}`}>{label}</span>;
}

function Dialog({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="lab-dialog" aria-labelledby="lab-dialog-title" onCancel={close}>
    <div className="lab-bar lab-dialog-header">
      <h2 id="lab-dialog-title">{title}</h2>
      <button className="lab-secondary lab-close" type="button" aria-label="Close dialog" onClick={close}>×</button>
    </div>
    {children}
  </dialog>;
}

function CreateLab({ save, close }: { save: SaveLab; close: () => void }) {
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name") ?? "").trim();
    if (!name) { setError("Enter a lab name."); return; }
    const lab = { id: draftId(), name, machines: [] };
    if (save(lab)) window.location.assign(labUrl(lab));
    else setError("This browser could not save the lab. Check that site storage is available.");
  }
  return <Dialog title="Create new lab" close={close}>
    <p>Give your lab a name, then add its machines to the whiteboard.</p>
    <form onSubmit={submit}>
      <label>Lab name<input name="name" placeholder="e.g. Commvault training lab" required maxLength={80} autoFocus /></label>
      {error && <p role="alert" className="lab-error">{error}</p>}
      <div className="lab-dialog-actions"><button type="button" className="lab-secondary" onClick={close}>Cancel</button><button>Create lab</button></div>
    </form>
  </Dialog>;
}

function MachineEditor({ machine, lab, save, close }: { machine?: Machine; lab: Lab; save: SaveLab; close: () => void }) {
  const [diskSizes, setDiskSizes] = useState(() => machine?.disks.map(String) ?? [""]);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const field = (name: string) => String(data.get(name) ?? "").trim();
    const name = field("name");
    const os = field("os");
    const subnet = field("subnet") ? normalizeSubnet(field("subnet")) : "";
    if (!name || !os) { setError("Enter a machine name and operating system version."); return; }
    if (lab.machines.some((entry) => entry.id !== machine?.id && entry.name.toLowerCase() === name.toLowerCase())) {
      setError("A machine with this name is already in the lab."); return;
    }
    if (subnet === null) { setError("Enter an IPv4 range in CIDR format, such as 192.168.50.0/24."); return; }
    const plan: MachinePlan = {
      name, os, subnet, network: field("network"), domain: field("domain"),
      cpu: Number(field("cpu")), ram: Number(field("ram")), disks: diskSizes.map(Number),
    };
    const updated = { ...machine, ...plan, id: machine?.id ?? draftId(), sample: machine?.sample && { ...machine.sample, reviewed: false } };
    const machines = machine ? lab.machines.map((entry) => entry.id === machine.id ? updated : entry) : [...lab.machines, updated];
    if (save({ ...lab, machines })) close();
    else setError("This browser could not save the machine. Check that site storage is available.");
  }

  return <Dialog title={machine ? "Edit machine" : "Add machine"} close={close}>
    <p>Enter what you expect to find on the source. You’ll compare it with the inventory later.</p>
    <form onSubmit={submit}>
      <div className="lab-fields">
        <label>Machine name<input name="name" defaultValue={machine?.name} placeholder="e.g. Commserve" required maxLength={80} autoFocus /></label>
        <label>OS and version<input name="os" defaultValue={machine?.os} placeholder="e.g. Windows Server 2022" required maxLength={100} /></label>
        <label>CPU (vCPU)<input name="cpu" type="number" min="1" max="4096" defaultValue={machine?.cpu ?? 4} required /></label>
        <label>RAM (GB)<input name="ram" type="number" min="0.25" max="65536" step="0.25" defaultValue={machine?.ram ?? 8} required /></label>
        <label>Number of disks<select value={diskSizes.length} onChange={(event) => {
          const count = Number(event.target.value);
          setDiskSizes((current) => Array.from({ length: count }, (_, index) => current[index] ?? ""));
        }}>{Array.from({ length: 32 }, (_, index) => <option key={index + 1}>{index + 1}</option>)}</select></label>
        {diskSizes.map((size, index) => <label key={index}>Disk {index + 1} (GB)<input type="number" min="0.1" max="1000000" step="0.1" placeholder="e.g. 100" value={size} required onChange={(event) => {
          const value = event.target.value;
          setDiskSizes((current) => current.map((disk, position) => position === index ? value : disk));
        }} /></label>)}
      </div>
      <fieldset>
        <legend>Network details <small>Optional</small></legend>
        <p>Matching values draw links on the whiteboard.</p>
        <div className="lab-fields">
          <label>Network name<input name="network" defaultValue={machine?.network} placeholder="e.g. Lab LAN" maxLength={80} /></label>
          <label>IP range (IPv4 CIDR)<input name="subnet" defaultValue={machine?.subnet} placeholder="e.g. 192.168.50.0/24" maxLength={18} /></label>
          <label>Domain<input name="domain" defaultValue={machine?.domain} placeholder="e.g. training.example" maxLength={100} /></label>
        </div>
      </fieldset>
      {error && <p role="alert" className="lab-error">{error}</p>}
      <div className="lab-dialog-actions"><button type="button" className="lab-secondary" onClick={close}>Cancel</button><button>{machine ? "Save changes" : "Add machine"}</button></div>
    </form>
  </Dialog>;
}

function MachineLink({ lab, machine }: { lab: Lab; machine: Machine }) {
  return <a className="lab-action lab-secondary" href={captureUrl(lab, machine)}>
    {machine.sample ? "View comparison" : "Capture machine now"} <span aria-hidden="true">↗</span>
  </a>;
}

function Whiteboard({ lab, edit }: { lab: Lab; edit: (machine?: Machine) => void }) {
  const links = relationships(lab.machines);
  return <section className="surface lab-board" aria-labelledby="whiteboard-title">
    <header className="lab-bar lab-panel-heading">
      <div><p className="kicker">Phase 01</p><h2 id="whiteboard-title">Lab whiteboard</h2><p>Add machines and see what they share.</p></div>
      {lab.machines.length > 0 && <button onClick={() => edit()}>＋ Add machine</button>}
    </header>
    <div className="lab-canvas">
      {lab.machines.length === 0 ? <div className="lab-empty">
        <span className="lab-hero-icon"><Icon name="infra" /></span>
        <h3>Your whiteboard is empty</h3><p>Add the first machine you want to capture.</p>
        <button onClick={() => edit()}>＋ Add machine</button>
      </div> : <>
        <ul className="lab-machine-grid" aria-label="Machines on the whiteboard">
          {lab.machines.map((machine) => <li className="lab-machine" key={machine.id} id={`machine-${machine.id}`}>
            <div className="lab-machine-title">
              <span className="tile-icon"><Icon name="server" /></span>
              <div><h3>{machine.name}</h3><p>{machine.os}</p></div>
              <button type="button" className="lab-quiet" aria-label={`Edit ${machine.name}`} onClick={() => edit(machine)}>Edit</button>
            </div>
            <p className="lab-resources">{machine.cpu} vCPU <span>·</span> {machine.ram} GB RAM <span>·</span> {machine.disks.length} {machine.disks.length === 1 ? "disk" : "disks"}</p>
            <p className="lab-disk-list">{machine.disks.map((size) => `${size} GB`).join(" + ")}</p>
            <div className="lab-machine-actions"><MachineStatus machine={machine} /><MachineLink lab={lab} machine={machine} /></div>
          </li>)}
        </ul>
        <div className="lab-topology">
          <div className="lab-bar"><h3><Icon name="infra" /> Shared topology</h3>{links.length > 0 && <small>{links.length} {links.length === 1 ? "group" : "groups"}</small>}</div>
          {links.length === 0 ? <p>Add the same network, IP range, or domain to two machines to draw a link.</p> : <ul className="lab-relationship-list" aria-label="Inferred relationships">
            {links.map(({ label, value, members }) => <li className="lab-relationship" key={`${label}:${value}`}>
              <span className="lab-hub"><small>{label}</small><strong>{value}</strong></span>
              <ul>{members.map((machine) => <li key={machine.id}><a href={`#machine-${machine.id}`}>{machine.name}</a></li>)}</ul>
            </li>)}
          </ul>}
        </div>
      </>}
    </div>
    {lab.machines.length > 0 && <footer className="lab-bar lab-panel-footer"><p>Links reflect shared values you entered.</p><a className="lab-action" href={labUrl(lab, "capture")}>Continue to capture <span aria-hidden="true">→</span></a></footer>}
  </section>;
}

function LabQueue({ lab, review }: { lab: Lab; review: boolean }) {
  const machines = review ? lab.machines.filter((machine) => machine.sample) : lab.machines;
  return <section className="surface lab-queue" aria-labelledby="lab-queue-title">
    <header className="lab-panel-heading"><p className="kicker">Phase {review ? "03" : "02"}</p><h2 id="lab-queue-title">{review ? "Review captures" : "Capture machines"}</h2>
      <p>{review ? "Compare each sample inventory with your whiteboard plan." : "Open a machine’s capture checklist with its planned details already filled in."}</p></header>
    {machines.length === 0 ? <div className="lab-empty">
      <span className="lab-hero-icon"><Icon name="capture" /></span><h3>{review ? "No results to review yet" : "No machines to capture yet"}</h3>
      <a className="lab-action" href={labUrl(lab, review ? "capture" : undefined)}>{review ? "Go to capture phase" : "Open whiteboard"}</a>
    </div> : <ul className="lab-list">{machines.map((machine) => <li key={machine.id} className="lab-bar">
      <div className="lab-list-name"><span className="tile-icon"><Icon name="server" /></span><div><strong>{machine.name}</strong><p>{machine.os}</p></div></div>
      <div className="lab-inline"><MachineStatus machine={machine} /><MachineLink lab={lab} machine={machine} /></div>
    </li>)}</ul>}
  </section>;
}

export function LabsWorkspace({ labs, save, query }: { labs: Lab[]; save: SaveLab; query: URLSearchParams }) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Machine | "new" | null>(null);
  const lab = labs.find((entry) => entry.id === query.get("lab"));
  const phase = query.get("phase");
  const active = phase === "capture" || phase === "review" ? phase : "design";
  const captured = lab?.machines.filter((machine) => machine.sample).length ?? 0;
  const reviewed = lab?.machines.filter((machine) => machine.sample?.reviewed).length ?? 0;

  if (!lab) return <>
    <header className="lab-page-header"><div><p className="kicker">Migration workspace</p><h1>Labs</h1><p className="description">Design a lab, capture its machines, and review what came across.</p></div>
      <button onClick={() => setCreating(true)}>＋ Create new lab</button></header>
    <PreviewNote />
    {query.has("lab") && <p className="lab-error" role="status">This draft isn’t available in this browser.</p>}
    <section className="surface lab-queue" aria-labelledby="lab-drafts-title">
      <header className="lab-panel-heading"><h2 id="lab-drafts-title">Your labs</h2><p>{labs.length} {labs.length === 1 ? "draft" : "drafts"} saved here</p></header>
      {labs.length === 0 ? <div className="lab-empty"><span className="lab-hero-icon"><Icon name="grid" /></span><h3>Start with a lab plan</h3><p>Sketch the machines and their connections before you capture anything.</p></div> :
        <ul className="lab-list">{labs.map((entry) => <li key={entry.id} className="lab-bar">
          <div className="lab-list-name"><span className="tile-icon"><Icon name="grid" /></span><div><strong>{entry.name}</strong><p>{entry.machines.length} {entry.machines.length === 1 ? "machine" : "machines"}</p></div></div>
          <div className="lab-inline"><LabStatus lab={entry} /><a className="lab-action lab-secondary" href={labUrl(entry)}>Open lab <span aria-hidden="true">→</span></a></div>
        </li>)}</ul>}
    </section>
    {creating && <CreateLab save={save} close={() => setCreating(false)} />}
  </>;

  return <>
    <a className="lab-back" href="/labs">← All labs</a>
    <header className="lab-page-header"><div><p className="kicker">Lab workspace</p><h1>{lab.name}</h1><p className="description">Plan, capture, and review this lab.</p></div><LabStatus lab={lab} /></header>
    <PreviewNote />
    <nav className="lab-phases" aria-label="Lab migration phases">
      <a href={labUrl(lab)} aria-current={active === "design" ? "step" : undefined}><span className="lab-phase-number">01</span><span><strong>Design lab</strong><small>{lab.machines.length} {lab.machines.length === 1 ? "machine" : "machines"} planned</small></span></a>
      <a href={labUrl(lab, "capture")} aria-current={active === "capture" ? "step" : undefined}><span className="lab-phase-number">02</span><span><strong>Capture machines</strong><small>{captured} of {lab.machines.length} sample captures</small></span></a>
      <a href={labUrl(lab, "review")} aria-current={active === "review" ? "step" : undefined}><span className="lab-phase-number">03</span><span><strong>Review results</strong><small>{reviewed} of {captured} reviewed</small></span></a>
      <button disabled><span className="lab-phase-number">04</span><span><strong>Deploy lab</strong><small>Coming later</small></span></button>
    </nav>
    {active === "design" ? <Whiteboard lab={lab} edit={(machine) => setEditing(machine ?? "new")} /> : <LabQueue lab={lab} review={active === "review"} />}
    {editing && <MachineEditor lab={lab} machine={editing === "new" ? undefined : editing} save={save} close={() => setEditing(null)} />}
  </>;
}
