"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  Download,
  Archive,
  RotateCcw,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { definitions, type RecordRow, type Field } from "@/lib/domain";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { exportCSV } from "./shared";
import { useWorkspace } from "./workspace";
import { CollectionImport } from "./collection-import";

export async function api(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({
    error: "The server could not complete this request. Please retry.",
  }));
  if (!response.ok) {
    if (response.status === 401)
      throw new Error("Your session has expired. Sign in again.");
    throw new Error(body.error || "Request failed. Please retry.");
  }
  return body;
}
export function RelationField({
  field,
  value,
  onChange,
  propertyId,
}: {
  field: Field;
  value: string;
  onChange: (value: string) => void;
  propertyId: string;
}) {
  const [rows, setRows] = useState<RecordRow[]>([]),
    [search, setSearch] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api(`/api/records/${field.relation}?q=${encodeURIComponent(search)}`, {
        signal: controller.signal,
      })
        .then((v) => {
          setRows(v.data);
          setError("");
        })
        .catch((e) => {
          if (e.name !== "AbortError") setError(e.message);
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [field.relation, search]);
  const choices = rows.filter(
    (r) =>
      (field.key !== "premises_id" || r.property_id === propertyId) &&
      (field.key !== "snapshot_id" || r.status === "draft"),
  );
  return (
    <div className="relation-field">
      <label htmlFor={`relation-${field.key}`}>{field.label}</label>
      <input
        aria-label={`Search ${field.label.toLowerCase()}`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search linked records…"
      />
      <select
        aria-label={field.label}
        id={`relation-${field.key}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
      >
        <option value="">Choose {field.label.toLowerCase()}</option>
        {value && !choices.some((r) => r.id === value) && (
          <option value={value}>Current selection · {value.slice(0, 8)}</option>
        )}
        {choices.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      {error && <span role="alert">{error}</span>}
      <small>Showing up to 50 matches. Type to find another record.</small>
    </div>
  );
}
function RecordForm({
  table,
  record,
  onSaved,
  onCancel,
}: {
  table: string;
  record: RecordRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const def = definitions[table];
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      def.fields.map((f) => {
        const v = record?.[f.key];
        return [
          f.key,
          f.type === "datetime-local" && v
            ? new Date(Date.parse(String(v)) + 7200000)
                .toISOString()
                .slice(0, 16)
            : v == null
              ? f.options?.[0] || ""
              : String(v),
        ];
      }),
    ),
  );
  const [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  return (
    <form
      className="record-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        const payload = Object.fromEntries(
          def.fields.map((f) => {
            const v = values[f.key] || "";
            return [
              f.key,
              f.type === "number"
                ? v === ""
                  ? null
                  : Number(v)
                : f.type === "datetime-local"
                  ? v
                    ? new Date(v + "+02:00").toISOString()
                    : null
                  : f.type === "date" || f.relation
                    ? v || null
                    : v,
            ];
          }),
        );
        try {
          await api(`/api/records/${table}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: record?.id,
              version: record?.version,
              values: payload,
            }),
          });
          onSaved();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Save failed");
        } finally {
          setSaving(false);
        }
      }}
    >
      <div className="form-grid">
        {def.fields.map((field) =>
          field.relation ? (
            <RelationField
              key={field.key}
              field={field}
              value={values[field.key]}
              propertyId={values.property_id}
              onChange={(value) =>
                setValues((v) => ({
                  ...v,
                  [field.key]: value,
                  ...(field.key === "property_id" ? { premises_id: "" } : {}),
                }))
              }
            />
          ) : (
            <label key={field.key}>
              {field.label}
              {field.type === "textarea" ? (
                <textarea
                  rows={3}
                  value={values[field.key]}
                  maxLength={30000}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [field.key]: e.target.value }))
                  }
                />
              ) : field.options ? (
                <select
                  required={field.required}
                  value={values[field.key]}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [field.key]: e.target.value }))
                  }
                >
                  {field.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type || "text"}
                  value={values[field.key]}
                  required={field.required}
                  min={field.type === "number" ? field.min : undefined}
                  step={field.type === "number" ? "0.01" : undefined}
                  maxLength={field.key === "name" ? 160 : 500}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [field.key]: e.target.value }))
                  }
                />
              )}
            </label>
          ),
        )}
      </div>
      {table === "arrears_snapshots" && (
        <p className="muted-note">
          Save a draft first, add balances, then edit and finalise. Finalised
          snapshots and balances cannot be edited or archived.
        </p>
      )}
      {error && (
        <p className="inline-feedback" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button disabled={saving}>
          {saving
            ? "Saving…"
            : record
              ? "Save changes"
              : `Create ${def.singular}`}
        </Button>
      </div>
    </form>
  );
}
export function RecordList({
  table,
  onChange,
}: {
  table: string;
  onChange?: () => void;
}) {
  const { notice, preferences, updatePreferences } = useWorkspace();
  const [rows, setRows] = useState<RecordRow[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(0),
    [query, setQuery] = useState(""),
    [archived, setArchived] = useState(
      preferences.filters[table] === "archived",
    ),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [editing, setEditing] = useState<RecordRow | null | undefined>(),
    [busy, setBusy] = useState(false);
  const [sort, setSort] = useState("newest"),
    [filters, setFilters] = useState<Record<string, string>>({}),
    [exporting, setExporting] = useState(false);
  const [property, setProperty] = useState(""),
    [viewing, setViewing] = useState<RecordRow | null>(null);
  const def = definitions[table];
  const columns = def.fields
    .filter((f) => f.key !== "name" && f.key !== "notes")
    .slice(0, 4);
  const queryString = `archived=${archived ? "1" : "0"}&q=${encodeURIComponent(query)}&sort=${sort}&property=${property}&${new URLSearchParams(Object.fromEntries(Object.entries(filters).map(([k, v]) => ["filter-" + k, v])))}`;
  useEffect(() => {
    setArchived(preferences.filters[table] === "archived");
  }, [preferences.filters, table]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      api(`/api/records/${table}?page=${page}&${queryString}`, {
        signal: controller.signal,
      })
        .then((v) => {
          setRows(v.data);
          setTotal(v.count || 0);
        })
        .catch((e) => {
          if (e.name !== "AbortError") setError(e.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [table, page, queryString, revision]);
  const reload = useCallback(() => {
    setRevision((v) => v + 1);
    onChange?.();
  }, [onChange]);
  async function archive(row: RecordRow) {
    setBusy(true);
    try {
      await api(`/api/records/${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          version: row.version,
          archive: !row.archived_at,
        }),
      });
      notice(row.archived_at ? "Record restored." : "Record archived.");
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel live-records">
      <div className="card-heading">
        <h2>
          {def.label} <span className="badge">{total}</span>
        </h2>
        <Button onClick={() => setEditing(null)}>
          <Plus size={16} />
          New {def.singular}
        </Button>
      </div>
      <div className="live-toolbar">
        <CollectionImport table={table} onChanged={reload} />
        <a
          className="text-link"
          target="_blank"
          rel="noopener noreferrer"
          href={`/print/${table}?${queryString}`}
        >
          Print / Save PDF
        </a>
        {def.fields.some((f) => f.key === "property_id") && (
          <label>
            Building
            <RelationField
              field={{
                key: "building-filter",
                label: "Building",
                relation: "properties",
              }}
              value={property}
              propertyId=""
              onChange={(id) => {
                setProperty(id);
                setPage(0);
              }}
            />
          </label>
        )}
        <label>
          Search
          <input
            type="search"
            value={query}
            placeholder={`Search ${def.label.toLowerCase()}`}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <label>
          View
          <select
            value={archived ? "archived" : "active"}
            onChange={(e) => {
              const value = e.target.value;
              setArchived(value === "archived");
              setPage(0);
              void updatePreferences({
                filters: { ...preferences.filters, [table]: value },
              });
            }}
          >
            <option value="active">Current records</option>
            <option value="archived">Archived records</option>
          </select>
        </label>
        {def.fields
          .filter((f) => f.options)
          .map((f) => (
            <label key={f.key}>
              {f.label}
              <select
                value={filters[f.key] || ""}
                onChange={(e) => {
                  setFilters((v) => ({ ...v, [f.key]: e.target.value }));
                  setPage(0);
                }}
              >
                <option value="">All</option>
                {f.options!.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          ))}
        <label>
          Sort
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(0);
            }}
          >
            <option value="newest">Newest first</option>
            <option value="name">Name A–Z</option>
            <option value="updated">Recently updated</option>
            {table === "actions" && <option value="due">Due date</option>}
          </select>
        </label>
        <Button
          variant="outline"
          onClick={reload}
          aria-label={`Refresh ${def.label}`}
        >
          <RefreshCw size={16} />
        </Button>
        <Button
          variant="outline"
          disabled={loading || !rows.length || exporting}
          onClick={async () => {
            setExporting(true);
            try {
              const all: RecordRow[] = [];
              for (let p = 0; ; p++) {
                const result = await api(
                  `/api/records/${table}?page=${p}&${queryString}`,
                );
                all.push(...result.data);
                if (all.length >= result.count || result.data.length === 0)
                  break;
              }
              exportCSV(table, [
                [
                  "id",
                  "version",
                  ...def.fields.map((f) => f.key),
                  ...def.fields
                    .filter((f) => f.relation)
                    .map((f) => f.key + "_label"),
                ],
                ...all.map((r) => [
                  r.id,
                  r.version,
                  ...def.fields.map((f) => r[f.key]),
                  ...def.fields
                    .filter((f) => f.relation)
                    .map(
                      (f) =>
                        (r._labels as Record<string, string>)?.[f.key] || "",
                    ),
                ]),
              ]);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Export failed");
            } finally {
              setExporting(false);
            }
          }}
        >
          <Download size={16} />
          {exporting ? "Exporting…" : "Export matches"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="inline-feedback">
          {error}{" "}
          <Button variant="ghost" onClick={reload}>
            Retry
          </Button>
          <a className="text-link" href="/login">
            Sign in
          </a>
        </p>
      )}
      {loading ? (
        <div className="empty-state" role="status">
          Loading records…
        </div>
      ) : !rows.length ? (
        <div className="empty-state">
          <h3>
            {query ? "No matches found" : `No ${def.label.toLowerCase()} yet`}
          </h3>
          <p>
            {query
              ? "Try another search."
              : archived
                ? "Archived records will appear here."
                : `Create your first ${def.singular} to get started.`}
          </p>
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                {columns.map((f) => (
                  <th key={f.key}>{f.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <button
                      className="text-link"
                      onClick={() => setViewing(row)}
                    >
                      {row.name}
                    </button>
                    <small className="record-notes">
                      {String(row.notes || "").slice(0, 100)}
                    </small>
                  </td>
                  {columns.map((f) => (
                    <td key={f.key}>
                      {f.relation
                        ? (row._labels as Record<string, string>)?.[f.key] ||
                          "—"
                        : f.type === "datetime-local"
                          ? new Intl.DateTimeFormat("en-ZA", {
                              timeZone: "Africa/Johannesburg",
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(String(row[f.key])))
                          : String(row[f.key] ?? "—")}
                    </td>
                  ))}
                  <td>
                    <div className="row-buttons">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${row.name}`}
                        onClick={() => setEditing(row)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={busy}
                        aria-label={`${row.archived_at ? "Restore" : "Archive"} ${row.name}`}
                        onClick={() => void archive(row)}
                      >
                        {row.archived_at ? (
                          <RotateCcw size={16} />
                        ) : (
                          <Archive size={16} />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="live-pagination">
        <span>
          {total
            ? `${page * 50 + 1}–${Math.min(total, (page + 1) * 50)} of ${total}`
            : "0 records"}
        </span>
        <Button
          variant="ghost"
          aria-label="Previous page"
          disabled={!page || loading}
          onClick={() => setPage((v) => v - 1)}
        >
          <ChevronLeft size={18} />
        </Button>
        <Button
          variant="ghost"
          aria-label="Next page"
          disabled={(page + 1) * 50 >= total || loading}
          onClick={() => setPage((v) => v + 1)}
        >
          <ChevronRight size={18} />
        </Button>
      </div>
      <Dialog
        open={!!viewing}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
        title={viewing?.name || "Record"}
        wide
      >
        {viewing && (
          <>
            <dl className="record-detail">
              {def.fields
                .filter((f) => f.key !== "name")
                .map((f) => (
                  <div key={f.key}>
                    <dt>{f.label}</dt>
                    <dd>
                      {f.key === "source_url" &&
                      /^https?:\/\//.test(String(viewing[f.key])) ? (
                        <a
                          className="text-link"
                          href={String(viewing[f.key])}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open source document →
                        </a>
                      ) : (
                        String(
                          (f.relation
                            ? (viewing._labels as Record<string, string>)?.[
                                f.key
                              ]
                            : viewing[f.key]) ?? "—",
                        )
                      )}
                    </dd>
                  </div>
                ))}
            </dl>
            <a
              className="text-link"
              href={`/print/${table}?id=${viewing.id}&archived=${viewing.archived_at ? "1" : "0"}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Print this record / Save PDF
            </a>
            <Button
              onClick={() => {
                setEditing(viewing);
                setViewing(null);
              }}
            >
              Edit record
            </Button>
          </>
        )}
      </Dialog>
      <Dialog
        open={editing !== undefined}
        onOpenChange={(value) => {
          if (!value) setEditing(undefined);
        }}
        title={`${editing ? "Edit" : "New"} ${def.singular}`}
        description="Saved securely to your account"
        wide
      >
        {editing !== undefined && (
          <RecordForm
            key={editing?.id || "new"}
            table={table}
            record={editing}
            onCancel={() => setEditing(undefined)}
            onSaved={() => {
              setEditing(undefined);
              notice("Record saved.");
              reload();
            }}
          />
        )}
      </Dialog>
    </section>
  );
}
