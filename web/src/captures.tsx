import { useState } from "react";
import { captureUrl, compareInventory, inventoryRows, labUrl, type CapturePreview, type Lab, type Machine } from "./lab-model";
import { MachineStatus, PreviewNote, type SaveLab } from "./labs";
import { Icon } from "./preview";

function CapturePlan({ machine, sample }: { machine: Machine; sample: () => void }) {
  return <div className="lab-capture-grid">
    <section className="surface lab-queue" aria-labelledby="capture-steps">
      <header className="lab-panel-heading"><p className="kicker">Phase 02</p><h2 id="capture-steps">Capture checklist</h2><p>Follow the sequence when live capture is available.</p></header>
      <ol className="lab-checklist">
        <li><div><strong>Connect the source machine</strong><p>Enroll the Blend agent from inside the authorized source guest. The agent will check in and report its inventory.</p></div></li>
        <li><div><strong>Confirm disks and run preflight</strong><p>Compare the discovered disks with this plan. Check the supported capture mode and available appliance storage before continuing.</p></div></li>
        <li><div><strong>Start capture and verify the archive</strong><p>The agent will transfer the selected disks. Blend will check the archive and open a comparison once it’s verified.</p></div></li>
      </ol>
      <footer className="lab-panel-footer"><button onClick={sample}>Load sample capture result</button><p>Try the review screen using synthetic inventory. No capture will start.</p></footer>
    </section>
    <section className="surface lab-queue" aria-labelledby="capture-plan">
      <header className="lab-panel-heading"><p className="kicker">From the whiteboard</p><h2 id="capture-plan">Prefilled machine plan</h2><p>These are the values you entered in Labs.</p></header>
      <dl className="lab-inventory">{inventoryRows(machine).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl>
    </section>
  </div>;
}

function CaptureReview({ lab, machine, result, review }: { lab: Lab; machine: Machine; result: CapturePreview; review: () => void }) {
  const rows = compareInventory(machine, result.inventory);
  const differences = rows.filter((row) => row.result === "Different" || row.result === "Missing" || row.result === "Extra").length;
  const matches = rows.filter((row) => row.result === "Match").length;
  return <section className="surface lab-queue" aria-labelledby="comparison-title">
    <header className="lab-panel-heading lab-bar"><div><p className="kicker">Phase 03</p><h2 id="comparison-title">Compare plan with captured inventory</h2><p>{matches} {matches === 1 ? "match" : "matches"} · {differences} {differences === 1 ? "difference" : "differences"}. Blank values are marked unspecified.</p></div><span className="lab-status lab-status-sample">Sample result</span></header>
    <div className="table-scroll"><table className="lab-compare">
      <thead><tr><th scope="col">Detail</th><th scope="col">Planned</th><th scope="col">Captured (sample)</th><th scope="col">Result</th></tr></thead>
      <tbody>{rows.map(({ field, expected, actual, result }) => <tr key={field} className={result === "Different" || result === "Missing" || result === "Extra" ? "lab-difference" : undefined}>
        <th scope="row">{field}</th><td>{expected}</td><td>{actual}</td><td><span className={`lab-result lab-result-${result.toLowerCase()}`}>{result}</span></td>
      </tr>)}</tbody>
    </table></div>
    <div className="lab-review-next lab-bar">
      <div><h3>What’s next?</h3><p>{differences ? "Check each difference against the source. If the plan was wrong, edit the machine on the whiteboard. If the capture missed a disk, review disk selection before capturing again." : "Review the inventory and confirm it reflects the source you intended to capture."} Deployment planning will follow in a later phase.</p></div>
      {result.reviewed ? <a className="lab-action" href={labUrl(lab, "review")}>Back to lab review →</a> : <button onClick={review}>Mark sample reviewed</button>}
    </div>
  </section>;
}

export function CapturesWorkspace({ labs, save, query }: { labs: Lab[]; save: SaveLab; query: URLSearchParams }) {
  const [error, setError] = useState(false);
  const lab = labs.find((entry) => entry.id === query.get("lab"));
  const machine = lab?.machines.find((entry) => entry.id === query.get("machine"));

  if (!lab || !machine) {
    const targets = labs.flatMap((entry) => entry.machines.map((target) => ({ lab: entry, machine: target })));
    return <>
      <header className="lab-page-header"><div><p className="kicker">Migration workspace</p><h1>Captures</h1><p className="description">Open a planned machine to prepare its capture or review a sample result.</p></div><a className="lab-action lab-secondary" href="/labs">Open Labs →</a></header>
      <PreviewNote />
      {query.has("machine") && <p className="lab-error" role="status">This machine isn’t available in this browser.</p>}
      <section className="surface lab-queue" aria-labelledby="capture-targets">
        <header className="lab-panel-heading"><h2 id="capture-targets">Machines from your labs</h2><p>{targets.length} {targets.length === 1 ? "machine" : "machines"} available</p></header>
        {targets.length === 0 ? <div className="lab-empty"><span className="lab-hero-icon"><Icon name="capture" /></span><h3>No machines to capture yet</h3><p>Add a machine to a lab whiteboard to get started.</p></div> :
          <ul className="lab-list">{targets.map(({ lab: entry, machine: target }) => <li key={target.id} className="lab-bar">
            <div className="lab-list-name"><span className="tile-icon"><Icon name="server" /></span><div><strong>{target.name}</strong><p>{entry.name}</p></div></div>
            <div className="lab-inline"><MachineStatus machine={target} /><a className="lab-action lab-secondary" href={captureUrl(entry, target)}>{target.sample ? "View comparison" : "Capture machine now"} ↗</a></div>
          </li>)}</ul>}
      </section>
    </>;
  }

  function saveResult(result: CapturePreview) {
    if (!lab || !machine) return;
    setError(!save({ ...lab, machines: lab.machines.map((entry) => entry.id === machine.id ? { ...entry, sample: result } : entry) }));
  }

  return <>
    <a className="lab-back" href={labUrl(lab, machine.sample ? "review" : "capture")}>← {lab.name}</a>
    <header className="lab-page-header"><div><p className="kicker">{machine.sample ? "Capture review" : "Capture setup"}</p><h1>{machine.name}</h1><p className="description">{machine.sample ? "Review what came across against your original plan." : "Start with the machine details you entered in the lab."}</p></div><MachineStatus machine={machine} /></header>
    <PreviewNote />
    {error && <p className="lab-error" role="alert">This browser could not save the sample result. Check that site storage is available.</p>}
    {machine.sample ? <CaptureReview lab={lab} machine={machine} result={machine.sample} review={() => {
      if (machine.sample) saveResult({ ...machine.sample, reviewed: true });
    }} /> : <CapturePlan machine={machine} sample={() => {
      const { name, os, cpu, ram, disks, network, subnet, domain } = machine;
      saveResult({ inventory: { name, os, cpu, ram: ram + 2, disks: [...disks], network, subnet, domain }, reviewed: false });
    }} />}
  </>;
}
