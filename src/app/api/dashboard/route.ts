import { authenticatedClient } from "@/lib/supabase/server";
export async function GET() {
  const auth = await authenticatedClient();
  if (!auth)
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  const { data, error } = await auth.client.rpc("workspace_summary");
  return error
    ? Response.json(
        { error: "Dashboard unavailable. Please retry." },
        { status: 500 },
      )
    : Response.json(
        { data },
        { headers: { "Cache-Control": "private, no-store" } },
      );
}
