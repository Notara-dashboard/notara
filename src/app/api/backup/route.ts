import { authenticatedClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/request-security";
import {
  backupTables,
  backupSchema,
  validateBackupPaths,
  sha256,
} from "@/lib/backup";
import { validFile } from "@/lib/uploads";
import { preferenceSchema } from "@/lib/domain";
import { z } from "zod";
export async function GET(request: Request) {
  const auth = await authenticatedClient();
  if (!auth)
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  const url = new URL(request.url);
  if (url.searchParams.get("snapshot") === "1") {
    const { data, error } = await auth.client.rpc("workspace_backup");
    if (error)
      return Response.json(
        { error: "Snapshot backup unavailable." },
        { status: 500 },
      );
    if (new TextEncoder().encode(JSON.stringify(data)).length > 3 * 1024 * 1024)
      return Response.json(
        { error: "This workspace requires a managed backup." },
        { status: 413 },
      );
    return Response.json(
      { data, owner_id: auth.user.id },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
  const table = url.searchParams.get("table"),
    path = url.searchParams.get("path");
  if (path) {
    if (!path.startsWith(auth.user.id + "/"))
      return Response.json({ error: "Object not found" }, { status: 404 });
    const [docs, versions] = await Promise.all([
      auth.client
        .from("documents")
        .select("id")
        .eq("owner_id", auth.user.id)
        .eq("object_path", path)
        .maybeSingle(),
      auth.client
        .from("document_versions")
        .select("id")
        .eq("owner_id", auth.user.id)
        .eq("object_path", path)
        .maybeSingle(),
    ]);
    if (docs.error || versions.error || (!docs.data && !versions.data))
      return Response.json({ error: "Object not found" }, { status: 404 });
    const { data, error } = await auth.client.storage
      .from("notara-private")
      .createSignedUrl(path, 120);
    return error
      ? Response.json({ error: "Backup download unavailable" }, { status: 500 })
      : Response.json(
          { url: data.signedUrl },
          { headers: { "Cache-Control": "private, no-store" } },
        );
  }
  if (!backupTables.includes(table as (typeof backupTables)[number]))
    return Response.json(
      { error: "Invalid backup collection" },
      { status: 400 },
    );
  const page = Math.max(
    0,
    Math.min(10000, Math.trunc(Number(url.searchParams.get("page")) || 0)),
  );
  const { data, error, count } = await auth.client
    .from(table!)
    .select("*", { count: "exact" })
    .eq("owner_id", auth.user.id)
    .order("id")
    .range(page * 500, page * 500 + 499);
  return error
    ? Response.json({ error: "Backup could not be read." }, { status: 500 })
    : Response.json(
        { data, count, owner_id: auth.user.id },
        { headers: { "Cache-Control": "private, no-store" } },
      );
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const auth = await authenticatedClient();
  if (!auth)
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > 3 * 1024 * 1024)
    return Response.json(
      {
        error:
          "Backup metadata exceeds 3 MB. Contact support for a managed restore.",
      },
      { status: 413 },
    );
  const input = z
    .object({
      backup: backupSchema,
      paths: z.record(z.string(), z.string()),
      confirmed: z.literal(true),
    })
    .strict()
    .safeParse(
      (() => {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      })(),
    );
  if (!input.success)
    return Response.json(
      { error: "Invalid backup manifest." },
      { status: 400 },
    );
  const { backup, paths } = input.data;
  try {
    validateBackupPaths(backup);
    for (const pref of backup.tables.user_preferences)
      preferenceSchema.parse(pref.value);
    for (const table of backupTables) {
      if (table === "user_preferences" || table === "audit_events") continue;
      for (const row of backup.tables[table]) {
        z.uuid().parse(row.id);
        if ("archived_at" in row && row.archived_at !== null)
          z.iso.datetime({ offset: true }).parse(row.archived_at);
      }
    }
    const payload = structuredClone(backup.tables);
    for (const file of backup.files) {
      const destination = paths[file.path];
      if (
        !destination?.startsWith(auth.user.id + "/") ||
        destination.split("/").length !== 3
      )
        throw new Error("Invalid restored object path.");
      const { data, error } = await auth.client.storage
        .from("notara-private")
        .download(destination);
      if (error || !data) throw new Error("A restored file is missing.");
      const bytes = new Uint8Array(await data.arrayBuffer());
      if (
        bytes.length !== file.size ||
        !validFile(bytes, file.type) ||
        (await sha256(bytes)) !== file.sha256
      )
        throw new Error("A restored file failed its integrity check.");
    }
    for (const table of ["documents", "document_versions"] as const)
      for (const row of payload[table])
        row.object_path = paths[String(row.object_path)];
    const { error } = await auth.client.rpc("restore_workspace", { payload });
    if (error) throw new Error(error.message);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Restore failed. No database rows were committed.",
      },
      { status: 400 },
    );
  }
}
