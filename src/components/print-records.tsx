"use client";
import { useEffect, useState } from "react";
import { definitions, type RecordRow } from "@/lib/domain";
import { api } from "./record-list";
export function PrintRecords({ table }: { table: string }) {
  const [rows, setRows] = useState<RecordRow[]>([]),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const all: RecordRow[] = [];
        const filters = new URLSearchParams(window.location.search);
        filters.delete("page");
        for (let page = 0; ; page++) {
          const r = await api(`/api/records/${table}?${filters}&page=${page}`, {
            signal: controller.signal,
          });
          all.push(...r.data);
          if (all.length >= r.count || !r.data.length) break;
          if (all.length >= 10000)
            throw new Error(
              "Choose a smaller selection to print (maximum 10,000 records).",
            );
        }
        setRows(all);
        setReady(true);
      } catch (e) {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Report unavailable");
      }
    }
    void load();
    return () => controller.abort();
  }, [table]);
  const def = definitions[table];
  return (
    <main className="print-report">
      <style>{`body{background:white!important;color:#111!important}.print-report{max-width:1000px;margin:auto;padding:32px;font:14px Arial;color:#111;background:white}.print-report article{border-top:1px solid #aaa;padding:16px 0;break-inside:auto}.print-report h2{break-after:avoid}.print-report dl{display:grid;grid-template-columns:160px 1fr;gap:10px}.print-report dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.print-report dt{font-weight:bold}@media print{.print-controls{display:none!important}.print-report{padding:0;max-width:none}@page{margin:16mm}}`}</style>
      <div className="print-controls">
        <button onClick={() => window.print()} disabled={!ready}>
          Print / Save PDF
        </button>{" "}
        <a href="/">Back to workspace</a>
      </div>
      <h1>Notara · {def.label}</h1>
      <p>
        Generated {new Date().toLocaleDateString("en-ZA")} ·{" "}
        {ready ? rows.length : "Loading"} records · Private workspace
      </p>
      {error && <p role="alert">{error}</p>}
      {rows.map((r) => (
        <article key={r.id}>
          <h2>{r.name}</h2>
          <dl>
            {def.fields
              .filter((f) => f.key !== "name")
              .map((f) => (
                <span key={f.key} style={{ display: "contents" }}>
                  <dt>{f.label}</dt>
                  <dd>
                    {String(
                      (f.relation
                        ? (r._labels as Record<string, string>)?.[f.key]
                        : r[f.key]) ?? "—",
                    )}
                  </dd>
                </span>
              ))}
          </dl>
        </article>
      ))}
    </main>
  );
}
