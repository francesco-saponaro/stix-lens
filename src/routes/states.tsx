import { Link } from "@tanstack/react-router";

export function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading the bundle">
      <div className="title-row">
        <div>
          <div className="skeleton" style={{ width: 360, height: 30 }} />
          <div className="skeleton" style={{ width: 520, height: 16, marginTop: 10 }} />
        </div>
      </div>
      <div className="kpis">
        {Array.from({ length: 6 }, (_, i) => (
          <div className="kpi" key={i}>
            <div className="skeleton" style={{ width: 70, height: 12 }} />
            <div className="skeleton" style={{ width: 44, height: 22, marginTop: 8 }} />
          </div>
        ))}
      </div>
      <div className="panel">
        <div className="skeleton" style={{ height: 220 }} />
      </div>
    </div>
  );
}

export function LoadError({ error }: { error: Error }) {
  return (
    <>
      <div className="title-row">
        <div>
          <h1>The bundle could not be read</h1>
          <p className="sub error">{error.message}</p>
        </div>
        <Link to="/load" className="btn primary">
          Load another bundle
        </Link>
      </div>
    </>
  );
}
