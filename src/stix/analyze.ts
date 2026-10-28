import { TACTICS, TECHNIQUE_BY_ID, type TacticId } from "./attack.ts";
import { isIndicator, isRelationship, isReport, type AttackPattern, type Bundle, type Indicator, type Relationship, type StixId, type StixObject } from "./types.ts";

export interface TypeCount {
  type: string;
  count: number;
}

export type ProblemKind = "dangling" | "duplicate" | "expired";

export interface Problem {
  kind: ProblemKind;
  /** The object the problem is on. */
  objectId: StixId;
  /** The id that is missing, duplicated or expired, depending on kind. */
  subject: string;
  message: string;
}

export interface TechniqueCell {
  techniqueId: string;
  name: string;
  objectId: StixId;
}

export interface Coverage {
  intrusionSetId: StixId;
  name: string;
  /** Techniques per tactic column, in matrix order. */
  byTactic: Map<TacticId, TechniqueCell[]>;
  total: number;
}

export interface Analysis {
  bundle: Bundle;
  byId: Map<StixId, StixObject>;
  typeCounts: TypeCount[];
  objects: StixObject[];
  relationships: Relationship[];
  outbound: Map<StixId, Relationship[]>;
  inbound: Map<StixId, Relationship[]>;
  /** Reports that list an object in object_refs. */
  reportedIn: Map<StixId, StixId[]>;
  problems: Problem[];
  coverage: Coverage[];
  techniqueTotal: number;
  finding: string;
}

export function attackId(o: StixObject): string | undefined {
  return o.external_references?.find((r) => r.source_name === "mitre-attack")?.external_id;
}

export function analyze(bundle: Bundle, now: Date = new Date()): Analysis {
  const byId = new Map<StixId, StixObject>();
  for (const o of bundle.objects) byId.set(o.id, o);

  const objects = bundle.objects.filter((o) => !isRelationship(o));
  const relationships = bundle.objects.filter(isRelationship);

  const counts = new Map<string, number>();
  for (const o of bundle.objects) counts.set(o.type, (counts.get(o.type) ?? 0) + 1);
  const typeCounts = [...counts.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));

  const outbound = new Map<StixId, Relationship[]>();
  const inbound = new Map<StixId, Relationship[]>();
  const push = (m: Map<StixId, Relationship[]>, k: StixId, r: Relationship) => m.set(k, [...(m.get(k) ?? []), r]);
  for (const r of relationships) {
    push(outbound, r.source_ref, r);
    push(inbound, r.target_ref, r);
  }

  const reportedIn = new Map<StixId, StixId[]>();
  for (const o of bundle.objects) {
    if (!isReport(o)) continue;
    for (const ref of o.object_refs) reportedIn.set(ref, [...(reportedIn.get(ref) ?? []), o.id]);
  }

  const problems: Problem[] = [];
  for (const r of relationships) {
    for (const [field, ref] of [["source_ref", r.source_ref], ["target_ref", r.target_ref]] as const) {
      if (!byId.has(ref)) {
        problems.push({ kind: "dangling", objectId: r.id, subject: ref, message: `${field} points at ${article(ref.split("--")[0] ?? "object")} not in the bundle` });
      }
    }
  }
  for (const o of bundle.objects) {
    if (isReport(o)) {
      for (const ref of o.object_refs) {
        if (!byId.has(ref)) problems.push({ kind: "dangling", objectId: o.id, subject: ref, message: `object_refs lists ${article(ref.split("--")[0] ?? "object")} not in the bundle` });
      }
    }
    if (o.created_by_ref && !byId.has(o.created_by_ref)) {
      problems.push({ kind: "dangling", objectId: o.id, subject: o.created_by_ref, message: `created_by_ref points at an identity not in the bundle` });
    }
  }
  const seenPattern = new Map<string, Indicator>();
  for (const o of bundle.objects) {
    if (!isIndicator(o)) continue;
    const first = seenPattern.get(o.pattern);
    if (first) {
      problems.push({ kind: "duplicate", objectId: o.id, subject: first.id, message: `same pattern as ${first.name ?? first.id}` });
    } else {
      seenPattern.set(o.pattern, o);
    }
    if (o.valid_until && new Date(o.valid_until) < now) {
      problems.push({ kind: "expired", objectId: o.id, subject: o.valid_until, message: `valid_until ${o.valid_until.slice(0, 10)} has passed` });
    }
  }

  const coverage = buildCoverage(bundle, byId, outbound);
  const techniqueTotal = bundle.objects.filter((o) => o.type === "attack-pattern").length;

  return { bundle, byId, typeCounts, objects, relationships, outbound, inbound, reportedIn, problems, coverage, techniqueTotal, finding: findingFor(problems, relationships.length) };
}

