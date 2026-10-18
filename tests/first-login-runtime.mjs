import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const c = JSON.parse(await readFile(process.argv[2], "utf8"));
const base = process.env.NOTARA_TEST_URL || "http://127.0.0.1:3100";
const jar = new Map();
let checks = 0;
async function req(path, body, status = 200) {
  const response = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: {
      Origin: base,
      Cookie: [...jar].map(([k, v]) => k + "=" + v).join("; "),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  for (const x of response.headers.getSetCookie()) {
    const p = x.split(";")[0],
      i = p.indexOf("=");
    jar.set(p.slice(0, i), p.slice(i + 1));
  }
  const accepted = (Array.isArray(status) ? status : [status]).includes(
    response.status,
  );
  assert.ok(
    accepted,
    path +
      ": " +
      (accepted ? "" : (await response.clone().text()).slice(0, 300)),
  );
  checks++;
  return response;
}
assert.equal((await (await req("/api/auth")).json()).signedIn, false);
await req("/api/auth", { mode: "update", password: c.password }, 401);
await req(
  "/api/auth",
  { mode: "first", email: "uninvited@example.invalid" },
  403,
);
const callback = await req(
  "/auth/callback?token_hash=" + c.token_hash + "&type=signup",
  undefined,
  307,
);
assert.ok(
  callback.headers.get("location").endsWith("/login?setup=1"),
  "first verification must require password setup",
);
checks++;
let status = await (await req("/api/auth")).json();
assert.equal(status.setupRequired, true);
checks++;
const gate = await req("/", undefined, [200, 307]);
const gateHtml = await gate.text();
assert.ok(
  (gate.headers.get("location") || gateHtml).includes("/login?setup=1"),
);
assert.ok(!gateHtml.includes("YOUR DAILY OVERVIEW"));
checks++;
await req("/api/auth", { mode: "update", password: "short" }, 400);
await req("/api/auth", { mode: "update", password: c.password });
status = await (await req("/api/auth")).json();
assert.equal(status.setupRequired, false);
checks++;
await req("/api/dashboard");
await req("/api/auth", { mode: "signout" });
assert.equal((await (await req("/api/auth")).json()).signedIn, false);
checks++;
await req("/api/auth", {
  mode: "signin",
  email: c.email,
  password: c.password,
});
assert.equal((await (await req("/api/auth")).json()).setupRequired, false);
checks++;
await req("/api/auth", { mode: "signout" });
const replay = await req(
  "/auth/callback?token_hash=" + c.token_hash + "&type=signup",
  undefined,
  307,
);
assert.ok(replay.headers.get("location").endsWith("/login?error=expired"));
checks++;
console.log(
  "PASS: " +
    checks +
    " first-login HTTP checks; verified email, required password, session persistence, password sign-in and one-time link replay denial.",
);
