"use client";
import { useEffect, useState } from "react";
import {
  parseImportCSV,
  parseAmount,
  type importRowSchema,
} from "@/lib/imports";
import type { z } from "zod";
import { money, today } from "@/lib/domain";
import { api } from "./record-list";
import { Button } from "./ui/button";
type Row = z.infer<typeof importRowSchema>;
type History = {
  id: string;
  name: string;
  as_of: string;
  status: string;
  version: number;
  source_namespace: string;
};
export function Imports({ onChanged }: { onChanged: () => void }) {
  const [records, setRecords] = useState<Record<string, string>[]>([]),
    [headers, setHeaders] = useState<string[]>([]),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [hash, setHash] = useState(""),
    [filename, setFilename] = useState(""),
    [property, setProperty] = useState(""),
    [namespace, setNamespace] = useState("Debtors"),
    [asOf, setAsOf] = useState(today()),
    [properties, setProperties] = useState<{ id: string; name: string }[]>([]),
    [tenants, setTenants] = useState<{ id: string; name: string }[]>([]),
    [matches, setMatches] = useState<Record<string, string>>({}),
    [history, setHistory] = useState<History[]>([]),
    [review, setReview] = useState<Row[] | null>(null),
    [staged, setStaged] = useState<History | null>(null),
    [confirmed, setConfirmed] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [rev, setRev] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    (async () => {
      const fetchAll = async (table: string) => {
        const all: { id: string; name: string }[] = [];
        for (let p = 0; ; p++) {
          const v = await api(`/api/records/${table}?page=${p}&sort=name`, {
            signal: c.signal,
          });
          all.push(...v.data);
          if (all.length >= v.count || !v.data.length) break;
        }
        return all;
      };
      const [p, t, h] = await Promise.all([
        fetchAll("properties"),
        fetchAll("tenants"),
        api("/api/imports", { signal: c.signal }),
      ]);
      setProperties(p);
      setTenants(t);
      setHistory(h.data);
    })().catch((e) => {
      if (e.name !== "AbortError") setError(e.message);
    });
    return () => c.abort();
  }, [rev]);
  return (
    <section className="panel live-panel">
      <h2>Import debtor balances</h2>
      <p className="muted-note">
        Upload a CSV, map columns, review tenant matches and confirm. Imports
        create an immutable dated snapshot. Reimporting the same source file has
        no duplicate effect.
      </p>
      <div className="form-grid">
        <label>
          Source account
          <input
            value={namespace}
            maxLength={80}
            onChange={(e) => {
              setNamespace(e.target.value);
              setStaged(null);
            }}
          />
        </label>
        <label>
          As-of date
          <input
            type="date"
            value={asOf}
            onChange={(e) => {
              setAsOf(e.target.value);
              setStaged(null);
            }}
          />
        </label>
        <label>
          Property
          <select
            value={property}
            onChange={(e) => {
              setProperty(e.target.value);
              setReview(null);
              setStaged(null);
            }}
          >
            <option value="">Choose property</option>
            {properties.map((p) => (
              <option value={p.id} key={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          CSV file
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={async (e) => {
              setError("");
              setReview(null);
              setStaged(null);
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const bytes = await file.arrayBuffer();
                const parsed = parseImportCSV(new TextDecoder().decode(bytes));
                setRecords(parsed.records);
                setHeaders(parsed.headers);
                setFilename(file.name);
                setHash(
                  [
                    ...new Uint8Array(
                      await crypto.subtle.digest("SHA-256", bytes),
                    ),
                  ]
                    .map((n) => n.toString(16).padStart(2, "0"))
                    .join(""),
                );
                setMapping(
                  Object.fromEntries(
                    ["external_id", "tenant_name", "amount"].map((k) => [
                      k,
                      parsed.headers.find((h) => h.toLowerCase() === k) || "",
                    ]),
                  ),
                );
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "CSV could not be read",
                );
              }
            }}
          />
        </label>
      </div>
      {records.length > 0 && (
        <>
          <p>
            {filename} · {records.length} rows
          </p>
          <div className="form-grid">
            {[
              ["external_id", "Tenant external ID"],
              ["tenant_name", "Tenant name"],
              ["amount", "Signed balance"],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <select
                  value={mapping[key] || ""}
                  onChange={(e) => {
                    setMapping((v) => ({ ...v, [key]: e.target.value }));
                    setReview(null);
                    setStaged(null);
                  }}
                >
                  <option value="">Choose column</option>
                  {headers.map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <Button
            variant="outline"
            disabled={
              !property ||
              !namespace.trim() ||
              Object.values(mapping).filter(Boolean).length !== 3
            }
            onClick={async () => {
              setError("");
              setBusy(true);
              try {
                const rows = records.map((r, i) => {
                  if (
                    !r[mapping.external_id]?.trim() ||
                    !r[mapping.tenant_name]?.trim()
                  )
                    throw new Error(
                      `Row ${i + 2}: external ID and tenant name required.`,
                    );
                  return {
                    external_id: r[mapping.external_id].trim(),
                    tenant_name: r[mapping.tenant_name].trim(),
                    tenant_id: matches[r[mapping.external_id].trim()] || null,
                    property_id: property,
                    amount: parseAmount(r[mapping.amount] || ""),
                  };
                });
                const resolved = await api("/api/imports", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "resolve",
                    source_namespace: namespace.trim(),
                    rows,
                  }),
                });
                const known = Object.fromEntries(
                  resolved.data.map(
                    (r: { external_id: string; tenant_id: string | null }) => [
                      r.external_id,
                      r.tenant_id || "",
                    ],
                  ),
                );
                setMatches(known);
                setReview(
                  rows.map((r) => ({
                    ...r,
                    tenant_id: known[r.external_id] || null,
                  })),
                );
                setStaged(null);
                setConfirmed(false);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Invalid CSV");
              } finally {
                setBusy(false);
              }
            }}
          >
            Review rows
          </Button>
        </>
      )}
      {review && (
        <>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>External ID</th>
                  <th>Tenant from CSV</th>
                  <th>Match or create</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {review.map((r, i) => (
                  <tr key={i}>
                    <td>{r.external_id}</td>
                    <td>{r.tenant_name}</td>
                    <td>
                      <select
                        aria-label={`Tenant match row ${i + 1}`}
                        value={matches[r.external_id] || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setMatches((v) => ({ ...v, [r.external_id]: value }));
                          setReview((v) =>
                            v!.map((row) =>
                              row.external_id === r.external_id
                                ? { ...row, tenant_id: value || null }
                                : row,
                            ),
                          );
                          setStaged(null);
                          setConfirmed(false);
                        }}
                      >
                        <option value="">
                          Use saved external-ID mapping, otherwise create tenant
                        </option>
                        {tenants.map((t) => (
                          <option value={t.id} key={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{money(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Gross debit:{" "}
            {money(review.reduce((s, r) => s + Math.max(r.amount, 0), 0))} ·
            Credits:{" "}
            {money(
              review.reduce((s, r) => s + Math.abs(Math.min(r.amount, 0)), 0),
            )}
          </p>
          <label className="customise-row">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            I have reviewed the source, date, property, tenant matches and
            totals.
          </label>
          <Button
            disabled={!confirmed || busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const stage = await api("/api/imports", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: filename,
                    source_namespace: namespace.trim(),
                    source_hash: hash,
                    as_of: asOf,
                    rows: review,
                  }),
                });
                if (stage.data.status === "applied") {
                  setMessage(
                    "This file was already imported. No duplicate data was created.",
                  );
                  setReview(null);
                } else {
                  setStaged(stage.data);
                  setMessage(
                    "Review saved. Select Apply import to create the finalised snapshot.",
                  );
                }
              } catch (e) {
                setError(e instanceof Error ? e.message : "Staging failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            Stage reviewed import
          </Button>
          {staged && (
            <Button
              disabled={busy || !confirmed}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await api("/api/imports", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "apply",
                      id: staged.id,
                      version: staged.version,
                      confirmed: true,
                    }),
                  });
                  setMessage(
                    "Import applied. The financial snapshot is finalised.",
                  );
                  setReview(null);
                  setStaged(null);
                  setRev((v) => v + 1);
                  onChanged();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Import failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Apply import
            </Button>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <h3>Recent imports</h3>
      {history.length ? (
        history.map((h) => (
          <div className="live-summary-row" key={h.id}>
            <span>
              {h.name}
              <small className="record-notes">
                {h.source_namespace} · {h.as_of}
              </small>
            </span>
            <span className="badge">{h.status}</span>
          </div>
        ))
      ) : (
        <p className="muted-note">No imports yet.</p>
      )}
    </section>
  );
}
