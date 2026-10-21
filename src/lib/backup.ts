import { z } from "zod";
export const backupTables = [
  "properties",
  "general_notes",
  "security_reports",
  "references",
  "premises",
  "tenants",
  "contacts",
  "meetings",
  "communications",
  "actions",
  "leases",
  "events",
  "turnover_requirements",
  "turnover_submissions",
  "arrears_snapshots",
  "arrears_balances",
  "documents",
  "document_versions",
  "tenant_external_ids",
  "import_batches",
  "user_preferences",
  "audit_events",
] as const;
export const maxBackupBytes = 100 * 1024 * 1024;
// Keep record transfers below the hosting platform's request/response ceiling.
export const maxBackupRecordBytes = 4 * 1024 * 1024;
export const backupSchema = z
  .object({
    format: z.literal("notara-backup"),
    version: z.literal(1),
    created_at: z.iso.datetime(),
    owner_id: z.uuid(),
    tables: z.preprocess(
      (value) =>
        value && typeof value === "object" && !Array.isArray(value)
          ? {
              general_notes: [],
              security_reports: [],
              references: [],
              ...value,
            }
          : value,
      z.record(
        z.enum(backupTables),
        z.array(z.record(z.string(), z.unknown())).max(10000),
      ),
    ),
    files: z
      .array(
        z
          .object({
            path: z.string().max(500),
            entry: z.string().regex(/^objects\/[a-f0-9]{64}$/),
            sha256: z.string().regex(/^[a-f0-9]{64}$/),
            type: z.string(),
            size: z
              .number()
              .int()
              .positive()
              .max(20 * 1024 * 1024),
          })
          .strict(),
      )
      .max(2000),
  })
  .strict();
export const sha256 = async (bytes: ArrayBuffer | Uint8Array) =>
  [
    ...new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        bytes instanceof Uint8Array ? new Uint8Array(bytes) : bytes,
      ),
    ),
  ]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
export function validateBackupPaths(backup: z.infer<typeof backupSchema>) {
  const names = backup.files.map((f) => f.path);
  if (new Set(names).size !== names.length)
    throw new Error("Duplicate object paths in backup.");
  for (const file of backup.files)
    if (
      !file.path.startsWith(backup.owner_id + "/") ||
      file.path.split("/").length !== 3 ||
      file.entry !== "objects/" + file.sha256
    )
      throw new Error("Backup has an invalid owner path.");
  if (backup.files.reduce((n, f) => n + f.size, 0) > maxBackupBytes)
    throw new Error("Backup files exceed 100 MB.");
  const files = new Map(backup.files.map((f) => [f.path, f]));
  for (const table of ["documents", "document_versions"])
    for (const row of backup.tables[table as "documents"]) {
      const file = files.get(String(row.object_path));
      if (!file) throw new Error("Backup is missing an attached file.");
      if (row.size_bytes !== file.size || row.content_type !== file.type)
        throw new Error("Backup attachment metadata does not match its file.");
    }
}
