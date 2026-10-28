import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { n, shortDate, shortId, typeLabel } from "../components/format.ts";
import { useAnalysis } from "../queries.ts";
import { displayName } from "../stix/analyze.ts";
import type { StixId, StixObject } from "../stix/types.ts";
import { LoadError, Loading } from "./states.tsx";

export interface ObjectsSearch {
  type?: string;
  q?: string;
}

export function filterObjects(objects: StixObject[], search: ObjectsSearch, byId?: Map<StixId, StixObject>): StixObject[] {
  const q = search.q?.trim().toLowerCase();
  return objects.filter((o) => {
    if (search.type && o.type !== search.type) return false;
    if (!q) return true;
    const hay = `${displayName(o, byId)} ${o.id} ${(o as { pattern?: string }).pattern ?? ""} ${(o.labels ?? []).join(" ")}`.toLowerCase();
    return hay.includes(q);
  });
}

export function Objects({ search }: { search: ObjectsSearch }) {
  const { analysis, isPending, error } = useAnalysis();
  const navigate = useNavigate();
  const rows = useMemo(() => (analysis ? filterObjects(analysis.bundle.objects, search, analysis.byId) : []), [analysis, search]);
  if (error) return <LoadError error={error} />;
  if (isPending || !analysis) return <Loading />;

  const setSearch = (next: ObjectsSearch) => navigate({ to: "/objects", search: { ...search, ...next }, replace: true });
  const total = analysis.bundle.objects.length;

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Objects</h1>
          <p className="sub">
            <strong>
              {n(rows.length)} of {n(total)}
            </strong>{" "}
            shown. Click a row for its fields and relationships.
          </p>
        </div>
      </div>

      <div className="filters" role="group" aria-label="Filter objects">
        <button type="button" className="chip" aria-pressed={!search.type} onClick={() => setSearch({ type: undefined })}>
          All<span className="fig">{n(total)}</span>
        </button>
        {analysis.typeCounts.map((t) => (
          <button key={t.type} type="button" className="chip" aria-pressed={search.type === t.type} onClick={() => setSearch({ type: t.type })}>
            {typeLabel(t.type)}
            <span className="fig">{n(t.count)}</span>
          </button>
        ))}
        <span className="spacer" />
        <input
          className="input"
          type="search"
          placeholder="Name, id or pattern"
          aria-label="Search objects by name, id or pattern"
          value={search.q ?? ""}
          onChange={(e) => setSearch({ q: e.target.value || undefined })}
          style={{ width: 260 }}
        />
      </div>

      <section className="panel" style={{ padding: 0 }}>
        {rows.length === 0 ? (
          <div className="empty" style={{ margin: 20 }}>
            Nothing matches. Clear the search or pick another type.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Id</th>
                  <th>Modified</th>
                  <th className="n">Links</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => {
                  const links = (analysis.outbound.get(o.id)?.length ?? 0) + (analysis.inbound.get(o.id)?.length ?? 0) + (analysis.reportedIn.get(o.id)?.length ?? 0);
                  return (
                    <tr key={o.id} className="link" onClick={() => navigate({ to: "/objects/$objectId", params: { objectId: o.id } })}>
                      <td>
                        <Link to="/objects/$objectId" params={{ objectId: o.id }} className="truncate" style={{ display: "block" }} onClick={(e) => e.stopPropagation()}>
                          {displayName(o, analysis.byId)}
                        </Link>
                      </td>
                      <td>{typeLabel(o.type)}</td>
                      <td className="mono" style={{ color: "var(--muted)" }}>
                        {shortId(o.id)}
                      </td>
                      <td className="mono">{shortDate(o.modified)}</td>
                      <td className="n">{n(links)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
