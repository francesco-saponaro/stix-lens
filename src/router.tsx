import { createRootRoute, createRoute, createRouter, type RouterHistory } from "@tanstack/react-router";
import { Shell } from "./components/Shell.tsx";
import { Load } from "./routes/Load.tsx";
import { ObjectDetail } from "./routes/ObjectDetail.tsx";
import { Objects, type ObjectsSearch } from "./routes/Objects.tsx";
import { Overview } from "./routes/Overview.tsx";
import { Problems, type ProblemsSearch } from "./routes/Problems.tsx";

const rootRoute = createRootRoute({ component: Shell });

const overviewRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: Overview });

const objectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/objects",
  validateSearch: (raw: Record<string, unknown>): ObjectsSearch => ({
    type: typeof raw.type === "string" && raw.type ? raw.type : undefined,
    q: typeof raw.q === "string" && raw.q ? raw.q : undefined,
  }),
  component: function ObjectsPage() {
    const search = objectsRoute.useSearch();
    return <Objects search={search} />;
  },
});

const objectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/objects/$objectId",
  component: function ObjectPage() {
    const { objectId } = objectRoute.useParams();
    return <ObjectDetail objectId={objectId} />;
  },
});

const problemsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/problems",
  validateSearch: (raw: Record<string, unknown>): ProblemsSearch => ({
    kind: raw.kind === "dangling" || raw.kind === "duplicate" || raw.kind === "expired" ? raw.kind : undefined,
  }),
  component: function ProblemsPage() {
    const search = problemsRoute.useSearch();
    return <Problems search={search} />;
  },
});

const loadRoute = createRoute({ getParentRoute: () => rootRoute, path: "/load", component: Load });

export const routeTree = rootRoute.addChildren([overviewRoute, objectsRoute, objectRoute, problemsRoute, loadRoute]);

export function makeRouter(history?: RouterHistory) {
  return createRouter({ routeTree, history, defaultPreload: "intent", scrollRestoration: true });
}

export const router = makeRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
