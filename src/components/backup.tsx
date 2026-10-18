"use client";
import { useState } from "react";
import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate";
import {
  backupSchema,
  maxBackupBytes,
  sha256,
  validateBackupPaths,
} from "@/lib/backup";
import type { z } from "zod";
import { api } from "./record-list";
import { Button } from "./ui/button";
type Backup = z.infer<typeof backupSchema>;
export function BackupControls() {
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [pending, setPending] = useState<{
      manifest: Backup;
      files: Record<string, Uint8Array>;
    } | null>(null),
    [confirmed, setConfirmed] = useState(false);
  return (
    <section className="panel live-panel">
      <h2>Backup and recovery</h2>
      <p className="muted-note">
        Download records and private file versions together. Keep the backup in
        a trusted location. Restores are transactional and require an empty
        workspace.
      </p>
      <p className="muted-note">
        Up to 100 MB of files and 3 MB of records per backup. Previous audit
        history is included for reference; recovery creates fresh audit entries.
      </p>
      <Button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            setStatus("Creating a consistent database snapshot…");
            const snapshot = await api("/api/backup?snapshot=1");
            const tables: Record<string, Record<string, unknown>[]> =
              snapshot.data;
            const owner = snapshot.owner_id;
            const objects: Record<string, Uint8Array> = {},
              files: Backup["files"] = [];
            let total = 0;
            for (const row of [
              ...tables.documents,
              ...tables.document_versions,
            ]) {
              const path = String(row.object_path);
              if (files.some((f) => f.path === path)) continue;
              total += Number(row.size_bytes);
              if (total > maxBackupBytes)
                throw new Error(
                  "Backup files exceed 100 MB. Contact support for a managed backup.",
                );
              setStatus(`Backing up document ${files.length + 1}…`);
              const signed = await api(
                  "/api/backup?path=" + encodeURIComponent(path),
                ),
                response = await fetch(signed.url);
              if (!response.ok)
                throw new Error("An attachment could not be backed up.");
              const bytes = new Uint8Array(await response.arrayBuffer()),
                hash = await sha256(bytes),
                entry = "objects/" + hash;
              objects[entry] = bytes;
              files.push({
                path,
                entry,
                sha256: hash,
                type: String(row.content_type),
                size: bytes.length,
              });
            }
            const manifest = backupSchema.parse({
              format: "notara-backup",
              version: 1,
              created_at: new Date().toISOString(),
              owner_id: owner,
              tables,
              files,
            });
            objects["manifest.json"] = strToU8(JSON.stringify(manifest));
            if (objects["manifest.json"].length > 3 * 1024 * 1024)
              throw new Error(
                "Backup metadata exceeds the self-service restore limit. Contact support for a managed backup.",
              );
            const archive = zipSync(objects, { level: 0 }),
              url = URL.createObjectURL(
                new Blob([new Uint8Array(archive)], {
                  type: "application/zip",
                }),
              );
            const a = document.createElement("a");
            a.href = url;
            a.download =
              "notara-backup-" + new Date().toISOString().slice(0, 10) + ".zip";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            setStatus(
              "Backup downloaded. It includes all listed records and document versions.",
            );
          } catch (e) {
            setError(e instanceof Error ? e.message : "Backup failed");
            setStatus("");
          } finally {
            setBusy(false);
          }
        }}
      >
        Download workspace backup
      </Button>
      <label className="field-label">
        Restore backup
        <input
          type="file"
          accept=".zip,application/zip"
          disabled={busy}
          onChange={async (e) => {
            setError("");
            setPending(null);
            setConfirmed(false);
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              if (file.size > maxBackupBytes + 4 * 1024 * 1024)
                throw new Error("Backup exceeds 104 MB.");
              let size = 0,
                count = 0;
              const files = unzipSync(
                new Uint8Array(await file.arrayBuffer()),
                {
                  filter: (entry) => {
                    size += entry.originalSize;
                    count++;
                    if (
                      size > maxBackupBytes + 3 * 1024 * 1024 ||
                      entry.originalSize > maxBackupBytes ||
                      count > 2001
                    )
                      throw new Error(
                        "Backup expands beyond the allowed size.",
                      );
                    return true;
                  },
                },
              );
              if (
                !files["manifest.json"] ||
                files["manifest.json"].length > 3 * 1024 * 1024
              )
                throw new Error("Backup manifest is missing or too large.");
              const manifest = backupSchema.parse(
                JSON.parse(strFromU8(files["manifest.json"])),
              );
              validateBackupPaths(manifest);
              for (const f of manifest.files)
                if (
                  !files[f.entry] ||
                  files[f.entry].length !== f.size ||
                  (await sha256(files[f.entry])) !== f.sha256
                )
                  throw new Error(
                    "Backup has a missing or changed attachment.",
                  );
              setPending({ manifest, files });
              setStatus(
                `Backup from ${manifest.created_at}: ${Object.values(manifest.tables).reduce((n, r) => n + r.length, 0)} records and ${manifest.files.length} files.`,
              );
            } catch (e) {
              setError(e instanceof Error ? e.message : "Invalid backup");
            }
          }}
        />
      </label>
      {pending && (
        <>
          <label className="customise-row">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Restore this reviewed backup into my empty workspace.
          </label>
          <Button
            disabled={!confirmed || busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              const paths: Record<string, string> = {};
              try {
                const existing = await api("/api/backup?table=properties");
                if (existing.count > 0)
                  throw new Error("Restore requires an empty workspace.");
                const { createClient } = await import("@supabase/supabase-js");
                const bucket = createClient(
                  process.env.NEXT_PUBLIC_SUPABASE_URL!,
                  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
                  { auth: { persistSession: false, autoRefreshToken: false } },
                ).storage.from("notara-private");
                for (const file of pending.manifest.files) {
                  setStatus(
                    `Restoring file ${Object.keys(paths).length + 1} of ${pending.manifest.files.length}…`,
                  );
                  const init = await api("/api/documents/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "init",
                      name: file.path.split("/").pop(),
                      type: file.type,
                      size: file.size,
                    }),
                  });
                  paths[file.path] = init.path;
                  const { error } = await bucket.uploadToSignedUrl(
                    init.path,
                    init.token,
                    new Blob([new Uint8Array(pending.files[file.entry])], {
                      type: file.type,
                    }),
                    { contentType: file.type },
                  );
                  if (error)
                    throw new Error(
                      "A restored attachment could not be uploaded.",
                    );
                }
                setStatus("Restoring database records…");
                await api("/api/backup", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    backup: pending.manifest,
                    paths,
                    confirmed: true,
                  }),
                });
                setStatus(
                  "Restore completed. Refresh your workspace to see the recovered records.",
                );
                setPending(null);
              } catch (e) {
                for (const path of Object.values(paths)) {
                  try {
                    await api("/api/documents/upload", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "cleanup", path }),
                    });
                  } catch {
                    /* Retry cleanup when the connection is restored. */
                  }
                }
                setError(e instanceof Error ? e.message : "Restore failed");
                setStatus("");
              } finally {
                setBusy(false);
              }
            }}
          >
            Restore backup
          </Button>
        </>
      )}
      {status && <p role="status">{status}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
