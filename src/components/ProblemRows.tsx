import { Link } from "@tanstack/react-router";
import type { Analysis, Problem } from "../stix/analyze.ts";
import { displayName } from "../stix/analyze.ts";
import { shortId, typeLabel } from "./format.ts";

const KIND_LABEL: Record<Problem["kind"], string> = {
  dangling: "Missing reference",
  duplicate: "Duplicate",
  expired: "Expired",
};

const KIND_CLASS: Record<Problem["kind"], string> = {
  dangling: "pill neg",
  duplicate: "pill warn",
  expired: "pill",
};

export function ProblemPill({ kind }: { kind: Problem["kind"] }) {
  return <span className={KIND_CLASS[kind]}>{KIND_LABEL[kind]}</span>;
}

export function ProblemRows({ problems, analysis, columns = 1 }: { problems: Problem[]; analysis: Analysis; columns?: 1 | 2 }) {
  if (problems.length === 0) {
    return <div className="empty">Nothing to fix. Every reference resolves and no indicator is duplicated or expired.</div>;
  }
  return (
    <div className={columns === 2 ? "rows two" : "rows"}>
      {problems.map((p, i) => {
        const o = analysis.byId.get(p.objectId);
        return (
          <div className="row" key={`${p.objectId}-${p.subject}-${i}`}>
            <ProblemPill kind={p.kind} />
            <div className="grow">
              <Link to="/objects/$objectId" params={{ objectId: p.objectId }} className="card-link">
                {o ? displayName(o, analysis.byId) : shortId(p.objectId)}
              </Link>
              <span className="sub-line">
                {o ? typeLabel(o.type) : "Object"}: {p.message}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
