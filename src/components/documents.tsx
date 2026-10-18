"use client";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { api } from "./record-list";
import { maxUploadBytes, uploadTypes } from "@/lib/uploads";
type Document = {
  id: string;
  name: string;
  size_bytes: number;
  created_at: string;
};
export function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]),
    [count, setCount] = useState(0),
    [page, setPage] = useState(0),
    [rev, setRev] = useState(0),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    api(`/api/documents?page=${page}`, { signal: c.signal })
      .then((v) => {
        setDocuments(v.data);
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
  }, [page, rev]);
  return (
    <section className="panel live-panel">
      <h2>Your private documents</h2>
      <p className="muted-note">
        PDF, JPEG, PNG, text and CSV · Maximum 20 MB · Downloads expire after 60
        seconds.
      </p>
      <form
        className="record-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          setBusy(true);
          setError("");
          try {
            const file = new FormData(form).get("file");
            if (
              !(file instanceof File) ||
              file.size > maxUploadBytes ||
              file.size === 0
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
              .uploadToSignedUrl(signed.path, signed.token, file, {
                contentType: type,
              });
            if (error) throw new Error("File transfer failed. Please retry.");
            await api("/api/documents/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "complete", path: signed.path }),
            });
            form.reset();
            setRev((v) => v + 1);
          } catch (e) {
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
          />
        </label>
        <Button disabled={busy}>
          {busy ? "Uploading…" : "Upload document"}
        </Button>
      </form>
      {error && <p role="alert">{error}</p>}
      {loading ? (
        <p role="status">Loading documents…</p>
      ) : !documents.length ? (
        <div className="empty-state">No documents yet.</div>
      ) : (
        documents.map((doc) => (
          <div className="live-summary-row" key={doc.id}>
            <span>
              {doc.name}
              <small className="record-notes">
                {Math.ceil(doc.size_bytes / 1024)} KB
              </small>
            </span>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const data = await api(`/api/documents?id=${doc.id}`);
                  location.assign(data.url);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Download failed");
                }
              }}
            >
              Download
            </Button>
          </div>
        ))
      )}
      <div className="live-pagination">
        <span>{count} documents</span>
        <Button
          variant="ghost"
          disabled={!page}
          onClick={() => setPage((v) => v - 1)}
        >
          Previous
        </Button>
        <Button
          variant="ghost"
          disabled={(page + 1) * 50 >= count}
          onClick={() => setPage((v) => v + 1)}
        >
          Next
        </Button>
        <Button variant="ghost" onClick={() => setRev((v) => v + 1)}>
          Refresh
        </Button>
      </div>
    </section>
  );
}
