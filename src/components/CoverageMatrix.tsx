import { Link } from "@tanstack/react-router";
import { TACTICS } from "../stix/attack.ts";
import type { Coverage } from "../stix/analyze.ts";
import { n } from "./format.ts";

/**
 * The bundle's intrusion sets against the ATT&CK tactics: every technique a set uses,
 * directly or through its malware and tools, stacked in the tactic's column.
 */
export function CoverageMatrix({ coverage, techniqueTotal }: { coverage: Coverage[]; techniqueTotal: number }) {
  if (coverage.length === 0) {
    return <div className="empty">No intrusion sets in this bundle, so there is no coverage to show.</div>;
  }
  return (
    <div className="matrix-wrap">
      <div className="matrix" role="table" aria-label="ATT&CK coverage by intrusion set">
        <div className="head set" role="columnheader">
          Intrusion set
        </div>
        {TACTICS.map((t) => (
          <div key={t.id} className="head" role="columnheader" title={t.name}>
            {t.short}
          </div>
        ))}
        {coverage.map((c) => (
          <CoverageRow key={c.intrusionSetId} coverage={c} techniqueTotal={techniqueTotal} />
        ))}
      </div>
    </div>
  );
}

function CoverageRow({ coverage, techniqueTotal }: { coverage: Coverage; techniqueTotal: number }) {
  return (
    <>
      <div className="set-cell" role="rowheader">
        <Link to="/objects/$objectId" params={{ objectId: coverage.intrusionSetId }} className="name">
          {coverage.name}
        </Link>
        <span className="fig">
          {n(coverage.total)} of {n(techniqueTotal)} techniques
        </span>
      </div>
      {TACTICS.map((t) => {
        const cells = coverage.byTactic.get(t.id) ?? [];
        return (
          <div key={t.id} className={cells.length ? "cell" : "cell empty"} role="cell" aria-label={`${t.name}: ${cells.length}`}>
            {cells.map((cell) => (
              <Link key={cell.objectId} to="/objects/$objectId" params={{ objectId: cell.objectId }} className="tq" title={`${cell.techniqueId} ${cell.name}`}>
                {cell.techniqueId}
              </Link>
            ))}
          </div>
        );
      })}
    </>
  );
}
