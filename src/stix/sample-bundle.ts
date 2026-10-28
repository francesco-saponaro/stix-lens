/**
 * A realistic STIX 2.1 bundle, built deterministically so the numbers on screen are stable.
 * It is shaped like a weekly feed export: four intrusion sets, their malware and tooling,
 * ATT&CK techniques, indicators, reports, and the usual defects such a feed carries
 * (references to objects that were not exported, duplicate indicators, expired indicators).
 */
import { TECHNIQUES } from "./attack.ts";
import type { Bundle, Indicator, Relationship, StixId, StixObject } from "./types.ts";

// Small seeded generator so ids and hashes are the same on every build.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildSampleBundle(): Bundle {
  const rand = mulberry32(20261028);
  const hex = (n: number) => Array.from({ length: n }, () => Math.floor(rand() * 16).toString(16)).join("");
  const uuid = () => `${hex(8)}-${hex(4)}-4${hex(3)}-${(8 + Math.floor(rand() * 4)).toString(16)}${hex(3)}-${hex(12)}`;
  const id = (type: string): StixId => `${type}--${uuid()}`;
  const day = (offset: number, hour = 9, minute = 0) => {
    const d = new Date(Date.UTC(2026, 9, 1, hour, minute, 0));
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().replace(".000Z", "Z");
  };

  const objects: StixObject[] = [];
  const author = id("identity");
  objects.push({
    type: "identity",
    id: author,
    spec_version: "2.1",
    created: day(-120),
    modified: day(-120),
    name: "Harbourline Threat Research",
    identity_class: "organization",
    sectors: ["technology"],
  });

  const base = (type: string, offset: number, extra: Record<string, unknown>) => {
    const o: StixObject = {
      type,
      id: id(type),
      spec_version: "2.1",
      created: day(offset, 8 + Math.floor(rand() * 9), Math.floor(rand() * 60)),
      modified: day(offset + Math.floor(rand() * 6), 8 + Math.floor(rand() * 9), Math.floor(rand() * 60)),
      created_by_ref: author,
      ...extra,
    };
    objects.push(o);
    return o.id;
  };

  const rel = (type: string, source: StixId, target: StixId, offset: number) =>
    base("relationship", offset, { relationship_type: type, source_ref: source, target_ref: target });

  // Targets
  const sectors = {
    logistics: base("identity", -40, { name: "Logistics and freight operators", identity_class: "class", sectors: ["transportation"] }),
    banks: base("identity", -40, { name: "Retail banks in the EU", identity_class: "class", sectors: ["financial-services"] }),
    energy: base("identity", -40, { name: "Energy utilities", identity_class: "class", sectors: ["energy"] }),
    defence: base("identity", -40, { name: "Defence contractors", identity_class: "class", sectors: ["defense"] }),
  };

  // Techniques
  const technique: Record<string, StixId> = {};
  for (const t of TECHNIQUES) {
    technique[t.id] = base("attack-pattern", -90 + Math.floor(rand() * 20), {
      name: t.name,
      external_references: [{ source_name: "mitre-attack", external_id: t.id, url: `https://attack.mitre.org/techniques/${t.id.replace(".", "/")}/` }],
      kill_chain_phases: t.tactics.map((phase) => ({ kill_chain_name: "mitre-attack", phase_name: phase })),
    });
  }

  // Intrusion sets
  const apt28 = base("intrusion-set", -60, { name: "APT28", aliases: ["Fancy Bear", "Sofacy", "Sednit", "STRONTIUM"], first_seen: "2007-01-01T00:00:00Z", last_seen: day(-3) });
  const lazarus = base("intrusion-set", -58, { name: "Lazarus Group", aliases: ["HIDDEN COBRA", "Labyrinth Chollima"], first_seen: "2009-01-01T00:00:00Z", last_seen: day(-5) });
  const fin7 = base("intrusion-set", -55, { name: "FIN7", aliases: ["Carbon Spider", "ELBRUS"], first_seen: "2013-01-01T00:00:00Z", last_seen: day(-9) });
  const muddy = base("intrusion-set", -52, { name: "MuddyWater", aliases: ["Seedworm", "TEMP.Zagros", "Static Kitten"], first_seen: "2017-01-01T00:00:00Z", last_seen: day(-1) });

  // Malware and tools
  const zebrocy = base("malware", -50, { name: "Zebrocy", is_family: true, malware_types: ["backdoor", "downloader"] });
  const dtrack = base("malware", -48, { name: "Dtrack", is_family: true, malware_types: ["backdoor", "spyware"] });
  const carbanak = base("malware", -46, { name: "Carbanak", is_family: true, malware_types: ["backdoor"] });
  const powgoop = base("malware", -44, { name: "PowGoop", is_family: true, malware_types: ["downloader"] });
  const emotet = base("malware", -42, { name: "Emotet", is_family: true, malware_types: ["trojan", "downloader"] });
  const trickbot = base("malware", -41, { name: "TrickBot", is_family: true, malware_types: ["trojan", "bot"] });
  const cobalt = base("tool", -40, { name: "Cobalt Strike" });
  const mimikatz = base("tool", -40, { name: "Mimikatz" });

  // Who uses what
  const uses: Record<string, string[]> = {
    [apt28]: ["T1598", "T1566.002", "T1078", "T1059.001", "T1547.001", "T1003.001", "T1110.003", "T1114.002", "T1071.001", "T1573.002"],
    [lazarus]: ["T1583", "T1566.001", "T1204.002", "T1059.003", "T1053.005", "T1055", "T1027", "T1036.005", "T1082", "T1105", "T1567.002"],
    [fin7]: ["T1566.001", "T1204.002", "T1047", "T1053.005", "T1070.004", "T1083", "T1021.001", "T1560.001", "T1071.001"],
    [muddy]: ["T1595", "T1588.002", "T1190", "T1059.001", "T1562.001", "T1087.002", "T1018", "T1090.003"],
  };
  let offset = -30;
  for (const [set, ids] of Object.entries(uses)) {
    for (const tid of ids) rel("uses", set as StixId, technique[tid]!, offset++);
  }
  rel("uses", apt28, zebrocy, -29);
  rel("uses", lazarus, dtrack, -28);
  rel("uses", lazarus, cobalt, -28);
  rel("uses", fin7, carbanak, -27);
  rel("uses", fin7, cobalt, -27);
  rel("uses", muddy, powgoop, -26);
  rel("downloads", emotet, trickbot, -25);
  rel("uses", trickbot, mimikatz, -24);
  rel("uses", trickbot, technique["T1021.002"]!, -24);
  rel("uses", trickbot, technique["T1003.001"]!, -24);
  rel("uses", emotet, technique["T1566.001"]!, -24);
  rel("uses", carbanak, technique["T1056.001"]!, -23);
  rel("uses", dtrack, technique["T1005"]!, -23);
  rel("targets", apt28, sectors.defence, -22);
  rel("targets", apt28, sectors.energy, -22);
  rel("targets", lazarus, sectors.banks, -21);
  rel("targets", fin7, sectors.banks, -21);
  rel("targets", fin7, sectors.logistics, -20);
  rel("targets", muddy, sectors.energy, -20);

  // Indicators
  const ipv4 = () => `203.0.113.${10 + Math.floor(rand() * 240)}`;
  const ipv4b = () => `198.51.100.${10 + Math.floor(rand() * 240)}`;
  const words = ["update", "cdn", "metrics", "sync", "cloud", "secure", "mail", "docs", "portal", "status", "api", "static", "edge", "login", "assets", "telemetry"];
  const tlds = ["net", "com", "org", "info", "io"];
  const domain = () => `${words[Math.floor(rand() * words.length)]}-${words[Math.floor(rand() * words.length)]}${Math.floor(rand() * 90) + 10}.${tlds[Math.floor(rand() * tlds.length)]}`;
  const owners: Array<[StixId, string]> = [
    [zebrocy, "Zebrocy"], [dtrack, "Dtrack"], [carbanak, "Carbanak"], [powgoop, "PowGoop"], [emotet, "Emotet"], [trickbot, "TrickBot"], [apt28, "APT28"], [muddy, "MuddyWater"],
  ];
  const indicators: StixId[] = [];
  const indicator = (pattern: string, label: string, offset: number, validUntilOffset?: number) => {
    const extra: Partial<Indicator> = {
      name: label,
      pattern,
      pattern_type: "stix",
      valid_from: day(offset),
      indicator_types: ["malicious-activity"],
    };
    if (validUntilOffset !== undefined) extra.valid_until = day(validUntilOffset);
    const iid = base("indicator", offset, extra);
    indicators.push(iid);
    return iid;
  };
  for (let i = 0; i < 30; i++) {
    const [owner, ownerName] = owners[i % owners.length]!;
    const kind = i % 4;
    const off = -28 + i;
    let pattern: string;
    let label: string;
    if (kind === 0) {
      const ip = i % 8 < 4 ? ipv4() : ipv4b();
      pattern = `[ipv4-addr:value = '${ip}']`;
      label = `${ownerName} C2 ${ip}`;
    } else if (kind === 1) {
      const d = domain();
      pattern = `[domain-name:value = '${d}']`;
      label = `${ownerName} staging domain ${d}`;
    } else if (kind === 2) {
      const h = hex(64);
      pattern = `[file:hashes.'SHA-256' = '${h}']`;
      label = `${ownerName} dropper ${h.slice(0, 12)}`;
    } else {
      const d = domain();
      pattern = `[url:value = 'https://${d}/${words[Math.floor(rand() * words.length)]}/${hex(6)}']`;
      label = `${ownerName} payload URL on ${d}`;
    }
    // Five indicators from early in the window have already expired.
    const expired = i < 5 ? -2 - i : undefined;
    const iid = indicator(pattern, label, off, expired);
    rel("indicates", iid, owner, off);
  }
  // Two indicators were exported twice under new ids: same pattern, different id.
  const dupSource1 = objects.find((o) => o.id === indicators[6]) as Indicator;
  const dupSource2 = objects.find((o) => o.id === indicators[13]) as Indicator;
  const dup1 = indicator(dupSource1.pattern, dupSource1.name!, -3);
  const dup2 = indicator(dupSource2.pattern, dupSource2.name!, -2);
  rel("indicates", dup1, emotet, -3);
  rel("indicates", dup2, trickbot, -2);

  // Relationships to objects that were not included in this export.
  const missingTechniques = ["T1497", "T1569.002", "T1218.011", "T1134", "T1074.001"];
  for (const [i, tid] of missingTechniques.entries()) {
    const ghost = id("attack-pattern");
    rel("uses", [apt28, lazarus, fin7, muddy, lazarus][i]!, ghost, -15 + i);
    void tid;
  }
  rel("indicates", indicators[2]!, id("malware"), -12);
  rel("indicates", indicators[9]!, id("malware"), -11);
  rel("indicates", indicators[17]!, id("malware"), -10);
  rel("attributed-to", muddy, id("identity"), -9);

  // Reports
  const report = (name: string, offset: number, refs: StixId[], types: string[]) =>
    base("report", offset, { name, published: day(offset), report_types: types, object_refs: refs });
  const techniqueIds = (set: StixId) => uses[set]!.map((t) => technique[t]!);
  report("APT28 credential phishing against defence suppliers", -18, [apt28, zebrocy, sectors.defence, ...techniqueIds(apt28).slice(0, 5), indicators[6]!, indicators[14]!], ["threat-report"]);
  report("Lazarus Group: Dtrack returns with cloud exfiltration", -16, [lazarus, dtrack, cobalt, sectors.banks, ...techniqueIds(lazarus).slice(0, 6), indicators[1]!, indicators[9]!], ["threat-report"]);
  report("FIN7 spearphishing wave against logistics firms", -14, [fin7, carbanak, sectors.logistics, ...techniqueIds(fin7).slice(0, 4), indicators[2]!, indicators[10]!, indicators[18]!], ["campaign"]);
  report("MuddyWater scanning and exploitation of exposed VPN appliances", -12, [muddy, powgoop, sectors.energy, ...techniqueIds(muddy).slice(0, 4), indicators[3]!, indicators[7]!], ["threat-report"]);
  report("Emotet and TrickBot delivery infrastructure, October", -9, [emotet, trickbot, mimikatz, technique["T1566.001"]!, indicators[4]!, indicators[5]!, indicators[12]!, indicators[20]!], ["malware"]);
  report("Weekly indicator digest, week 41", -7, indicators.slice(0, 14), ["indicator"]);
  report("Weekly indicator digest, week 42", -1, [...indicators.slice(14, 30), id("indicator")], ["indicator"]);
  report("Tooling notes: Cobalt Strike team servers seen this month", -4, [cobalt, lazarus, fin7, indicators[8]!, indicators[16]!, indicators[24]!], ["tool"]);

  return { type: "bundle", id: id("bundle"), objects };
}

export const SAMPLE_BUNDLE = buildSampleBundle();
export const SAMPLE_BUNDLE_NAME = "harbourline-feed-2026-w43.json";

export type { Relationship };
