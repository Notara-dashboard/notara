import { authenticatedClient } from "@/lib/supabase/server";
import { today } from "@/lib/domain";
export async function GET(request: Request) {
  const auth = await authenticatedClient();
  if (!auth)
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  const period =
    new URL(request.url).searchParams.get("period") || today().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))
    return Response.json({ error: "Invalid reporting month" }, { status: 400 });
  const { data, error } = await auth.client.rpc("portfolio_insights", {
    report_month: period + "-01",
  });
  return error
    ? Response.json(
        { error: "Insights unavailable. Please retry." },
        { status: 500 },
      )
    : Response.json(
        { data },
        { headers: { "Cache-Control": "private, no-store" } },
      );
}
