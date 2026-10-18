import { publicOrigin } from "@/lib/request-security";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const url = new URL(request.url),
    origin = publicOrigin(request);
  try {
    const client = await createClient(),
      code = url.searchParams.get("code"),
      token_hash = url.searchParams.get("token_hash"),
      type = url.searchParams.get("type");
    const result = code
      ? await client.auth.exchangeCodeForSession(code)
      : token_hash &&
          ["email", "signup", "invite", "magiclink", "recovery"].includes(
            type || "",
          )
        ? await client.auth.verifyOtp({
            token_hash,
            type: type as
              "email" | "signup" | "invite" | "magiclink" | "recovery",
          })
        : { error: true };
    if (result.error)
      return NextResponse.redirect(new URL("/login?error=expired", origin));
    const status = await client.rpc("account_setup_required");
    if (status.error)
      return NextResponse.redirect(new URL("/login?error=unavailable", origin));
    if (status.data === null) {
      await client.auth.signOut();
      return NextResponse.redirect(new URL("/login?error=denied", origin));
    }
    const recovery =
      type === "recovery" ||
      url.searchParams.get("next") === "/login?recovery=1";
    return NextResponse.redirect(
      new URL(
        recovery
          ? "/login?recovery=1"
          : status.data === true
            ? "/login?setup=1"
            : "/",
        origin,
      ),
    );
  } catch {
    return NextResponse.redirect(new URL("/login?error=unavailable", origin));
  }
}
