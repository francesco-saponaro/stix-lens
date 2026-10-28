import { useNavigate } from "@tanstack/react-router";
import { n } from "../components/format.ts";
import { ProblemRows } from "../components/ProblemRows.tsx";
import { useAnalysis } from "../queries.ts";
import type { ProblemKind } from "../stix/analyze.ts";
import { LoadError, Loading } from "./states.tsx";

export interface ProblemsSearch {
  kind?: ProblemKind;
}

const KINDS: Array<{ id: ProblemKind; label: string }> = [
  { id: "dangling", label: "Missing references" },
  { id: "duplicate", label: "Duplicates" },
  { id: "expired", label: "Expired" },
];

export function Problems({ search }: { search: ProblemsSearch }) {
  const { analysis, isPending, error } = useAnalysis();
  const navigate = useNavigate();
  if (error) return <LoadError error={error} />;
  if (isPending || !analysis) return <Loading />;

  const all = analysis.problems;
  const rows = search.kind ? all.filter((p) => p.kind === search.kind) : all;
  const count = (k: ProblemKind) => all.filter((p) => p.kind === k).length;
  const set = (kind?: ProblemKind) => navigate({ to: "/problems", search: kind ? { kind } : {}, replace: true });

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Problems</h1>
          <p className="sub">
            <strong>{analysis.finding}</strong> A missing reference imports as a broken link; a duplicate as two indicators for one pattern; an expired indicator as noise.
          </p>
        </div>
      </div>

      <div className="filters" role="group" aria-label="Filter problems">
        <button type="button" className="chip" aria-pressed={!search.kind} onClick={() => set(undefined)}>
          All<span className="fig">{n(all.length)}</span>
        </button>
        {KINDS.map((k) => (
          <button key={k.id} type="button" className="chip" aria-pressed={search.kind === k.id} onClick={() => set(k.id)}>
            {k.label}
            <span className="fig">{n(count(k.id))}</span>
          </button>
        ))}
      </div>

      <div className="grid top">
        <section className="panel" style={{ gridColumn: "span 12" }} aria-label="Problem list">
          <ProblemRows problems={rows} analysis={analysis} columns={2} />
        </section>
        <section className="panel" style={{ gridColumn: "span 12" }} aria-labelledby="fix-h">
          <header>
            <h2 id="fix-h">What each one does on import</h2>
          </header>
          <dl className="dl three">
            <dt>
              Missing references <span className="fig">{n(count("dangling"))}</span>
            </dt>
            <dd>
              The relationship or report keeps an id nothing resolves to. Most platforms import it as a loose end and some reject the bundle. Fetch the missing objects from the source, or drop these before importing.
            </dd>
            <dt>
              Duplicates <span className="fig">{n(count("duplicate"))}</span>
            </dt>
            <dd>
              Two indicator objects with the same pattern and different ids. They become two indicators to maintain, and two alerts for one match. Keep the earlier one and merge the relationships.
            </dd>
            <dt>
              Expired <span className="fig">{n(count("expired"))}</span>
            </dt>
            <dd>Indicators whose valid_until has passed. They still import, then sit in detection rules as noise. Import them only if you want the history.</dd>
          </dl>
        </section>
      </div>
    </>
  );
}
