import { sameOrigin } from "@/lib/request-security";
import { authenticatedClient } from "@/lib/supabase/server";
import { preferenceSchema } from "@/lib/domain";
export async function GET() {
  const auth = await authenticatedClient();
  if (!auth)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const { data, error } = await auth.client
    .from("user_preferences")
    .select("value,version")
    .eq("owner_id", auth.user.id)
    .maybeSingle();
  return error
    ? Response.json({ error: "Preferences unavailable" }, { status: 500 })
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
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const parsed = preferenceSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json({ error: "Invalid preferences" }, { status: 400 });
  const { error } = await auth.client
    .from("user_preferences")
    .upsert(
      { owner_id: auth.user.id, value: parsed.data },
      { onConflict: "owner_id" },
    );
  return error
    ? Response.json(
        { error: "Preferences could not be saved" },
        { status: 400 },
      )
    : Response.json({ ok: true });
}
