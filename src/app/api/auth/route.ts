import { sameOrigin, publicOrigin } from "@/lib/request-security";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const parsed = z
    .object({
      mode: z.enum(["signin", "signup", "signout", "recover", "update"]),
      email: z.email().optional(),
      password: z.string().min(1).max(128).optional(),
      code: z.string().optional(),
    })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json(
      {
        error: "Enter a valid email and a password of at least 12 characters.",
      },
      { status: 400 },
    );
  const client = await createClient(),
    { mode, email, password } = parsed.data;
  if (
    (mode === "signup" || mode === "update") &&
    (!password || password.length < 12)
  )
    return Response.json(
      { error: "Use a password of at least 12 characters." },
      { status: 400 },
    );
  let error;
  if (mode === "signout") ({ error } = await client.auth.signOut());
  else if (mode === "recover" && email)
    ({ error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${publicOrigin(request)}/auth/callback?next=/login?recovery=1`,
    }));
  else if (mode === "update" && password) {
    const { data } = await client.auth.getUser();
    if (!data.user)
      return Response.json(
        { error: "Recovery session expired. Request another recovery email." },
        { status: 401 },
      );
    ({ error } = await client.auth.updateUser({ password }));
  } else if (email && password) {
    if (mode === "signup")
      ({ error } = await client.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${publicOrigin(request)}/auth/callback` },
      }));
    else
      ({ error } = await client.auth.signInWithPassword({ email, password }));
  } else
    return Response.json(
      { error: "Email and password required." },
      { status: 400 },
    );
  if (error)
    return Response.json(
      {
        error:
          mode === "signin"
            ? "Sign-in failed. Check your credentials and confirm your email."
            : mode === "signup"
              ? "Account creation failed. This workspace is invitation only; contact the owner."
              : error.message,
      },
      { status: 400 },
    );
  return Response.json({ ok: true });
}
