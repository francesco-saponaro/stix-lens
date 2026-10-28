import { useNavigate } from "@tanstack/react-router";
import { useRef, useState, type DragEvent } from "react";
import { resetToSample, setFileSource, useBundleSource } from "../bundle-source.ts";
import { n } from "../components/format.ts";
import { parseBundle } from "../stix/analyze.ts";
import { SAMPLE_BUNDLE_NAME } from "../stix/sample-bundle.ts";

export function Load() {
  const navigate = useNavigate();
  const source = useBundleSource();
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function readFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const bundle = parseBundle(await file.text());
      setFileSource(file.name, bundle);
      await navigate({ to: "/" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The file could not be read.");
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void readFile(file);
  }

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Load a bundle</h1>
          <p className="sub">
            A STIX 2.1 bundle as JSON, straight from a feed export or a TAXII pull. It is read in your browser and goes nowhere else.
          </p>
        </div>
      </div>

      <div className="grid top">
        <section className="panel" style={{ gridColumn: "span 7" }} aria-labelledby="drop-h">
          <header>
            <h2 id="drop-h">Your file</h2>
            <span className="meta">.json, any size your browser can hold</span>
          </header>
          <div
            className={over ? "dropzone over" : "dropzone"}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
          >
            <p>Drop the bundle here, or</p>
            <button type="button" className="btn primary" style={{ marginTop: 12 }} onClick={() => inputRef.current?.click()} disabled={busy}>
              {busy ? "Reading…" : "Choose a file"}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="application/json,.json"
              aria-label="Choose a STIX bundle file"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void readFile(f);
                e.target.value = "";
              }}
            />
          </div>
          {error && (
            <p className="error" role="alert" style={{ marginTop: 16 }}>
              {error}
            </p>
          )}
          <h3 className="section-title" style={{ fontSize: 14, marginTop: 20, marginBottom: 6 }}>
            What happens next
          </h3>
          <p>
            Every object is indexed by id, every relationship and report reference is resolved, indicator patterns are compared, and valid_until dates are checked against today. The overview then shows the ATT&amp;CK techniques each intrusion set uses, directly or through its malware and tools.
          </p>
        </section>

        <section className="panel" style={{ gridColumn: "span 5" }} aria-labelledby="current-h">
          <header>
            <h2 id="current-h">Loaded now</h2>
          </header>
          <dl className="dl">
            <dt>Bundle</dt>
            <dd className="mono">{source.name}</dd>
            <dt>Source</dt>
            <dd>{source.kind === "file" ? `Your file, ${n(source.bundle.objects.length)} objects, kept in this browser` : "Sample feed served with the app"}</dd>
            <dt>Format</dt>
            <dd>
              A STIX 2.1 bundle: <span className="mono">{"{ \"type\": \"bundle\", \"objects\": [...] }"}</span>. Objects need a type and an id; everything else is optional.
            </dd>
          </dl>
          {source.kind === "file" ? (
            <button
              type="button"
              className="btn"
              style={{ marginTop: 16 }}
              onClick={() => {
                resetToSample();
                void navigate({ to: "/" });
              }}
            >
              Back to the sample feed
            </button>
          ) : (
            <a className="btn" style={{ marginTop: 16 }} href={`/feeds/${SAMPLE_BUNDLE_NAME}`} download>
              Download the sample feed
            </a>
          )}
        </section>

        <section className="panel" style={{ gridColumn: "span 12" }} aria-labelledby="sources-h">
          <header>
            <h2 id="sources-h">Where a bundle comes from</h2>
          </header>
          <dl className="dl three">
            <dt>A feed export</dt>
            <dd>Most intelligence vendors and sharing communities deliver a STIX 2.1 JSON file per period. The sample here is shaped like one of those: a week of a feed, with its reports, indicators and relationships.</dd>
            <dt>A TAXII pull</dt>
            <dd>A TAXII 2.1 collection returns an envelope with an objects array. Wrap it as a bundle, or save the response as is: the objects array is what gets read.</dd>
            <dt>Another platform</dt>
            <dd>OpenCTI, MISP and most SIEMs export selected knowledge as a STIX bundle. Loading that export here shows what crosses over cleanly and what the receiving side will have to repair.</dd>
          </dl>
        </section>
      </div>
    </>
  );
}