function buildCoverage(bundle: Bundle, byId: Map<StixId, StixObject>, outbound: Map<StixId, Relationship[]>): Coverage[] {
  const sets = bundle.objects.filter((o) => o.type === "intrusion-set");
  return sets
    .map((set) => {
      const techniques = new Map<StixId, AttackPattern>();
      const visit = (from: StixId, depth: number) => {
        for (const r of outbound.get(from) ?? []) {
          if (r.relationship_type !== "uses") continue;
          const target = byId.get(r.target_ref);
          if (!target) continue;
          if (target.type === "attack-pattern") techniques.set(target.id, target as AttackPattern);
          else if ((target.type === "malware" || target.type === "tool") && depth < 1) visit(target.id, depth + 1);
        }
      };
      visit(set.id, 0);
      const byTactic = new Map<TacticId, TechniqueCell[]>();
      for (const t of TACTICS) byTactic.set(t.id, []);
      for (const ap of techniques.values()) {
        const tid = attackId(ap);
        const known = tid ? TECHNIQUE_BY_ID.get(tid) : undefined;
        const phases = ap.kill_chain_phases?.filter((p) => p.kill_chain_name === "mitre-attack").map((p) => p.phase_name as TacticId) ?? known?.tactics ?? [];
        for (const phase of phases) {
          byTactic.get(phase)?.push({ techniqueId: tid ?? "?", name: ap.name, objectId: ap.id });
        }
      }
      for (const cells of byTactic.values()) cells.sort((a, b) => a.techniqueId.localeCompare(b.techniqueId));
      return { intrusionSetId: set.id, name: set.name ?? set.id, byTactic, total: techniques.size };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

function findingFor(problems: Problem[], relationshipCount: number): string {
  const dangling = problems.filter((p) => p.kind === "dangling").length;
  const duplicates = problems.filter((p) => p.kind === "duplicate").length;
  const expired = problems.filter((p) => p.kind === "expired").length;
  if (problems.length === 0) return "Every reference resolves, no duplicate or expired indicators: safe to import as is.";
  const parts: string[] = [];
  if (dangling) parts.push(`${dangling} of ${relationshipCount} relationships or report references point at objects not in the bundle`);
  if (duplicates) parts.push(`${duplicates} indicator${duplicates === 1 ? "" : "s"} duplicate${duplicates === 1 ? "s" : ""} an existing pattern`);
  if (expired) parts.push(`${expired} indicator${expired === 1 ? " has" : "s have"} expired`);
  return parts.join("; ") + ". Review before importing.";
}

function article(type: string): string {
  return `${/^[aeiou]/i.test(type) ? "an" : "a"} ${type}`;
}

export function parseBundle(text: string): Bundle {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("The file is not valid JSON.");
  }
  if (!json || typeof json !== "object") throw new Error("The file does not contain a JSON object.");
  const b = json as Partial<Bundle>;
  if (b.type !== "bundle") throw new Error(`Expected "type": "bundle", found ${JSON.stringify(b.type)}.`);
  if (!Array.isArray(b.objects)) throw new Error('The bundle has no "objects" array.');
  for (const [i, o] of b.objects.entries()) {
    if (!o || typeof o !== "object" || typeof (o as StixObject).type !== "string" || typeof (o as StixObject).id !== "string") {
      throw new Error(`Object ${i} has no type or id.`);
    }
  }
  return { type: "bundle", id: (b.id as StixId) ?? "bundle--unknown", objects: b.objects as StixObject[] };
}

export function displayName(o: StixObject, byId?: Map<StixId, StixObject>): string {
  if (o.name) return o.name;
  if (isIndicator(o)) return o.pattern;
  if (isRelationship(o)) {
    const end = (ref: StixId) => {
      const t = byId?.get(ref);
      return t ? displayName(t, byId) : `${ref.split("--")[0]} (missing)`;
    };
    return `${end(o.source_ref)} ${o.relationship_type} ${end(o.target_ref)}`;
  }
  return o.id;
}
