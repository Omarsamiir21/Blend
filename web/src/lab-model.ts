export type MachinePlan = {
  name: string;
  os: string;
  cpu: number;
  ram: number;
  disks: number[];
  network: string;
  subnet: string;
  domain: string;
};

export type CapturePreview = { inventory: MachinePlan; reviewed: boolean };
export type Machine = MachinePlan & { id: string; sample?: CapturePreview };
export type Lab = { id: string; name: string; machines: Machine[] };

const storageKey = "blend.lab-drafts.v1";

export function readLabs(): Lab[] {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function saveLabs(labs: Lab[]) {
  localStorage.setItem(storageKey, JSON.stringify(labs));
}

export function draftId() {
  // The VM preview is served over HTTP, where crypto.randomUUID may be unavailable.
  return Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) => value.toString(16).padStart(8, "0")).join("");
}

export function labUrl(lab: Lab, phase?: "capture" | "review") {
  return `/labs?${new URLSearchParams({ lab: lab.id, ...(phase && { phase }) })}`;
}

export function captureUrl(lab: Lab, machine: Machine) {
  return `/captures?${new URLSearchParams({ lab: lab.id, machine: machine.id })}`;
}

export function normalizeSubnet(value: string) {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec(value);
  if (!match) return null;
  const octets = match.slice(1, 5).map(Number);
  const prefix = Number(match[5]);
  if (prefix > 32 || octets.some((octet) => octet > 255)) return null;
  const ip = octets.reduce((address, octet) => (address << 8) | octet, 0);
  const mask = prefix === 0 ? 0 : -1 << (32 - prefix);
  const network = ip & mask;
  return `${[24, 16, 8, 0].map((offset) => (network >>> offset) & 255).join(".")}/${prefix}`;
}

export function relationships(machines: Machine[]) {
  const kinds = [["network", "Network"], ["subnet", "IP range"], ["domain", "Domain"]] as const;
  return kinds.flatMap(([field, label]) => {
    const groups = new Map<string, { value: string; members: Machine[] }>();
    for (const machine of machines) {
      const value = machine[field];
      if (!value) continue;
      const key = value.toLowerCase().replace(/\.$/, "");
      const group = groups.get(key) ?? { value, members: [] };
      group.members.push(machine);
      groups.set(key, group);
    }
    return Array.from(groups.values()).filter((group) => group.members.length > 1).map((group) => ({ ...group, label }));
  });
}

export function inventoryRows(plan: MachinePlan) {
  return [
    ["Machine name", plan.name], ["Operating system", plan.os],
    ["CPU", `${plan.cpu} vCPU`], ["Memory", `${plan.ram} GB`],
    ["Disk count", `${plan.disks.length}`],
    ...plan.disks.map((size, index) => [`Disk ${index + 1}`, `${size} GB`]),
    ["Network", plan.network], ["IP range", plan.subnet], ["Domain", plan.domain],
  ] as [string, string][];
}

export function compareInventory(plan: MachinePlan, observed: MachinePlan) {
  const planned = new Map(inventoryRows(plan));
  const captured = new Map(inventoryRows(observed));
  return [...new Set([...planned.keys(), ...captured.keys()])].map((field) => {
    const expected = planned.get(field);
    const actual = captured.get(field);
    const result = expected === undefined ? "Extra" : actual === undefined ? "Missing" :
      !expected || !actual ? "Unspecified" : expected.toLowerCase() === actual.toLowerCase() ? "Match" : "Different";
    return { field, expected: expected || "—", actual: actual || "—", result };
  });
}
