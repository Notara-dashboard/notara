import { sameOrigin } from "@/lib/request-security";
import { authenticatedClient } from "@/lib/supabase/server";
import { definitions, recordSchema } from "@/lib/domain";
import { z } from "zod";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  const { table } = await params;
  if (!definitions[table])
    return Response.json({ error: "Unknown collection" }, { status: 404 });
  const auth = await authenticatedClient();
  if (!auth)
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  const url = new URL(request.url),
    page = Math.max(
      0,
      Math.min(100000, Number(url.searchParams.get("page")) || 0),
    );
  const sort = url.searchParams.get("sort") || "newest";
  const sortColumn =
    sort === "name"
      ? "name"
      : sort === "updated"
        ? "updated_at"
        : sort === "due" && table === "actions"
          ? "due_date"
          : "created_at";
  let query = auth.client
    .from(table)
    .select("*", { count: "exact" })
    .eq("owner_id", auth.user.id)
    .order(sortColumn, {
      ascending: sort === "name" || sort === "due",
      nullsFirst: false,
    })
    .order("id")
    .range(page * 50, page * 50 + 49);
  if (url.searchParams.get("archived") === "1")
    query = query.not("archived_at", "is", null);
  else query = query.is("archived_at", null);
  const search = url.searchParams.get("q")?.trim().slice(0, 100);
  if (search)
    query = query.ilike("name", `%${search.replace(/[\\%_]/g, "\\$&")}%`);
  for (const field of definitions[table].fields) {
    const value = url.searchParams.get("filter-" + field.key);
    if (value && field.options?.includes(value))
      query = query.eq(field.key, value);
  }
  const property = url.searchParams.get("property");
  const recordId = url.searchParams.get("id");
  if (recordId && z.uuid().safeParse(recordId).success)
    query = query.eq("id", recordId);
  if (
    property &&
    z.uuid().safeParse(property).success &&
    definitions[table].fields.some((f) => f.key === "property_id")
  )
    query = query.eq("property_id", property);
  if (table === "events") {
    const from = url.searchParams.get("from"),
      to = url.searchParams.get("to");
    if (from && z.iso.datetime({ offset: true }).safeParse(from).success)
      query = query.gte("starts_at", from);
    if (to && z.iso.datetime({ offset: true }).safeParse(to).success)
      query = query.lt("starts_at", to);
  }
  const { data, error, count } = await query;
  if (error)
    return Response.json(
      { error: "Records could not be loaded. Please retry." },
      { status: 500 },
    );
  const labels: Record<string, Record<string, string>> = {};
  await Promise.all(
    definitions[table].fields
      .filter((f) => f.relation)
      .map(async (field) => {
        const ids = [
          ...new Set((data || []).map((row) => row[field.key]).filter(Boolean)),
        ];
        if (!ids.length) return;
        const result = await auth.client
          .from(field.relation!)
          .select("id,name")
          .eq("owner_id", auth.user.id)
          .in("id", ids);
        if (!result.error)
          labels[field.key] = Object.fromEntries(
            (result.data || []).map((row) => [row.id, row.name]),
          );
      }),
  );
  return Response.json(
    {
      data: (data || []).map((row) => ({
        ...row,
        _labels: Object.fromEntries(
          Object.entries(labels).map(([key, map]) => [
            key,
            row[key] ? map[row[key]] || "Unavailable record" : "",
          ]),
        ),
      })),
      count,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
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
    return Response.json(
      { error: "Your session expired. Sign in again." },
      { status: 401 },
    );
  const body = await request.json().catch(() => null);
  const envelope = z
    .object({
      id: z.uuid().optional(),
      version: z.number().int().positive().optional(),
      archive: z.boolean().optional(),
      values: z.unknown().optional(),
    })
    .strict()
    .safeParse(body);
  if (!envelope.success)
    return Response.json({ error: "Invalid record request." }, { status: 400 });
  const { id, version, archive, values } = envelope.data;
  if (id && !version)
    return Response.json(
      { error: "Record version required." },
      { status: 400 },
    );
  let payload: Record<string, unknown>;
  if (typeof archive === "boolean" && id)
    payload = { archived_at: archive ? new Date().toISOString() : null };
  else {
    const parsed = recordSchema(table).safeParse(values);
    if (!parsed.success)
      return Response.json(
        {
          error: parsed.error.issues
            .map((v) => `${v.path.join(".")}: ${v.message}`)
            .join("; "),
        },
        { status: 400 },
      );
    payload = parsed.data;
  }
  if (payload.external_id === "") payload.external_id = null;
  const query = id
    ? auth.client
        .from(table)
        .update(payload)
        .eq("owner_id", auth.user.id)
        .eq("id", id)
        .eq("version", version!)
    : auth.client.from(table).insert({ ...payload, owner_id: auth.user.id });
  const { data, error } = await query.select().maybeSingle();
  if (error) {
    const message = [
      "Create a draft and add balances before finalising.",
      "Add at least one balance before finalising.",
    ].includes(error.message)
      ? error.message
      : error.code === "23503"
        ? "A linked record is invalid or belongs to another account."
        : error.code === "23505"
          ? "This record already exists. Use its existing entry."
          : error.code === "23P01"
            ? "This premises already has a lease during those dates."
            : error.message.includes("immutable")
              ? "This financial snapshot is finalised and cannot be changed. Create a new snapshot."
              : error.code === "42501"
                ? "Your account is not authorised for this workspace."
                : "Save failed. Check the fields and try again.";
    return Response.json({ error: message }, { status: 400 });
  }
  if (!data)
    return Response.json(
      {
        error:
          "This record changed on another device. Refresh and review the latest version.",
      },
      { status: 409 },
    );
  return Response.json({ data });
}
