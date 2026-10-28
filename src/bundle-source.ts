/**
 * Where the current bundle comes from: the sample feed served with the app, or a file the
 * analyst dropped in. A dropped file is kept in localStorage (when it fits) so a reload
 * doesn't lose it.
 */
import { useSyncExternalStore } from "react";
import { SAMPLE_BUNDLE_NAME } from "./stix/sample-bundle.ts";
import type { Bundle } from "./stix/types.ts";

export type BundleSource =
  | { kind: "feed"; name: string; url: string }
  | { kind: "file"; name: string; bundle: Bundle; loadedAt: string };

const STORAGE_KEY = "stix-lens.file";
const MAX_STORED_BYTES = 2_000_000;

export const SAMPLE_SOURCE: BundleSource = { kind: "feed", name: SAMPLE_BUNDLE_NAME, url: `/feeds/${SAMPLE_BUNDLE_NAME}` };

let current: BundleSource = restore();
const listeners = new Set<() => void>();

function restore(): BundleSource {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SAMPLE_SOURCE;
    const saved = JSON.parse(raw) as { name: string; bundle: Bundle; loadedAt: string };
    if (saved && saved.bundle && Array.isArray(saved.bundle.objects)) return { kind: "file", ...saved };
  } catch {
    // storage unavailable or corrupt: start from the sample
  }
  return SAMPLE_SOURCE;
}

function emit() {
  for (const l of listeners) l();
}

export function setFileSource(name: string, bundle: Bundle) {
  current = { kind: "file", name, bundle, loadedAt: new Date().toISOString() };
  try {
    const raw = JSON.stringify({ name, bundle, loadedAt: current.loadedAt });
    if (raw.length <= MAX_STORED_BYTES) localStorage.setItem(STORAGE_KEY, raw);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // fine: the bundle stays in memory for this visit
  }
  emit();
}

export function resetToSample() {
  current = SAMPLE_SOURCE;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  emit();
}

export function useBundleSource(): BundleSource {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => SAMPLE_SOURCE,
  );
}

/** Test hook: put the store back to its starting state. */
export function __resetBundleSource() {
  current = SAMPLE_SOURCE;
  emit();
}
