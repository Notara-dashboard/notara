"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { invitedOwnerEmail, readAuthReply } from "@/lib/auth-flow";
type Mode = "first" | "signin" | "recover" | "update";
export default function Login() {
  const [mode, setMode] = useState<Mode>("first"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [sent, setSent] = useState(false),
    [email, setEmail] = useState(invitedOwnerEmail),
    [checking, setChecking] = useState(true),
    [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(location.search);
    const error = params.get("error");
    if (error === "expired")
      setMessage(
        "This sign-in link expired or was already used. Request a new email below.",
      );
    if (error === "denied")
      setMessage("This account has not been invited to the workspace.");
    if (error === "unavailable")
      setMessage("Sign-in is temporarily unavailable. Please retry.");
    (async () => {
      try {
        const data = await readAuthReply(
          await fetch("/api/auth", {
            signal: controller.signal,
            cache: "no-store",
          }),
        );
        if (controller.signal.aborted) return;
        if (data.signedIn) {
          if (data.email) setEmail(data.email);
          if (data.setupRequired || params.has("recovery")) setMode("update");
          else if (!error) location.assign("/");
        } else if (params.has("setup") || params.has("recovery"))
          setMessage(
            "Verify your email to continue. Request a new sign-in link below.",
          );
      } catch (e) {
        if (!controller.signal.aborted)
          setMessage(
            e instanceof Error
              ? e.message
              : "Connection failed. Please try again.",
          );
      } finally {
        if (!controller.signal.aborted) setChecking(false);
      }
    })();
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(
      () => setCooldown((v) => Math.max(0, v - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [cooldown]);
  const changeMode = (value: Mode) => {
    setMode(value);
    setMessage("");
    setSent(false);
  };
  return (
    <main id="main-content" className="login-page">
      <div className="panel login-card">
        <span className="eyebrow">NOTARA · PRIVATE WORKSPACE</span>
        <h1>
          {mode === "update"
            ? "Choose your password"
            : mode === "signin"
              ? "Welcome back."
              : "Welcome to Notara."}
        </h1>
        <p>
          {mode === "update"
            ? "Your email is verified. Set your password to open your workspace."
            : mode === "signin"
              ? "Sign in with the password you created."
              : mode === "recover"
                ? "We’ll email you a secure link to choose a new password."
                : "First visit? Verify your invited email, then create your password. No existing password is needed."}
        </p>
        <form
          className="record-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMessage("");
            const form = new FormData(e.currentTarget);
            const password = String(form.get("password") || "");
            if (
              mode === "update" &&
              password !== String(form.get("confirm") || "")
            ) {
              setMessage("The passwords do not match.");
              setBusy(false);
              return;
            }
            try {
              const data = await readAuthReply(
                await fetch("/api/auth", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    mode,
                    ...(mode === "update" ? {} : { email }),
                    ...(["signin", "update"].includes(mode)
                      ? { password }
                      : {}),
                  }),
                }),
              );
              if (data.next) location.assign(data.next);
              else if (data.sent) {
                setSent(true);
                setCooldown(60);
                setMessage(
                  "Check your email and spam folder. Open the one-time sign-in link in this browser to continue.",
                );
              }
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
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={busy}
              />
            </label>
          )}
          {["signin", "update"].includes(mode) && (
            <label>
              {mode === "update" ? "New password" : "Password"}
              <input
                name="password"
                type="password"
                autoComplete={
                  mode === "update" ? "new-password" : "current-password"
                }
                minLength={mode === "update" ? 12 : 1}
                maxLength={128}
                required
                disabled={busy}
              />
            </label>
          )}
          {mode === "update" && (
            <>
              <label>
                Confirm password
                <input
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                  disabled={busy}
                />
              </label>
              <p className="muted-note">
                Use at least 12 characters. Choose a password you do not use
                elsewhere.
              </p>
            </>
          )}
          <Button
            disabled={
              busy ||
              checking ||
              ((mode === "first" || mode === "recover") && cooldown > 0)
            }
          >
            {busy || checking
              ? "Please wait…"
              : mode === "update"
                ? "Save password and enter"
                : mode === "signin"
                  ? "Sign in"
                  : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : sent
                      ? "Resend sign-in email"
                      : mode === "recover"
                        ? "Send recovery link"
                        : "Email my first sign-in link"}
          </Button>
          {message && (
            <p role="status" aria-live="polite">
              {message}
            </p>
          )}
        </form>
        {message.includes("this address") ||
        message.includes("this deployment") ? (
          <p>
            <a href="https://notara-mjwdashboard.vercel.app/login">
              Open Notara’s production sign-in
            </a>
          </p>
        ) : null}
        {mode !== "update" ? (
          <div className="form-actions">
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => changeMode(mode === "signin" ? "first" : "signin")}
            >
              {mode === "signin"
                ? "Set up my account"
                : "I already have a password"}
            </Button>
            {mode === "signin" && (
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => changeMode("recover")}
              >
                Forgot password
              </Button>
            )}
          </div>
        ) : (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await readAuthReply(
                  await fetch("/api/auth", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mode: "signout" }),
                  }),
                );
                location.assign("/login");
              } catch {
                setMessage("Sign-out failed. Please retry.");
                setBusy(false);
              }
            }}
          >
            Sign out
          </Button>
        )}
      </div>
    </main>
  );
}
