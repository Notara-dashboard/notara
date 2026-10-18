import { publicOrigin } from "@/lib/request-security";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const url = new URL(request.url),
    code = url.searchParams.get("code"),
    token_hash = url.searchParams.get("token_hash"),
    type = url.searchParams.get("type");
  const client = await createClient();
  const result = code
    ? await client.auth.exchangeCodeForSession(code)
    : token_hash && ["email", "recovery"].includes(type || "")
      ? await client.auth.verifyOtp({
          token_hash,
          type: type as "email" | "recovery",
        })
      : { error: true };
  if (result.error)
    return NextResponse.redirect(
      new URL("/login?error=expired", publicOrigin(request)),
    );
  const next = url.searchParams.get("next");
  return NextResponse.redirect(
    new URL(
      next === "/login?recovery=1" || type === "recovery"
        ? "/login?recovery=1"
        : "/",
      publicOrigin(request),
    ),
  );
}
