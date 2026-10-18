import { sameOrigin, publicOrigin } from "@/lib/request-security";
import { createClient } from "@/lib/supabase/server";
import { invitedOwnerEmail } from "@/lib/auth-flow";
import { z } from "zod";
const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
const unavailable = () =>
  json(
    {
      error:
        "Sign-in is not available on this deployment. Please use https://notara-mjwdashboard.vercel.app/login or try again shortly.",
    },
    503,
  );
export async function GET() {
  try {
    const client = await createClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return json({ signedIn: false });
    const { data, error } = await client.rpc("account_setup_required");
    if (error) return unavailable();
    if (data === null)
      return json({ error: "This account has not been invited." }, 403);
    return json({
      signedIn: true,
      setupRequired: data === true,
      email: user.email,
    });
  } catch {
    return unavailable();
  }
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return json({ error: "Invalid request origin" }, 403);
  const parsed = z
    .object({
      mode: z.enum(["signin", "first", "signout", "recover", "update"]),
      email: z.email().optional(),
      password: z.string().min(1).max(128).optional(),
    })
    .strict()
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return json({ error: "Check the email address and required fields." }, 400);
  try {
    const client = await createClient();
    const { mode, password } = parsed.data;
    const email = parsed.data.email?.trim().toLowerCase();
    if (mode === "signout") {
      const { error } = await client.auth.signOut();
      return error
        ? json({ error: "Sign-out failed. Please retry." }, 400)
        : json({ ok: true });
    }
    if (mode === "first" || mode === "recover") {
      if (email !== invitedOwnerEmail)
        return json(
          {
            error:
              "This workspace is invitation only. Use your invited Notara account.",
          },
          403,
        );
      const callback = new URL("/auth/callback", publicOrigin(request));
      if (mode === "recover")
        callback.searchParams.set("next", "/login?recovery=1");
      const { error } = await client.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: mode === "first",
          emailRedirectTo: callback.toString(),
        },
      });
      if (error) {
        if (error.status === 429 || error.code?.includes("rate_limit"))
          return json(
            {
              error:
                "Please wait a minute before requesting another sign-in email. Check your inbox and spam folder.",
            },
            429,
          );
        return json(
          {
            error:
              "The sign-in email could not be sent. Please try again shortly. If it persists, email delivery needs attention.",
          },
          400,
        );
      }
      return json({ ok: true, sent: true });
    }
    if (mode === "update") {
      if (!password || password.length < 12)
        return json(
          { error: "Use a password of at least 12 characters." },
          400,
        );
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user)
        return json(
          { error: "Verify your email first. Request a new sign-in link." },
          401,
        );
      const status = await client.rpc("account_setup_required");
      if (status.error) return unavailable();
      if (status.data === null)
        return json({ error: "This account has not been invited." }, 403);
      const { error } = await client.auth.updateUser({ password });
      if (error)
        return json(
          {
            error:
              error.code === "same_password"
                ? "Choose a different password."
                : "Your password could not be saved. Use at least 12 characters and try again.",
          },
          400,
        );
      return json({ ok: true, next: "/" });
    }
    if (!email || !password)
      return json(
        {
          error:
            "Email and password are required. For first access, choose Set up my account.",
        },
        400,
      );
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error)
      return json(
        {
          error:
            "Sign-in failed. If this is your first visit, choose Set up my account to verify your email and create your password.",
        },
        400,
      );
    const status = await client.rpc("account_setup_required");
    if (status.error) return unavailable();
    if (status.data === null) {
      await client.auth.signOut();
      return json({ error: "This account has not been invited." }, 403);
    }
    return json({
      ok: true,
      next: status.data === true ? "/login?setup=1" : "/",
    });
  } catch {
    return unavailable();
  }
}
