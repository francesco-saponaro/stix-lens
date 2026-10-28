import { Link, Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";

function Mark() {
  // A lens over a bundle: a ring with one line through it, drawn in the page's own colours.
  return (
    <svg className="mark" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="13" cy="13" r="8" fill="none" stroke="#ffffff" strokeWidth="1.5" />
      <path d="M19 19l6 6" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 13h10" stroke="#4a8ad6" strokeWidth="1" />
    </svg>
  );
}

const icons = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="5" rx="1" />
      <rect x="13" y="11" width="8" height="10" rx="1" />
      <rect x="3" y="14" width="8" height="7" rx="1" />
    </svg>
  ),
  objects: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  ),
  problems: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l9.5 17h-19L12 3z" />
      <path d="M12 10v4M12 17.5v.5" />
    </svg>
  ),
  load: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
    </svg>
  ),
};

function RailLink({ to, label, icon }: { to: string; label: string; icon: ReactNode }) {
  return (
    <Link to={to} className="rail-item" aria-label={label} activeOptions={{ exact: to === "/" }} activeProps={{ "aria-current": "page" }}>
      {icon}
      <span className="tip">{label}</span>
    </Link>
  );
}

export function Shell() {
  return (
    <div className="app">
      <aside className="rail" aria-label="STIX Lens">
        <Link to="/" aria-label="STIX Lens, overview">
          <Mark />
        </Link>
        <nav aria-label="Sections">
          <RailLink to="/" label="Overview" icon={icons.overview} />
          <RailLink to="/objects" label="Objects" icon={icons.objects} />
          <RailLink to="/problems" label="Problems" icon={icons.problems} />
        </nav>
        <nav className="bottom" aria-label="Bundle">
          <RailLink to="/load" label="Load a bundle" icon={icons.load} />
        </nav>
      </aside>
      <main className="canvas">
        <Outlet />
      </main>
    </div>
  );
}
