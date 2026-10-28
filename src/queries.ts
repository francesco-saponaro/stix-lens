import { queryOptions, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useBundleSource, type BundleSource } from "./bundle-source.ts";
import { analyze, parseBundle, type Analysis } from "./stix/analyze.ts";
import type { Bundle } from "./stix/types.ts";

export function bundleQuery(source: BundleSource) {
  return queryOptions({
    queryKey: ["bundle", source.kind, source.kind === "feed" ? source.url : source.loadedAt],
    queryFn: async (): Promise<Bundle> => {
      if (source.kind === "file") return source.bundle;
      const res = await fetch(source.url);
      if (!res.ok) throw new Error(`The feed answered ${res.status} ${res.statusText}.`);
      return parseBundle(await res.text());
    },
    staleTime: Infinity,
  });
}

export function useAnalysis(): { source: BundleSource; analysis: Analysis | undefined; isPending: boolean; error: Error | null } {
  const source = useBundleSource();
  const q = useQuery(bundleQuery(source));
  const analysis = useMemo(() => (q.data ? analyze(q.data) : undefined), [q.data]);
  return { source, analysis, isPending: q.isPending, error: q.error };
}
