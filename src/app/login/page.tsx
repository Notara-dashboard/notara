"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
export default function Login() {
  const [mode, setMode] = useState("signin"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has("recovery")) setMode("update");
    if (params.get("error") === "expired")
      setMessage("This link expired. Request another recovery email.");
    if (params.get("error") === "denied")
      setMessage("This account has not been invited to the workspace.");
  }, []);
  return (
    <main id="main-content" className="login-page">
      <div className="panel login-card">
        <span className="eyebrow">NOTARA · PRIVATE WORKSPACE</span>
        <h1>Your world. Organised.</h1>
        <p>Sign in with your invited account.</p>
        <form
          className="record-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMessage("");
            const form = new FormData(e.currentTarget);
            const recovery = new URLSearchParams(location.search).has(
              "recovery",
            );
            try {
              const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  mode: recovery ? "update" : mode,
                  email: String(form.get("email") || "") || undefined,
                  password: String(form.get("password") || "") || undefined,
                }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              if (mode === "signin" || recovery) location.assign("/");
              else
                setMessage(
                  mode === "recover"
                    ? "If your account exists, check your email for a recovery link."
                    : "Check your email to confirm your account, then sign in.",
                );
            } catch (error) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Connection failed. Please try again.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {mode !== "update" && (
            <label>
              Email
              <input type="email" name="email" autoComplete="email" required />
            </label>
          )}
          {mode !== "recover" && (
            <label>
              {mode === "update" ? "New password" : "Password"}
              <input
                name="password"
                type="password"
                autoComplete={
                  mode === "signup" || mode === "update"
                    ? "new-password"
                    : "current-password"
                }
                minLength={mode === "signin" ? 1 : 12}
                maxLength={128}
                required
              />
            </label>
          )}
          <Button disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in"
                : mode === "recover"
                  ? "Send recovery email"
                  : mode === "update"
                    ? "Save new password"
                    : "Create invited account"}
          </Button>
          <p role="status">{message}</p>
        </form>
        <div className="form-actions">
          <Button
            variant="ghost"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setMessage("");
            }}
          >
            {mode === "signin" ? "First time here?" : "Back to sign in"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setMode("recover");
              setMessage("");
            }}
          >
            Forgot password
          </Button>
        </div>
      </div>
    </main>
  );
}
