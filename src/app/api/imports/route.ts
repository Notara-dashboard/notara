import { authenticatedClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/request-security";
import { batchSchema, importRowSchema } from "@/lib/imports";
import { z } from "zod";
export async function GET() {
  const auth = await authenticatedClient();
  if (!auth)
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  const { data, error } = await auth.client
    .from("import_batches")
    .select(
      "id,name,as_of,source_namespace,status,snapshot_id,version,created_at",
    )
    .eq("owner_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  return error
    ? Response.json({ error: "Import history unavailable" }, { status: 500 })
    : Response.json(
        { data },
        { headers: { "Cache-Control": "private, no-store" } },
      );
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const auth = await authenticatedClient();
  if (!auth)
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (body?.action === "resolve") {
    const parsed = z
      .object({
        action: z.literal("resolve"),
        source_namespace: z.string().trim().min(1).max(80),
        rows: z.array(importRowSchema).min(1).max(2000),
      })
      .strict()
      .safeParse(body);
    if (!parsed.success)
      return Response.json(
        { error: "Invalid rows for matching." },
        { status: 400 },
      );
    const { data, error } = await auth.client.rpc("resolve_import_matches", {
      source_name: parsed.data.source_namespace,
      input_rows: parsed.data.rows,
    });
    return error
      ? Response.json(
          { error: "Tenant matching unavailable." },
          { status: 400 },
        )
      : Response.json({ data });
  }
  if (body?.action === "apply") {
    const parsed = z
      .object({
        action: z.literal("apply"),
        id: z.uuid(),
        version: z.number().int().positive(),
        confirmed: z.literal(true),
      })
      .strict()
      .safeParse(body);
    if (!parsed.success)
      return Response.json(
        { error: "Review and confirm the staged import first." },
        { status: 400 },
      );
    const { data, error } = await auth.client.rpc("apply_arrears_import", {
      batch_id: parsed.data.id,
      expected_version: parsed.data.version,
    });
    if (error)
      return Response.json(
        {
          error:
            error.code === "23505"
              ? "Duplicate tenant/property rows found. Combine them before importing."
              : error.message,
        },
        { status: 400 },
      );
    return Response.json({ snapshot_id: data });
  }
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success)
    return Response.json(
      {
        error: parsed.error.issues
          .map((i) => i.path.join(".") + ": " + i.message)
          .join("; "),
      },
      { status: 400 },
    );
  const keys = parsed.data.rows.map((r) => r.property_id + ":" + r.external_id);
  if (new Set(keys).size !== keys.length)
    return Response.json(
      {
        error:
          "Duplicate property and external ID rows. Combine them before staging.",
      },
      { status: 400 },
    );
  const { data: prior, error: readError } = await auth.client
    .from("import_batches")
    .select("id,status,version,snapshot_id")
    .eq("owner_id", auth.user.id)
    .eq("source_namespace", parsed.data.source_namespace)
    .eq("source_hash", parsed.data.source_hash)
    .maybeSingle();
  if (readError)
    return Response.json(
      { error: "Unable to check for duplicate imports." },
      { status: 500 },
    );
  if (prior) {
    if (prior.status === "applied")
      return Response.json({ data: prior, duplicate: true });
    const { data, error } = await auth.client.rpc("revise_import", {
      batch_id: prior.id,
      expected_version: prior.version,
      review_rows: parsed.data.rows,
      report_date: parsed.data.as_of,
    });
    return error
      ? Response.json(
          { error: "Staged import changed. Reload and review it again." },
          { status: 409 },
        )
      : Response.json({ data });
  }
  const { data, error } = await auth.client
    .from("import_batches")
    .insert({ ...parsed.data, owner_id: auth.user.id })
    .select("id,status,version,snapshot_id")
    .single();
  return error
    ? Response.json(
        { error: "Import could not be staged. Check the data and retry." },
        { status: 400 },
      )
    : Response.json({ data });
}
