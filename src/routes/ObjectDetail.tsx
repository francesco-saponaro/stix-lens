import { Link } from "@tanstack/react-router";
import { n, shortDate, shortId, typeLabel } from "../components/format.ts";
import { ProblemPill } from "../components/ProblemRows.tsx";
import { useAnalysis } from "../queries.ts";
import { attackId, displayName, type Analysis } from "../stix/analyze.ts";
import type { Relationship, StixId, StixObject } from "../stix/types.ts";
import { LoadError, Loading } from "./states.tsx";

export function ObjectDetail({ objectId }: { objectId: string }) {
  const { analysis, isPending, error } = useAnalysis();
  if (error) return <LoadError error={error} />;
  if (isPending || !analysis) return <Loading />;

  const o = analysis.byId.get(objectId as StixId);
  if (!o) {
    return (
      <div className="title-row">
        <div>
          <h1>Not in this bundle</h1>
          <p className="sub">
            <span className="mono">{objectId}</span> is referenced but was not exported with the bundle.
          </p>
        </div>
        <Link to="/objects" className="btn">
          Back to objects
        </Link>
      </div>
    );
  }

  const out = analysis.outbound.get(o.id) ?? [];
  const inn = analysis.inbound.get(o.id) ?? [];
  const reports = analysis.reportedIn.get(o.id) ?? [];
  const problems = analysis.problems.filter((p) => p.objectId === o.id);
  const technique = attackId(o);

  return (
    <>
      <div className="title-row">
        <div>
          <h1>{displayName(o, analysis.byId)}</h1>
          <p className="sub">
            <strong>{typeLabel(o.type)}</strong>
            {technique ? (
              <>
                {" "}
                · <span className="mono">{technique}</span>
              </>
            ) : null}{" "}
            · {n(out.length + inn.length)} relationships · in {n(reports.length)} reports
            {problems.length > 0 ? (
              <>
                {" "}
                ·{" "}
                {problems.map((p, i) => (
                  <ProblemPill key={i} kind={p.kind} />
                ))}
              </>
            ) : null}
          </p>
        </div>
        <Link to="/objects" search={{ type: o.type }} className="btn">
          All {typeLabel(o.type).toLowerCase()}s
        </Link>
      </div>

      <div className="grid top">
        <section className="panel" style={{ gridColumn: "span 12" }} aria-labelledby="fields-h">
          <header>
            <h2 id="fields-h">Fields</h2>
          </header>
          <Fields o={o} analysis={analysis} />
        </section>

        <section className="panel" style={{ gridColumn: "span 12" }} aria-labelledby="rel-h">
          <header>
            <h2 id="rel-h">Relationships</h2>
            <span className="meta">
              {n(out.length)} out · {n(inn.length)} in
            </span>
          </header>
          {out.length + inn.length === 0 ? (
            <div className="empty">No relationships point at or from this object.</div>
          ) : (
            <div className="rows two">
              {out.map((r) => (
                <RelRow key={r.id} r={r} direction="out" analysis={analysis} />
              ))}
              {inn.map((r) => (
                <RelRow key={r.id} r={r} direction="in" analysis={analysis} />
              ))}
            </div>
          )}
          {reports.length > 0 && (
            <>
              <h3 className="section-title" style={{ fontSize: 14, marginTop: 20 }}>
                Listed in
              </h3>
              <div className="rows">
                {reports.map((rid) => {
                  const r = analysis.byId.get(rid);
                  return (
                    <div className="row" key={rid}>
                      <div className="grow">
                        <Link to="/objects/$objectId" params={{ objectId: rid }} className="card-link">
                          {r ? displayName(r) : shortId(rid)}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section className="panel" style={{ gridColumn: "span 12" }} aria-labelledby="json-h">
          <header>
            <h2 id="json-h">Raw object</h2>
            <span className="meta">As it is in the bundle</span>
          </header>
          <pre className="json">{JSON.stringify(o, null, 2)}</pre>
        </section>
      </div>
    </>
  );
}

function Fields({ o, analysis }: { o: StixObject; analysis: Analysis }) {
  const skip = new Set(["type", "id", "spec_version", "name", "description", "object_refs", "kill_chain_phases", "external_references", "relationship_type", "source_ref", "target_ref"]);
  const entries = Object.entries(o).filter(([k]) => !skip.has(k));
  const refName = (ref: unknown) => {
    if (typeof ref !== "string") return String(ref);
    const t = analysis.byId.get(ref as StixId);
    return t ? displayName(t) : `${shortId(ref)} (not in bundle)`;
  };
  return (
    <dl className="dl wide">
      <dt>Id</dt>
      <dd className="mono">{o.id}</dd>
      {o.description ? (
        <>
          <dt>Description</dt>
          <dd>{o.description}</dd>
        </>
      ) : null}
      {entries.map(([k, v]) => (
        <FieldRow key={k} k={k} v={v} refName={refName} />
      ))}
      {Array.isArray(o.external_references) && o.external_references.length > 0 && (
        <>
          <dt>References</dt>
          <dd>
            {o.external_references.map((r, i) => (
              <div key={i}>
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noreferrer" className="card-link">
                    {r.source_name} {r.external_id ?? ""}
                  </a>
                ) : (
                  `${r.source_name} ${r.external_id ?? ""}`
                )}
              </div>
            ))}
          </dd>
        </>
      )}
      {Array.isArray(o.kill_chain_phases) && (
        <>
          <dt>Tactics</dt>
          <dd>{(o.kill_chain_phases as Array<{ phase_name: string }>).map((p) => p.phase_name).join(", ")}</dd>
        </>
      )}
      {Array.isArray((o as { object_refs?: string[] }).object_refs) && (
        <>
          <dt>Object refs</dt>
          <dd>
            {((o as { object_refs: StixId[] }).object_refs ?? []).map((ref) => {
              const t = analysis.byId.get(ref);
              return (
                <div key={ref}>
                  {t ? (
                    <Link to="/objects/$objectId" params={{ objectId: ref }} className="card-link">
                      {displayName(t)}
                    </Link>
                  ) : (
                    <span className="mono" style={{ color: "var(--negative)" }}>
                      {shortId(ref)} not in bundle
                    </span>
                  )}
                </div>
              );
            })}
          </dd>
        </>
      )}
    </dl>
  );
}

function FieldRow({ k, v, refName }: { k: string; v: unknown; refName: (ref: unknown) => string }) {
  const label = k.replace(/_/g, " ");
  let text: string;
  if (k.endsWith("_ref")) text = refName(v);
  else if (k.endsWith("_refs") && Array.isArray(v)) text = v.map(refName).join(", ");
  else if (k === "created" || k === "modified" || k === "valid_from" || k === "valid_until" || k === "published" || k === "first_seen" || k === "last_seen") text = shortDate(String(v));
  else if (Array.isArray(v)) text = v.map(String).join(", ");
  else if (typeof v === "object" && v !== null) text = JSON.stringify(v);
  else text = String(v);
  const mono = k === "pattern" || k === "created" || k === "modified" || k.includes("seen") || k.startsWith("valid") || k === "published";
  return (
    <>
      <dt>{label}</dt>
      <dd className={mono ? "mono" : undefined}>{text}</dd>
    </>
  );
}

function RelRow({ r, direction, analysis }: { r: Relationship; direction: "in" | "out"; analysis: Analysis }) {
  const otherId = direction === "out" ? r.target_ref : r.source_ref;
  const other = analysis.byId.get(otherId);
  return (
    <div className="row">
      <span className="meta" style={{ width: 96, flex: "none" }}>
        {direction === "out" ? r.relationship_type : `← ${r.relationship_type}`}
      </span>
      <div className="grow">
        {other ? (
          <Link to="/objects/$objectId" params={{ objectId: other.id }} className="card-link">
            {displayName(other)}
          </Link>
        ) : (
          <span className="mono" style={{ color: "var(--negative)" }}>
            {shortId(otherId)} not in bundle
          </span>
        )}
        <span className="meta" style={{ display: "block" }}>
          {other ? typeLabel(other.type) : otherId.split("--")[0]}
        </span>
      </div>
      <Link to="/objects/$objectId" params={{ objectId: r.id }} className="mono meta" aria-label="Open the relationship object">
        {shortId(r.id)}
      </Link>
    </div>
  );
}
