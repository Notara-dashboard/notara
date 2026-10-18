"use client";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { api, RelationField } from "./record-list";
import { maxUploadBytes, uploadTypes } from "@/lib/uploads";
type Document = {
  id: string;
  name: string;
  size_bytes: number;
  created_at: string;
  version: number;
  notes: string;
  property_id: string | null;
  tenant_id: string | null;
  lease_id: string | null;
  meeting_id: string | null;
  archived_at: string | null;
};
type Revision = {
  id: string;
  revision: number;
  name: string;
  size_bytes: number;
  created_at: string;
};
export function Documents() {
  const [rows, setRows] = useState<Document[]>([]),
    [count, setCount] = useState(0),
    [page, setPage] = useState(0),
    [rev, setRev] = useState(0),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [archived, setArchived] = useState(false),
    [editing, setEditing] = useState<Document | null>(null),
    [replacement, setReplacement] = useState<Document | null>(null),
    [message, setMessage] = useState("");
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    api(`/api/documents?page=${page}&archived=${archived ? "1" : "0"}`, {
      signal: c.signal,
    })
      .then((v) => {
        setRows(v.data);
        setCount(v.count);
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [page, rev, archived]);
  return (
    <section className="panel live-panel">
      <h2>Your private documents</h2>
      <p className="muted-note">
        PDF, JPEG, PNG, text and CSV · Up to 20 MB. Previous versions remain
        private. Files are downloaded as attachments and should be treated as
        untrusted content.
      </p>
      {replacement && (
        <p role="status">
          Uploading a new version of {replacement.name}.{" "}
          <Button variant="ghost" onClick={() => setReplacement(null)}>
            Cancel replacement
          </Button>
        </p>
      )}
      <form
        className="record-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          setBusy(true);
          setError("");
          let path = "";
          try {
            const file = new FormData(form).get("file");
            if (
              !(file instanceof File) ||
              file.size < 1 ||
              file.size > maxUploadBytes
            )
              throw new Error("Choose a file between 1 byte and 20 MB.");
            const type = uploadTypes.includes(file.type)
              ? file.type
              : (
                  { csv: "text/csv", txt: "text/plain" } as Record<
                    string,
                    string
                  >
                )[file.name.split(".").pop()?.toLowerCase() || ""] || file.type;
            const signed = await api("/api/documents/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "init",
                name: file.name,
                type,
                size: file.size,
              }),
            });
            path = signed.path;
            const { createClient } = await import("@supabase/supabase-js");
            const client = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
              {
                auth: {
                  persistSession: false,
                  autoRefreshToken: false,
                  detectSessionInUrl: false,
                },
              },
            );
            const { error } = await client.storage
              .from("notara-private")
              .uploadToSignedUrl(path, signed.token, file, {
                contentType: type,
              });
            if (error) throw new Error("Transfer failed. Please retry.");
            await api("/api/documents/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "complete",
                path,
                document_id: replacement?.id,
                version: replacement?.version,
              }),
            });
            setMessage(
              replacement
                ? "New version saved; previous version retained."
                : "Document uploaded.",
            );
            setReplacement(null);
            form.reset();
            setRev((v) => v + 1);
          } catch (e) {
            if (path)
              try {
                await api("/api/documents/upload", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "cleanup", path }),
                });
              } catch {}
            setError(e instanceof Error ? e.message : "Upload failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Choose document
          <input
            name="file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.txt,.csv"
            required
            disabled={busy}
          />
        </label>
        <Button disabled={busy}>
          {busy
            ? "Uploading…"
            : replacement
              ? "Save new version"
              : "Upload document"}
        </Button>
      </form>
      <label className="field-label">
        View
        <select
          value={archived ? "archived" : "active"}
          onChange={(e) => {
            setArchived(e.target.value === "archived");
            setPage(0);
          }}
        >
          <option value="active">Current documents</option>
          <option value="archived">Archived documents</option>
        </select>
      </label>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {loading ? (
        <p role="status">Loading documents…</p>
      ) : !rows.length ? (
        <div className="empty-state">No documents yet.</div>
      ) : (
        rows.map((doc) => (
          <div className="live-summary-row" key={doc.id}>
            <span>
              {doc.name}
              <small className="record-notes">
                {Math.ceil(doc.size_bytes / 1024)} KB · Version {doc.version}
              </small>
            </span>
            <div className="row-buttons">
              <Button variant="outline" onClick={() => setEditing(doc)}>
                Details & history
              </Button>
              {!doc.archived_at && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      location.assign(
                        (await api("/api/documents?id=" + doc.id)).url,
                      );
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : "Download failed",
                      );
                    }
                  }}
                >
                  Download
                </Button>
              )}
            </div>
          </div>
        ))
      )}
      <div className="live-pagination">
        <span>{count} documents</span>
        <Button
          variant="ghost"
          disabled={!page || loading}
          onClick={() => setPage((v) => v - 1)}
        >
          Previous
        </Button>
        <Button
          variant="ghost"
          disabled={(page + 1) * 50 >= count || loading}
          onClick={() => setPage((v) => v + 1)}
        >
          Next
        </Button>
        <Button variant="ghost" onClick={() => setRev((v) => v + 1)}>
          Refresh
        </Button>
      </div>
      <Dialog
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
        title="Document details"
        description="Links, retained history and archival"
        wide
      >
        {editing && (
          <DocumentDetails
            key={editing.id + editing.version}
            document={editing}
            onSaved={() => {
              setEditing(null);
              setRev((v) => v + 1);
            }}
            onReplace={() => {
              setReplacement(editing);
              setEditing(null);
            }}
          />
        )}
      </Dialog>
    </section>
  );
}
function DocumentDetails({
  document: doc,
  onSaved,
  onReplace,
}: {
  document: Document;
  onSaved: () => void;
  onReplace: () => void;
}) {
  const [values, setValues] = useState({
      name: doc.name,
      notes: doc.notes,
      property_id: doc.property_id || "",
      tenant_id: doc.tenant_id || "",
      lease_id: doc.lease_id || "",
      meeting_id: doc.meeting_id || "",
    }),
    [history, setHistory] = useState<Revision[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    api(`/api/documents?id=${doc.id}&history=1`, { signal: c.signal })
      .then((v) => setHistory(v.data))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => c.abort();
  }, [doc.id]);
  async function save(archive?: boolean) {
    setBusy(true);
    setError("");
    try {
      await api("/api/documents/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: doc.id,
          version: doc.version,
          ...(archive !== undefined
            ? { archive }
            : {
                values: {
                  ...values,
                  property_id: values.property_id || null,
                  tenant_id: values.tenant_id || null,
                  lease_id: values.lease_id || null,
                  meeting_id: values.meeting_id || null,
                },
              }),
        }),
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form
        className="record-form"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <label>
          Document name
          <input
            value={values.name}
            maxLength={200}
            required
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          />
        </label>
        <div className="form-grid">
          {[
            ["property_id", "Property", "properties"],
            ["tenant_id", "Tenant", "tenants"],
            ["lease_id", "Lease", "leases"],
            ["meeting_id", "Meeting", "meetings"],
          ].map(([key, label, table]) => (
            <RelationField
              key={key}
              field={{ key, label, relation: table, type: "select" }}
              propertyId={values.property_id}
              value={values[key as keyof typeof values]}
              onChange={(value) => setValues((v) => ({ ...v, [key]: value }))}
            />
          ))}
        </div>
        <label>
          Notes
          <textarea
            value={values.notes}
            rows={3}
            maxLength={5000}
            onChange={(e) =>
              setValues((v) => ({ ...v, notes: e.target.value }))
            }
          />
        </label>
        <p className="muted-note">
          Linking a lease also uses that lease's property and tenant.
        </p>
        {error && <p role="alert">{error}</p>}
        <div className="form-actions">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void save(!doc.archived_at)}
          >
            {doc.archived_at ? "Restore document" : "Archive document"}
          </Button>
          <Button disabled={busy}>{busy ? "Saving…" : "Save details"}</Button>
        </div>
      </form>
      {!doc.archived_at && (
        <Button variant="outline" onClick={onReplace}>
          Upload new version
        </Button>
      )}
      <h3>Previous file versions</h3>
      {history.length ? (
        history.map((v) => (
          <div className="live-summary-row" key={v.id}>
            <span>
              Version {v.revision} · {v.name}
              <small className="record-notes">
                {new Date(v.created_at).toLocaleString("en-ZA", {
                  timeZone: "Africa/Johannesburg",
                })}
              </small>
            </span>
            <Button
              variant="ghost"
              onClick={async () => {
                try {
                  location.assign(
                    (await api(`/api/documents?id=${v.id}&revision=1`)).url,
                  );
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Download failed");
                }
              }}
            >
              Download version
            </Button>
          </div>
        ))
      ) : (
        <p className="muted-note">No previous file versions.</p>
      )}
    </>
  );
}
