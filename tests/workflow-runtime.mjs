import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { sha256 } from "../src/lib/backup.ts";
const credentials = JSON.parse(await readFile(process.argv[2], "utf8"));
const base = process.env.NOTARA_TEST_URL || "http://127.0.0.1:3100";
const cookies = new Map();
let checks = 0;
async function api(path, body, status = 200) {
  const res = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: {
      Origin: base,
      Cookie: [...cookies].map(([k, v]) => k + "=" + v).join("; "),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  for (const c of res.headers.getSetCookie()) {
    const p = c.split(";")[0],
      i = p.indexOf("=");
    cookies.set(p.slice(0, i), p.slice(i + 1));
  }
  const data = await res.json();
  assert.equal(res.status, status, path + ": " + JSON.stringify(data));
  checks++;
  return data;
}
await api("/api/auth", { mode: "signin", ...credentials });
const env = Object.fromEntries(
  (await readFile(".env.local", "utf8"))
    .split(/\r?\n/)
    .filter((x) => x.includes("="))
    .map((x) => [x.slice(0, x.indexOf("=")), x.slice(x.indexOf("=") + 1)]),
);
const bucket = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
).storage.from("notara-private");
async function upload(name, bytes, type) {
  const prepared = await api("/api/documents/upload", {
    action: "init",
    name,
    type,
    size: bytes.length,
  });
  const transfer = await bucket.uploadToSignedUrl(
    prepared.path,
    prepared.token,
    new Blob([new Uint8Array(bytes)], { type }),
    { contentType: type },
  );
  assert.equal(transfer.error, null);
  checks++;
  return prepared.path;
}
const backupFile = process.argv[3];
if (process.argv[4] === "restore") {
  const { backup, objects } = JSON.parse(await readFile(backupFile, "utf8"));
  const paths = {};
  for (const f of backup.files)
    paths[f.path] = await upload(
      f.path.split("/").pop(),
      Buffer.from(objects[f.entry], "base64"),
      f.type,
    );
  await api("/api/backup", { backup, paths, confirmed: true });
  const restored = await api("/api/backup?snapshot=1");
  for (const t of [
    "properties",
    "tenants",
    "meetings",
    "communications",
    "document_versions",
    "arrears_balances",
  ])
    assert.equal(restored.data[t].length, backup.tables[t].length, t);
  for (const file of backup.files) {
    const signed = await api(
      "/api/backup?path=" + encodeURIComponent(paths[file.path]),
    );
    const bytes = new Uint8Array(await (await fetch(signed.url)).arrayBuffer());
    assert.equal(await sha256(bytes), file.sha256);
    checks++;
  }
  await api("/api/backup", { backup, paths, confirmed: true }, 400);
  console.log(
    "PASS: " +
      checks +
      " restore HTTP/storage checks including file hashes, history and nonempty protection.",
  );
} else {
  const property = (await api("/api/records/properties")).data[0],
    tenant = (await api("/api/records/tenants")).data[0];
  await api("/api/records/meetings", {
    values: {
      name: "Verified meeting",
      property_id: property.id,
      starts_at: "2026-10-18T12:00:00+02:00",
      consent: "not_recording",
      participants: "Owner",
      notes: "Notes",
      decisions: "Follow up",
    },
  });
  await api("/api/records/communications", {
    values: {
      name: "Verified call",
      property_id: property.id,
      tenant_id: tenant.id,
      channel: "Phone",
      contact: "Tenant",
      occurred_at: "2026-10-18T12:00:00+02:00",
      notes: "Call record",
    },
  });
  const batch = {
    name: "Reviewed CSV",
    source_namespace: "Runtime ledger",
    source_hash: "c".repeat(64),
    as_of: "2026-10-18",
    rows: [
      {
        external_id: "EX001",
        tenant_name: tenant.name,
        tenant_id: tenant.id,
        property_id: property.id,
        amount: 120.25,
      },
    ],
  };
  const staged = await api("/api/imports", batch);
  const id = staged.data.id,
    version = staged.data.version;
  await api("/api/imports", { action: "apply", id, version, confirmed: true });
  await api("/api/imports", { action: "apply", id, version, confirmed: true });
  const duplicate = await api("/api/imports", batch);
  assert.equal(duplicate.duplicate, true);
  checks++;
  const document =
    (await api("/api/documents")).data.find(
      (d) => d.name === "verification.txt",
    ) || (await api("/api/documents")).data[0];
  const path = await upload(
    "replacement.txt",
    new TextEncoder().encode("Verified replacement"),
    "text/plain",
  );
  await api("/api/documents/upload", {
    action: "complete",
    path,
    document_id: document.id,
    version: document.version,
  });
  await api("/api/documents/upload", {
    action: "complete",
    path,
    document_id: document.id,
    version: document.version,
  });
  const history = (await api("/api/documents?id=" + document.id + "&history=1"))
    .data;
  assert.equal(history.length, 1);
  checks++;
  const old = await api("/api/documents?id=" + history[0].id + "&revision=1");
  assert.equal((await fetch(old.url)).status, 200);
  checks++;
  const snapshot = await api("/api/backup?snapshot=1");
  const objects = {},
    files = [];
  for (const row of [
    ...snapshot.data.documents,
    ...snapshot.data.document_versions,
  ]) {
    const signed = await api(
      "/api/backup?path=" + encodeURIComponent(row.object_path),
    );
    const response = await fetch(signed.url);
    assert.equal(response.status, 200);
    const bytes = new Uint8Array(await response.arrayBuffer()),
      hash = await sha256(bytes),
      entry = "objects/" + hash;
    objects[entry] = Buffer.from(bytes).toString("base64");
    files.push({
      path: row.object_path,
      entry,
      sha256: hash,
      type: row.content_type,
      size: bytes.length,
    });
  }
  const backup = {
    format: "notara-backup",
    version: 1,
    created_at: new Date().toISOString(),
    owner_id: snapshot.owner_id,
    tables: snapshot.data,
    files,
  };
  await writeFile(backupFile, JSON.stringify({ backup, objects }));
  await api(
    "/api/backup",
    {
      backup,
      paths: Object.fromEntries(files.map((f) => [f.path, f.path])),
      confirmed: true,
    },
    400,
  );
  console.log(
    "PASS: " +
      checks +
      " workflow HTTP/storage checks; import idempotency, meetings, communications, replacement/history, backup export.",
  );
}
await api("/api/auth", { mode: "signout" });
