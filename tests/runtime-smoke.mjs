// Explicitly invoked integration check using an isolated temporary account.
// Its account, owned rows and storage objects must be removed after verification.
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
const credentials = JSON.parse(await readFile(process.argv[2], "utf8"));
const base = process.env.NOTARA_TEST_URL || "http://127.0.0.1:3100";
const cookieJar = new Map();
let checks = 0;
async function request(
  path,
  { method = "GET", body, expected = 200, anonymous = false } = {},
) {
  const headers = { Origin: base };
  if (!anonymous && cookieJar.size)
    headers.Cookie = [...cookieJar].map(([k, v]) => `${k}=${v}`).join("; ");
  if (body && !(body instanceof FormData))
    headers["Content-Type"] = "application/json";
  const res = await fetch(base + path, {
    method,
    headers,
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  for (const cookie of res.headers.getSetCookie()) {
    const pair = cookie.split(";")[0],
      index = pair.indexOf("=");
    cookieJar.set(pair.slice(0, index), pair.slice(index + 1));
  }
  const data = await res.json();
  assert.equal(res.status, expected, `${path}: ${JSON.stringify(data)}`);
  checks++;
  return data;
}
const create = async (table, values) =>
  (await request("/api/records/" + table, { method: "POST", body: { values } }))
    .data;
const edit = async (table, row, values) =>
  (
    await request("/api/records/" + table, {
      method: "POST",
      body: { id: row.id, version: row.version, values },
    })
  ).data;
await request("/api/records/properties", { expected: 401, anonymous: true });
await request("/api/auth", {
  method: "POST",
  body: { mode: "signin", ...credentials },
});
const beforeSummary = (await request("/api/dashboard")).data;
const propValues = {
  name: "Runtime verification property",
  address: "Isolated verification",
  category: "active",
  property_type: "Commercial",
  notes: "",
};
let property = await create("properties", propValues);
const tenant = await create("tenants", {
  name: "Runtime tenant",
  registration: "",
  email: "",
  phone: "",
  external_id: crypto.randomUUID(),
  notes: "",
});
const unit = await create("premises", {
  name: "Runtime unit",
  property_id: property.id,
  area: 50,
  notes: "",
});
await create("contacts", {
  name: "Runtime contact",
  tenant_id: tenant.id,
  email: "",
  phone: "",
  role: "Account contact",
  notes: "",
});
const actionValues = {
  name: "Runtime action",
  property_id: property.id,
  tenant_id: tenant.id,
  due_date: "2026-10-18",
  priority: "High",
  status: "open",
  notes: "",
};
let action = await create("actions", actionValues);
const stale = action;
action = await edit("actions", action, { ...actionValues, status: "done" });
await request("/api/records/actions", {
  method: "POST",
  expected: 409,
  body: { id: stale.id, version: stale.version, values: actionValues },
});
action = await edit("actions", action, actionValues);
action = (
  await request("/api/records/actions", {
    method: "POST",
    body: { id: action.id, version: action.version, archive: true },
  })
).data;
assert.equal(
  (await request("/api/records/actions?archived=1")).data.some(
    (r) => r.id === action.id,
  ),
  true,
);
await request("/api/records/actions", {
  method: "POST",
  body: { id: action.id, version: action.version, archive: false },
});
const day = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Johannesburg",
}).format(new Date());
const end = new Date(Date.parse(day) + 30 * 86400000)
  .toISOString()
  .slice(0, 10);
