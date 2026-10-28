import { Link } from "@tanstack/react-router";
import type { TypeCount } from "../stix/analyze.ts";
import { n, typeLabel } from "./format.ts";

/** Composition of the bundle by object type, as a bar list. Relationships take the one hue: they are what the import is judged on. */
export function TypeBars({ counts }: { counts: TypeCount[] }) {
  const max = Math.max(1, ...counts.map((c) => c.count));
  return (
    <div className="bars">
      {counts.map((c) => (
        <Link key={c.type} to="/objects" search={{ type: c.type }} className="bar" aria-label={`${typeLabel(c.type)}: ${c.count}`}>
          <span className="label">{typeLabel(c.type)}</span>
          <span className="track" aria-hidden="true">
            <span className={c.type === "relationship" ? "fill hue" : "fill"} style={{ width: `${(c.count / max) * 100}%` }} />
          </span>
          <span className="fig n" style={{ textAlign: "right" }}>
            {n(c.count)}
          </span>
        </Link>
      ))}
    </div>
  );
}
