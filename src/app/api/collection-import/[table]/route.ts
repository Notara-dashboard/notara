import { sameOrigin } from "@/lib/request-security";
import { authenticatedClient } from "@/lib/supabase/server";
import { definitions } from "@/lib/domain";
import {
  readCollectionCSV,
  validateCollectionRow,
} from "@/lib/collection-import";
import { z } from "zod";
const schema = z
  .object({
    text: z.string().max(2100000),
    mapping: z.record(z.string(), z.string()).default({}),
    inspect: z.boolean().default(false),
    apply: z.boolean().default(false),
    request_id: z.uuid(),
  })
  .strict();
export async function POST(
  request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  if (!sameOrigin(request))
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const { table } = await params;
  if (!definitions[table])
    return Response.json({ error: "Unknown collection" }, { status: 404 });
  const auth = await authenticatedClient();
  if (!auth)
    return Response.json({ error: "Please sign in." }, { status: 401 });
  if (Number(request.headers.get("content-length")) > 2300000)
    return Response.json({ error: "File too large" }, { status: 413 });
  try {
    const body = schema.parse(await request.json());
    const parsed = readCollectionCSV(
      table,
      body.text,
      body.mapping,
      body.inspect,
    );
    if (body.inspect)
      return Response.json({ headers: parsed.headers, keys: parsed.keys });
    if (table === "documents" && parsed.rows.some((r) => !r.id))
      throw new Error(
        "Upload document files first. CSV updates existing document metadata using id and version. Use Source library to import document links.",
      );
    const cache = new Map<string, string>();
    const ids = parsed.rows.flatMap((r) => (r.id ? [r.id] : []));
    const existingRows = new Map<string, Record<string, unknown>>();
    for (let start = 0; start < ids.length; start += 100) {
      const found = await auth.client
        .from(table)
        .select("*")
        .eq("owner_id", auth.user.id)
        .is("archived_at", null)
        .in("id", ids.slice(start, start + 100));
      if (found.error)
        throw new Error("Existing records could not be checked.");
      for (const r of found.data || []) existingRows.set(r.id, r);
    }
    for (const row of parsed.rows)
      if (row.id) {
        const existing = existingRows.get(row.id);
        if (!existing || existing.version !== row.version)
          throw new Error(
            "A record changed or is unavailable. Export again before updating.",
          );
        row.values = Object.fromEntries(
          definitions[table].fields.map((f) => [
            f.key,
            f.key in row.values ? row.values[f.key] : existing[f.key],
          ]),
        );
      }
    // Resolve linked records in bounded groups rather than one request per CSV row.
    await Promise.all(
      definitions[table].fields
        .filter((f) => f.relation)
        .map(async (f) => {
          const values = [
            ...new Set(
              parsed.rows
                .map((r) => r.values[f.key])
                .filter(Boolean)
                .map(String),
            ),
          ];
          for (const byId of [true, false]) {
            const selected = values.filter(
              (v) => z.uuid().safeParse(v).success === byId,
            );
            for (let start = 0; start < selected.length; start += 100) {
              const batch = selected.slice(start, start + 100);
              const found = await auth.client
                .from(f.relation!)
                .select("id,name")
                .eq("owner_id", auth.user.id)
                .is("archived_at", null)
                .in(byId ? "id" : "name", batch)
                .limit(1000);
              if (found.error)
                throw new Error("Linked records could not be checked.");
              for (const value of batch) {
                const matches = (found.data || []).filter(
                  (r) => (byId ? r.id : r.name) === value,
                );
                if (matches.length !== 1)
                  throw new Error(
                    `${f.label}: ${value} must match one existing record by exact name or ID.`,
                  );
                cache.set(f.key + ":" + value, matches[0].id);
              }
            }
          }
        }),
    );
    for (const [i, row] of parsed.rows.entries()) {
      for (const f of definitions[table].fields.filter((f) => f.relation)) {
        const value = row.values[f.key];
        if (!value) continue;
        const key = f.key + ":" + value;
        row.values[f.key] = cache.get(key);
      }
      try {
        row.values = validateCollectionRow(table, row.values);
      } catch (e) {
        throw new Error(
          `Row ${i + 2}: ${e instanceof Error ? e.message : "invalid fields"}`,
        );
      }
    }
    if (body.apply) {
      const result = await auth.client.rpc("import_collection", {
        collection: table,
        input_rows: parsed.rows,
        request_id: body.request_id,
      });
      if (result.error)
        throw new Error(
          "Import was not applied. Check duplicate records, linked fields, dates and record versions, then preview again.",
        );
      return Response.json({ applied: result.data.length });
    }
    return Response.json({
      headers: parsed.headers,
      keys: parsed.keys,
      creates: parsed.rows.filter((r) => !r.id).length,
      updates: parsed.rows.filter((r) => r.id).length,
      preview: parsed.rows
        .slice(0, 10)
        .map((r) => ({
          name: r.values.name,
          operation: r.id ? "Update" : "Create",
        })),
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Import failed" },
      { status: 400 },
    );
  }
}
