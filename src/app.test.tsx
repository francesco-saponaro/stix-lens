import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetBundleSource } from "./bundle-source.ts";
import { makeRouter } from "./router.tsx";
import { SAMPLE_BUNDLE } from "./stix/sample-bundle.ts";

function renderAt(path: string) {
  const router = makeRouter(createMemoryHistory({ initialEntries: [path] }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe("the app", () => {
  beforeEach(() => {
    __resetBundleSource();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(SAMPLE_BUNDLE), { status: 200 })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows the bundle's finding and totals on the overview", async () => {
    renderAt("/");
    expect(await screen.findByRole("heading", { level: 1, name: "harbourline-feed-2026-w43.json" })).toBeInTheDocument();
    expect(screen.getByText(/10 of 98 relationships/)).toBeInTheDocument();
    const totals = screen.getByLabelText("Bundle totals");
    expect(within(totals).getByText("Objects").nextElementSibling).toHaveTextContent("100");
    expect(within(totals).getByText("Problems").nextElementSibling).toHaveTextContent("17");
    expect(screen.getByRole("table", { name: /ATT&CK coverage/ })).toBeInTheDocument();
  });

  it("filters the objects list from the URL and the chips", async () => {
    const user = userEvent.setup();
    renderAt("/objects?type=tool");
    expect(await screen.findByText(/2 of 198/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cobalt Strike" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Malware/ }));
    expect(await screen.findByText(/6 of 198/)).toBeInTheDocument();
  });

  it("opens an object and lists its relationships", async () => {
    const apt28 = SAMPLE_BUNDLE.objects.find((o) => o.name === "APT28")!;
    renderAt(`/objects/${apt28.id}`);
    expect(await screen.findByRole("heading", { level: 1, name: "APT28" })).toBeInTheDocument();
    expect(screen.getByText("14 out · 3 in")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Phishing for Information" })).toBeInTheDocument();
  });

  it("explains a missing object instead of crashing", async () => {
    renderAt("/objects/malware--does-not-exist");
    expect(await screen.findByRole("heading", { level: 1, name: "Not in this bundle" })).toBeInTheDocument();
  });

  it("reports a feed that cannot be fetched", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 502, statusText: "Bad Gateway" })));
    renderAt("/");
    expect(await screen.findByText(/answered 502 Bad Gateway/)).toBeInTheDocument();
  });
});
