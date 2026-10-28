const nf = new Intl.NumberFormat("en-GB");

export function n(value: number): string {
  return nf.format(value);
}

export function shortDate(iso: string | undefined): string {
  if (!iso) return "–";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toISOString().slice(0, 10);
}

export function shortId(id: string): string {
  const [type, uuid] = id.split("--");
  return uuid ? `${type}--${uuid.slice(0, 8)}` : id;
}

export const TYPE_LABEL: Record<string, string> = {
  "attack-pattern": "Attack pattern",
  "intrusion-set": "Intrusion set",
  malware: "Malware",
  tool: "Tool",
  indicator: "Indicator",
  identity: "Identity",
  report: "Report",
  relationship: "Relationship",
  campaign: "Campaign",
  "threat-actor": "Threat actor",
  vulnerability: "Vulnerability",
  "course-of-action": "Course of action",
  infrastructure: "Infrastructure",
  location: "Location",
  note: "Note",
  opinion: "Opinion",
  grouping: "Grouping",
  "observed-data": "Observed data",
  "marking-definition": "Marking definition",
  sighting: "Sighting",
};

export function typeLabel(type: string): string {
  return TYPE_LABEL[type] ?? type;
}
