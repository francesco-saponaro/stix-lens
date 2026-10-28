import { describe, expect, it } from "vitest";
import { analyze } from "../stix/analyze.ts";
import { SAMPLE_BUNDLE } from "../stix/sample-bundle.ts";
import { filterObjects } from "./Objects.tsx";

describe("filterObjects", () => {
  const a = analyze(SAMPLE_BUNDLE, new Date("2026-10-28T00:00:00Z"));
  it("filters by type", () => {
    expect(filterObjects(SAMPLE_BUNDLE.objects, { type: "intrusion-set" }, a.byId).map((o) => o.name)).toEqual(["APT28", "Lazarus Group", "FIN7", "MuddyWater"]);
  });
  it("searches names, ids and patterns, case-insensitively", () => {
    expect(filterObjects(SAMPLE_BUNDLE.objects, { q: "lazarus" }, a.byId).length).toBeGreaterThan(5);
    // an address matches the indicators that carry it and the relationships named after them
    const hits = filterObjects(SAMPLE_BUNDLE.objects, { q: "203.0.113" }, a.byId);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((o) => o.type === "indicator" || o.type === "relationship")).toBe(true);
    expect(filterObjects(SAMPLE_BUNDLE.objects, { type: "indicator", q: "203.0.113" }, a.byId).every((o) => (o as { pattern: string }).pattern.includes("203.0.113"))).toBe(true);
    expect(filterObjects(SAMPLE_BUNDLE.objects, { type: "tool", q: "MIMI" }, a.byId).map((o) => o.name)).toEqual(["Mimikatz"]);
  });
  it("returns everything with no filter", () => {
    expect(filterObjects(SAMPLE_BUNDLE.objects, {}, a.byId).length).toBe(SAMPLE_BUNDLE.objects.length);
  });
});
