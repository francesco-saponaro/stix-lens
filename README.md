# STIX Lens

See what is inside a STIX 2.1 bundle before you import it.

Live: https://stix-lens.netlify.app

## Why

Threat intelligence arrives as STIX bundles: a feed's weekly export, a TAXII pull, another platform's share. Before one goes into a CTI platform I want to know three things: what is in it, which intrusion sets and ATT&CK techniques it covers, and what will break on import. Most of the time the answer to the third one is "something": relationships that point at objects the sender didn't include, the same indicator exported twice under new ids, indicators that expired weeks ago. STIX Lens answers those three questions in the browser, from the file alone.

## What it does

- **Overview.** The bundle's totals, one sentence on what needs attention, and the ATT&CK coverage matrix: every intrusion set against the fourteen tactics, with the techniques it uses directly or through the malware and tools it uses.
- **Objects.** Every object in the bundle, filterable by type and searchable by name, id or pattern. Each one opens to its fields, its relationships in both directions, the reports that list it, and the raw JSON.
- **Problems.** Missing references, duplicate indicators and expired indicators, with what each one does on import.
- **Load a bundle.** Drop your own file. It is parsed in the browser and kept in local storage; nothing leaves the page.

A sample bundle is served with the app, shaped like a week of a commercial feed: four intrusion sets, their tooling, 43 techniques, 32 indicators, 8 reports and 98 relationships, with the defects such a feed usually carries.

## Run it

```
npm install
npm run dev        # http://localhost:5173
npm test           # vitest, 20 tests
npm run build      # dist/
npm run sample     # regenerate public/feeds/*.json from src/stix/sample-bundle.ts
```

## Stack

TypeScript in strict mode, React 19, Vite, TanStack Router for the routes and typed search params, TanStack Query for loading the bundle, Tailwind v4 with a small stylesheet of design tokens. Tests with Vitest and Testing Library. No backend: the sample feed is a static file and a dropped file is read with the File API.

## How it reads a bundle

`src/stix/analyze.ts` indexes every object by id, splits relationships from the rest, and builds inbound and outbound maps. Problems come from three passes: every `source_ref`, `target_ref`, `object_refs` entry and `created_by_ref` is resolved against the index; indicator patterns are compared for duplicates; `valid_until` is checked against today. Coverage walks each intrusion set's `uses` relationships, follows one hop through malware and tools, and places each technique in every tactic its `kill_chain_phases` name. The sample bundle is generated deterministically in `src/stix/sample-bundle.ts` so the numbers in the tests are stable.

## What is mocked

Everything runs on a file. In a real deployment the "feed" would be a TAXII collection or a platform's export API, and the problems list would carry actions (fetch the missing objects from the source, merge the duplicate). The ATT&CK technique list is the subset the sample uses; a full build would load the ATT&CK STIX bundle itself.
