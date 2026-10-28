import { describe, expect, it } from "vitest";
import { analyze, attackId, displayName, parseBundle } from "./analyze.ts";
import { TACTICS } from "./attack.ts";
import { buildSampleBundle, SAMPLE_BUNDLE } from "./sample-bundle.ts";
import type { Bundle, StixId } from "./types.ts";

const NOW = new Date("2026-10-28T12:00:00Z");

describe("the sample bundle", () => {
  it("is deterministic", () => {
    expect(buildSampleBundle()).toEqual(buildSampleBundle());
  });

  it("has unique ids and a source for every relationship", () => {
    const ids = SAMPLE_BUNDLE.objects.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    const a = analyze(SAMPLE_BUNDLE, NOW);
    for (const r of a.relationships) expect(a.byId.has(r.source_ref)).toBe(true);
  });
});

describe("analyze", () => {
  const a = analyze(SAMPLE_BUNDLE, NOW);

  it("counts reconcile: objects plus relationships is the bundle", () => {
    expect(a.objects.length + a.relationships.length).toBe(SAMPLE_BUNDLE.objects.length);
    const fromTypes = a.typeCounts.reduce((sum, t) => sum + t.count, 0);
    expect(fromTypes).toBe(SAMPLE_BUNDLE.objects.length);
  });

  it("finds the ten missing references, two duplicates and five expired indicators", () => {
    const by = (k: string) => a.problems.filter((p) => p.kind === k).length;
    expect(by("dangling")).toBe(10);
    expect(by("duplicate")).toBe(2);
    expect(by("expired")).toBe(5);
    expect(a.finding).toBe("10 of 98 relationships or report references point at objects not in the bundle; 2 indicators duplicate an existing pattern; 5 indicators have expired. Review before importing.");
  });

  it("counts techniques used directly and through malware and tools, one hop", () => {
    const total = Object.fromEntries(a.coverage.map((c) => [c.name, c.total]));
    expect(total).toEqual({ "Lazarus Group": 12, APT28: 10, FIN7: 10, MuddyWater: 8 });
    expect(a.coverage.map((c) => c.name)).toEqual(["Lazarus Group", "APT28", "FIN7", "MuddyWater"]);
  });

  it("places a technique in every tactic column it belongs to", () => {
    const apt28 = a.coverage.find((c) => c.name === "APT28")!;
    const inColumns = TACTICS.filter((t) => apt28.byTactic.get(t.id)!.some((cell) => cell.techniqueId === "T1078")).map((t) => t.id);
    expect(inColumns).toEqual(["initial-access", "persistence", "privilege-escalation", "defense-evasion"]);
  });

  it("indexes inbound and outbound relationships and report membership", () => {
    const apt28 = SAMPLE_BUNDLE.objects.find((o) => o.name === "APT28")!;
    expect(a.outbound.get(apt28.id)?.length).toBe(14);
    expect(a.inbound.get(apt28.id)?.length).toBe(3);
    expect(a.reportedIn.get(apt28.id)?.length).toBe(1);
  });

  it("is clean on a bundle with nothing wrong", () => {
    const clean: Bundle = { type: "bundle", id: "bundle--1", objects: [{ type: "malware", id: "malware--1", created: "2026-01-01T00:00:00Z", modified: "2026-01-01T00:00:00Z", name: "One" }] };
    expect(analyze(clean, NOW).problems).toEqual([]);
    expect(analyze(clean, NOW).finding).toMatch(/safe to import/);
  });
});

describe("names", () => {
  const a = analyze(SAMPLE_BUNDLE, NOW);
  it("reads the ATT&CK id from external references", () => {
    const ap = SAMPLE_BUNDLE.objects.find((o) => o.name === "Valid Accounts")!;
    expect(attackId(ap)).toBe("T1078");
  });
  it("describes a relationship by its ends", () => {
    const dangling = a.problems.find((p) => p.kind === "dangling" && p.message.startsWith("target_ref"))!;
    const r = a.byId.get(dangling.objectId)!;
    expect(displayName(r, a.byId)).toBe("APT28 uses attack-pattern (missing)");
  });
  it("falls back to the pattern for an unnamed indicator", () => {
    expect(displayName({ type: "indicator", id: "indicator--x" as StixId, created: "", modified: "", pattern: "[url:value = 'x']", pattern_type: "stix", valid_from: "" })).toBe("[url:value = 'x']");
  });
});

describe("parseBundle", () => {
  it("accepts a bundle and rejects what is not one", () => {
    expect(parseBundle(JSON.stringify(SAMPLE_BUNDLE)).objects.length).toBe(SAMPLE_BUNDLE.objects.length);
    expect(() => parseBundle("{")).toThrow(/valid JSON/);
    expect(() => parseBundle('{"type":"report"}')).toThrow(/"type": "bundle"/);
    expect(() => parseBundle('{"type":"bundle"}')).toThrow(/objects/);
    expect(() => parseBundle('{"type":"bundle","objects":[{"name":"no id"}]}')).toThrow(/Object 0/);
  });
});
