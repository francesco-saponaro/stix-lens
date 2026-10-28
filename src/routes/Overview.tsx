import { Link } from "@tanstack/react-router";
import { CoverageMatrix } from "../components/CoverageMatrix.tsx";
import { n, shortDate } from "../components/format.ts";
import { ProblemRows } from "../components/ProblemRows.tsx";
import { TypeBars } from "../components/TypeBars.tsx";
import { useAnalysis } from "../queries.ts";
import { isReport } from "../stix/types.ts";
import { LoadError, Loading } from "./states.tsx";

export function Overview() {
  const { source, analysis, isPending, error } = useAnalysis();
  if (error) return <LoadError error={error} />;
  if (isPending || !analysis) return <Loading />;

  const a = analysis;
  const sets = a.typeCounts.find((t) => t.type === "intrusion-set")?.count ?? 0;
  const indicators = a.typeCounts.find((t) => t.type === "indicator")?.count ?? 0;
  const reports = a.bundle.objects.filter(isReport).sort((x, y) => (x.published < y.published ? 1 : -1));
  const loaded = source.kind === "file" ? `Loaded ${shortDate(source.loadedAt)} from your file` : "Sample feed served with the app";

  return (
    <>
      <div className="title-row">
        <div>
          <h1>{source.name}</h1>
          <p className="sub">
            <strong>{a.finding}</strong> {loaded}.
          </p>
        </div>
        <Link to="/load" className="btn primary">
          Load another bundle
        </Link>
      </div>

      <div className="kpis" aria-label="Bundle totals">
        <Kpi label="Objects" value={a.objects.length} />
        <Kpi label="Relationships" value={a.relationships.length} />
        <Kpi label="Intrusion sets" value={sets} />
        <Kpi label="Techniques" value={a.techniqueTotal} />
        <Kpi label="Indicators" value={indicators} />
        <Kpi label="Problems" value={a.problems.length} to="/problems" />
      </div>

      <div className="grid top">
        <section className="panel" style={{ gridColumn: "span 12" }} aria-labelledby="coverage-h">
          <header>
            <h2 id="coverage-h">ATT&amp;CK coverage by intrusion set</h2>
            <span className="meta">Techniques used directly, or through the set's malware and tools</span>
          </header>
          <CoverageMatrix coverage={a.coverage} techniqueTotal={a.techniqueTotal} />
        </section>

        <section className="panel" style={{ gridColumn: "span 7" }} aria-labelledby="problems-h">
          <header>
            <h2 id="problems-h">Problems</h2>
            {a.problems.length > 10 && (
              <Link to="/problems" className="card-link">
                View all {n(a.problems.length)}
              </Link>
            )}
          </header>
          <ProblemRows problems={a.problems.slice(0, 10)} analysis={a} />
        </section>

        <div className="stack" style={{ gridColumn: "span 5" }}>
        <section className="panel" aria-labelledby="types-h">
          <header>
            <h2 id="types-h">What is in it</h2>
          </header>
          <TypeBars counts={a.typeCounts} />
        </section>

        <section className="panel" aria-labelledby="reports-h">
          <header>
            <h2 id="reports-h">Reports</h2>
            {reports.length > 5 && (
              <Link to="/objects" search={{ type: "report" }} className="card-link">
                View all {n(reports.length)}
              </Link>
            )}
          </header>
          {reports.length === 0 ? (
            <div className="empty">No reports in this bundle.</div>
          ) : (
            <div className="rows">
              {reports.slice(0, 5).map((r) => (
                <div className="row" key={r.id}>
                  <div className="grow">
                    <Link to="/objects/$objectId" params={{ objectId: r.id }} className="card-link">
                      {r.name}
                    </Link>
                  </div>
                  <span className="fig n" style={{ color: "var(--muted)" }}>
                    {n(r.object_refs.length)} refs · {shortDate(r.published)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, to }: { label: string; value: number; to?: string }) {
  const body = (
    <>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{n(value)}</div>
    </>
  );
  return to ? (
    <Link to={to} className="kpi">
      {body}
    </Link>
  ) : (
    <div className="kpi">{body}</div>
  );
}
