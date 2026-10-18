import { authenticatedClient } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const auth = await authenticatedClient();
  if (!auth)
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  const page = Math.max(
    0,
    Math.min(
      10000,
      Math.trunc(Number(new URL(request.url).searchParams.get("page")) || 0),
    ),
  );
  const { data, error, count } = await auth.client
    .from("audit_events")
    .select("id,table_name,record_id,operation,changed_fields,occurred_at", {
      count: "exact",
    })
    .eq("owner_id", auth.user.id)
    .order("occurred_at", { ascending: false })
    .order("id", { ascending: false })
    .range(page * 50, page * 50 + 49);
  return error
    ? Response.json({ error: "History unavailable" }, { status: 500 })
    : Response.json(
        { data, count },
        { headers: { "Cache-Control": "private, no-store" } },
      );
}
