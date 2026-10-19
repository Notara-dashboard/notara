"use client";
import { useState } from "react";
import { definitions } from "@/lib/domain";
import { api } from "./record-list";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { exportCSV } from "./shared";
type Preview = {
  creates: number;
  updates: number;
  headers: string[];
  keys: string[];
  preview: { name: string; operation: string }[];
};
export function CollectionImport({
  table,
  onChanged,
}: {
  table: string;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false),
    [text, setText] = useState(""),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [preview, setPreview] = useState<Preview | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [requestId, setRequestId] = useState("");
  const def = definitions[table];
  const [columns, setColumns] = useState<{
    headers: string[];
    keys: string[];
  } | null>(null);
  async function submit(apply = false) {
    setBusy(true);
    setError("");
    try {
      const result = await api(`/api/collection-import/${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mapping, apply, request_id: requestId }),
      });
      if (apply) {
        setText("");
        setPreview(null);
        setOpen(false);
        onChanged();
      } else setPreview(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Import / update CSV
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={`Import ${def.label.toLowerCase()}`}
        description="Preview before applying. Each batch is saved together, with no partial imports."
      >
        <p>
          Save your spreadsheet as CSV. Download the template for new records;
          export existing records and keep id and version to update them. Dates:
          YYYY-MM-DD. Times: ISO with +02:00. Linked records accept exact names
          or IDs. Maximum 500 rows. Empty cells clear a field; omitted columns
          retain existing values on updates.
        </p>
        <Button
          variant="outline"
          onClick={() =>
            exportCSV(`${table}-template`, [
              ["id", "version", ...def.fields.map((f) => f.key)],
            ])
          }
        >
          Download template
        </Button>
        <details>
          <summary>Column guide and allowed values</summary>
          <ul>
            {def.fields.map((f) => (
              <li key={f.key}>
                <strong>{f.key}</strong> · {f.label}
                {f.required ? " (required for new records)" : ""}
                {f.options ? `: ${f.options.join(", ")}` : ""}
                {f.relation
                  ? " · exact name or ID of an existing linked record"
                  : ""}
              </li>
            ))}
          </ul>
        </details>
        <label>
          CSV file
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={busy}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 2 * 1024 * 1024) {
                setError("Split files larger than 2 MB.");
                return;
              }
              const content = await file.text();
              const id = crypto.randomUUID();
              setText(content);
              setRequestId(id);
              setMapping({});
              setPreview(null);
              setColumns(null);
              setError("");
              try {
                setColumns(
                  await api(`/api/collection-import/${table}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      text: content,
                      inspect: true,
                      request_id: id,
                    }),
                  }),
                );
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "File could not be read",
                );
              }
            }}
          />
        </label>
        {columns && (
          <div className="live-form-grid">
            {columns.headers.map((h, i) => (
              <label key={h}>
                {h}
                <select
                  value={mapping[h] ?? columns.keys[i]}
                  onChange={(e) => {
                    setMapping((v) => ({ ...v, [h]: e.target.value }));
                    setPreview(null);
                  }}
                >
                  <option value="">Ignore column</option>
                  {["id", "version", ...def.fields.map((f) => f.key)].map(
                    (k) => (
                      <option key={k}>{k}</option>
                    ),
                  )}
                </select>
              </label>
            ))}
          </div>
        )}
        <Button disabled={!text || busy} onClick={() => void submit()}>
          Preview import
        </Button>
        {preview && (
          <>
            <p>
              {preview.creates} new records · {preview.updates} updates. First
              10 shown.
            </p>
            <ul>
              {preview.preview.map((r, i) => (
                <li key={i}>
                  {r.operation}: {r.name}
                </li>
              ))}
            </ul>
            <Button disabled={busy} onClick={() => void submit(true)}>
              Apply {preview.creates + preview.updates} records
            </Button>
          </>
        )}
        {error && <p role="alert">{error}</p>}
        {busy && <p role="status">Checking records…</p>}
      </Dialog>
    </>
  );
}
