import fs from "node:fs";
import assert from "node:assert/strict";
const c = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const base = process.env.NOTARA_TEST_URL || "http://127.0.0.1:3100";
const jar = new Map();
let checks = 0;
async function req(path, body, status = 200, origin = base) {
  const r = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: {
      Origin: origin,
      Cookie: [...jar].map(([k, v]) => k + "=" + v).join("; "),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  for (const cookie of r.headers.getSetCookie()) {
    const [pair] = cookie.split(";"),
      index = pair.indexOf("=");
    jar.set(pair.slice(0, index), pair.slice(index + 1));
  }
  const raw = await r.text();
  assert.equal(r.status, status, path + ": " + raw.slice(0, 300));
  checks++;
  return r.headers.get("content-type")?.includes("application/json")
    ? JSON.parse(raw)
    : raw;
}
await req("/api/records/security_reports", undefined, 401);
await req("/api/auth", {
  mode: "signin",
  email: c.email,
  password: c.password,
});
const create = async (table, values) =>
  (await req("/api/records/" + table, { values })).data;
const p = await create("properties", {
  name: "Runtime capture building " + Date.now(),
  category: "active",
});
const note = await create("general_notes", {
  name: "Runtime general note",
  property_id: p.id,
  note_date: "2026-10-19",
  topic: "Inspection",
  notes: "Two lines\nwith context.",
});
const report = await create("security_reports", {
  name: "Runtime weekly security",
  property_id: p.id,
  start_date: "2026-10-19",
  end_date: "2026-10-25",
  status: "draft",
  findings: "Findings ".repeat(1500),
});
const meeting = await create("meetings", {
  name: "Runtime meeting",
  property_id: p.id,
  starts_at: "2026-10-19T09:00:00+02:00",
  consent: "not_recording",
  notes: "Meeting notes",
  decisions: "Agreed follow-up",
});
await create("actions", {
  name: "Runtime meeting action",
  property_id: p.id,
  meeting_id: meeting.id,
  priority: "High",
  status: "open",
});
await req(
  "/api/records/security_reports",
  {
    values: {
      name: "Bad dates",
      property_id: p.id,
      start_date: "2026-10-25",
      end_date: "2026-10-19",
      status: "draft",
    },
  },
  400,
);
const source = await create("references", {
  name: "Runtime source",
  property_id: p.id,
  source_url: "https://example.com/source",
  source_date: "2026-10-04",
});
const csv = `name,Property,note_date,notes\n"CSV review note","${p.name}",2026-10-19,"A multiline\nCSV note"`;
const request = { text: csv, request_id: crypto.randomUUID() };
let preview = await req("/api/collection-import/general_notes", request);
assert.equal(preview.creates, 1);
checks++;
assert.equal(
  (
    await req("/api/collection-import/general_notes", {
      ...request,
      apply: true,
    })
  ).applied,
  1,
);
checks++;
await req("/api/collection-import/general_notes", { ...request, apply: true });
let notes = (await req("/api/records/general_notes?property=" + p.id)).data;
assert.equal(notes.length, 2);
assert.equal(notes.find((r) => r.name === "CSV review note").property_id, p.id);
checks += 2;
const update = {
  text: `id,version,name\n${note.id},1,Updated note`,
  request_id: crypto.randomUUID(),
};
assert.equal(
  (await req("/api/collection-import/general_notes", update)).updates,
  1,
);
checks++;
await req("/api/collection-import/general_notes", { ...update, apply: true });
notes = (await req("/api/records/general_notes?property=" + p.id)).data;
assert.equal(
  notes.find((r) => r.id === note.id).notes,
  "Two lines\nwith context.",
);
checks++;
await req(
  "/api/collection-import/general_notes",
  { ...update, request_id: crypto.randomUUID(), apply: true },
  400,
);
await req(
  "/api/collection-import/general_notes",
  request,
  403,
  "https://untrusted.invalid",
);
await req(
  "/api/collection-import/references",
  {
    text: "name,source_url\nBad,javascript:alert(1)",
    request_id: crypto.randomUUID(),
  },
  400,
);
await req(
  "/api/collection-import/documents",
  { text: "name\nMissing file", request_id: crypto.randomUUID() },
  400,
);
assert.equal(
  (await req("/api/records/security_reports?property=" + p.id)).count,
  1,
);
checks++;
assert.equal((await req("/api/records/general_notes?id=" + note.id)).count, 1);
checks++;
for (const table of [
  "general_notes",
  "security_reports",
  "meetings",
  "actions",
  "references",
  "documents",
]) {
  const html = await req("/print/" + table);
  assert.ok(html.includes("Print / Save PDF"));
  checks++;
}
for (const module of [
  "notes",
  "security",
  "meetings",
  "actions",
  "documents",
]) {
  const html = await req("/" + module);
  assert.ok(!html.includes("Application error"));
  checks++;
}
console.log(
  JSON.stringify({
    checks,
    status: "PASS",
    isolated_owner: c.id,
    records: {
      property: p.id,
      note: note.id,
      report: report.id,
      source: source.id,
    },
  }),
);