const leaseValues = {
  name: "Runtime lease",
  property_id: property.id,
  premises_id: unit.id,
  tenant_id: tenant.id,
  start_date: day,
  end_date: end,
  monthly_rent: 1000,
  notes: "",
};
await create("leases", leaseValues);
await request("/api/records/leases", {
  method: "POST",
  body: { values: { ...leaseValues, name: "Overlap rejected" } },
  expected: 400,
});
await create("events", {
  name: "Runtime event",
  property_id: property.id,
  starts_at: day + "T10:00:00+02:00",
  ends_at: day + "T11:00:00+02:00",
  location: "",
  notes: "",
});
const requirement = await create("turnover_requirements", {
  name: "Monthly reporting",
  tenant_id: tenant.id,
  start_date: day.slice(0, 7) + "-01",
  end_date: null,
  notes: "",
});
await create("turnover_submissions", {
  name: "Zero is received",
  requirement_id: requirement.id,
  period: day.slice(0, 7) + "-01",
  amount: 0,
  notes: "",
});
const snapshotValues = {
  name: "Runtime snapshot",
  as_of: day,
  status: "draft",
  notes: "",
};
let snapshot = await create("arrears_snapshots", snapshotValues);
await create("arrears_balances", {
  name: "Debit",
  snapshot_id: snapshot.id,
  property_id: property.id,
  tenant_id: tenant.id,
  amount: 1000,
  notes: "",
});
const creditTenant = await create("tenants", {
  name: "Runtime credit tenant",
  registration: "",
  email: "",
  phone: "",
  external_id: "",
  notes: "",
});
await create("arrears_balances", {
  name: "Credit",
  snapshot_id: snapshot.id,
  property_id: property.id,
  tenant_id: creditTenant.id,
  amount: -400,
  notes: "",
});
snapshot = await edit("arrears_snapshots", snapshot, {
  ...snapshotValues,
  status: "finalised",
});
await request("/api/records/arrears_snapshots", {
  method: "POST",
  expected: 400,
  body: { id: snapshot.id, version: snapshot.version, values: snapshotValues },
});
const summary = (await request("/api/dashboard")).data;
assert.equal(summary.debit, 1000);
assert.equal(summary.credit, 400);
assert.equal(summary.occupied, beforeSummary.occupied + 1);
assert.equal(
  summary.events.some((e) => e.name === "Runtime event"),
  true,
);
property = await edit("properties", property, {
  ...propValues,
  category: "oversight",
});
assert.equal((await request("/api/dashboard")).data.debit, 0);
property = await edit("properties", property, propValues);
const preferences = {
  light: true,
  collapsed: false,
  hidden: [],
  widgets: ["brief", "metrics", "agenda", "portfolio", "communications"],
  filters: { actions: "active" },
};
await request("/api/preferences", { method: "POST", body: preferences });
assert.equal((await request("/api/preferences")).data.value.light, true);
const file = new FormData();
file.append(
  "file",
  new Blob(["Runtime verification document"], { type: "text/plain" }),
  "verification.txt",
);
await request("/api/documents", { method: "POST", body: file });
const docs = (await request("/api/documents")).data;
const doc = docs.find((d) => d.name === "verification.txt");
assert.ok(doc);
const signed = (await request("/api/documents?id=" + doc.id)).url;
const download = await fetch(signed);
assert.equal(download.status, 200);
assert.equal(await download.text(), "Runtime verification document");
checks++;
const unsigned = new URL(signed);
unsigned.pathname = unsigned.pathname.replace(
  "/object/sign/",
  "/object/public/",
);
unsigned.search = "";
assert.notEqual((await fetch(unsigned)).status, 200);
checks++;
const invalidFile = new FormData();
invalidFile.append(
  "file",
  new Blob(["fake PDF"], { type: "application/pdf" }),
  "fake.pdf",
);
await request("/api/documents", {
  method: "POST",
  body: invalidFile,
  expected: 400,
});
const env = Object.fromEntries(
  (await readFile(".env.local", "utf8"))
    .split(/\r?\n/)
    .filter((v) => v.includes("="))
    .map((v) => [v.slice(0, v.indexOf("=")), v.slice(v.indexOf("=") + 1)]),
);
const storage = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
).storage.from("notara-private");
const large = new Blob(["x".repeat(5 * 1024 * 1024)], { type: "text/plain" });
const prepared = await request("/api/documents/upload", {
  method: "POST",
  body: {
    action: "init",
    name: "large-verification.txt",
    size: large.size,
    type: large.type,
  },
});
const transfer = await storage.uploadToSignedUrl(
  prepared.path,
  prepared.token,
  large,
  { contentType: large.type },
);
assert.equal(transfer.error, null);
checks++;
await request("/api/documents/upload", {
  method: "POST",
  body: { action: "complete", path: prepared.path },
});
const insights = (await request("/api/insights?period=" + day.slice(0, 7)))
  .data;
assert.ok(insights.turnover_received >= 1);
assert.ok(insights.returns.some((r) => r.amount === 0));
assert.ok((await request("/api/audit")).count > 0);
assert.ok(
  (
    await request("/api/records/actions?filter-status=open&sort=due")
  ).data.every((r) => r.status === "open"),
);
// A fresh cookie jar proves the records persist across sign-out and sign-in.
await request("/api/auth", { method: "POST", body: { mode: "signout" } });
cookieJar.clear();
await request("/api/records/properties", { expected: 401 });
await request("/api/auth", {
  method: "POST",
  body: { mode: "signin", ...credentials },
});
assert.equal(
  (await request("/api/records/properties")).data.some(
    (r) => r.id === property.id,
  ),
  true,
);
await request("/api/auth", { method: "POST", body: { mode: "signout" } });
console.log(
  `PASS: ${checks} HTTP and storage checks; CRUD, archive/restore, conflict, finance, occupancy, calendar, turnover, preferences, private files, session re-entry.`,
);
