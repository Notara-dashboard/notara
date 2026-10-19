import test from "node:test";
import assert from "node:assert/strict";
import {
  parseAmount,
  parseImportCSV,
  batchSchema,
} from "../src/lib/imports.ts";
import {
  backupSchema,
  backupTables,
  validateBackupPaths,
  sha256,
} from "../src/lib/backup.ts";
const owner = "11111111-1111-4111-8111-111111111111";
test("import parses currency, credits, grouped and decimal-comma amounts", () => {
  for (const [text, want] of [
    ["R 1,234.50", 1234.5],
    ["(400.25)", -400.25],
    ["100,50", 100.5],
    ["1,234,567", 1234567],
    ["0", 0],
  ])
    assert.equal(parseAmount(text), want);
  for (const text of ["1.234", "1,2,3", "NaN", "Infinity", "1e4", ""])
    assert.throws(() => parseAmount(text));
});
test("CSV preserves quoted fields and refuses duplicate headers, bad rows and oversized inputs", () => {
  const data = parseImportCSV(
    '\ufeffAccount,Name,Balance\r\nA1,"Tenant, Ltd","1,200.00"',
  );
  assert.equal(data.records[0].Name, "Tenant, Ltd");
  assert.throws(() => parseImportCSV("Name,name\na,b"));
  assert.throws(() => parseImportCSV("Name,Amount\na"));
  assert.throws(() =>
    parseImportCSV("Name\n" + Array(2001).fill("a").join("\n")),
  );
  assert.throws(() => parseImportCSV("a".repeat(2 * 1024 * 1024 + 1)));
});
test("staged import requires complete owner-independent review and exact monetary precision", () => {
  const row = {
    external_id: "A1",
    tenant_name: "Tenant",
    tenant_id: null,
    property_id: owner,
    amount: -12.25,
  };
  const batch = {
    name: "October",
    source_namespace: "Ledger",
    source_hash: "a".repeat(64),
    as_of: "2026-10-18",
    rows: [row],
  };
  assert.equal(batchSchema.safeParse(batch).success, true);
  assert.equal(
    batchSchema.safeParse({ ...batch, rows: [{ ...row, amount: 1.234 }] })
      .success,
    false,
  );
  assert.equal(
    batchSchema.safeParse({ ...batch, owner_id: owner }).success,
    false,
  );
});
test("backup validates file completeness, owner isolation and integrity digest", async () => {
  const path = owner + "/22222222-2222-4222-8222-222222222222/test.txt";
  const tables = Object.fromEntries(backupTables.map((t) => [t, []]));
  const hash = await sha256(new TextEncoder().encode("hello"));
  assert.equal(
    hash,
    "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
  );
  const backup = backupSchema.parse({
    format: "notara-backup",
    version: 1,
    created_at: "2026-10-18T10:00:00Z",
    owner_id: owner,
    tables: {
      ...tables,
      documents: [
        { object_path: path, size_bytes: 5, content_type: "text/plain" },
      ],
    },
    files: [
      {
        path,
        entry: "objects/" + hash,
        sha256: hash,
        type: "text/plain",
        size: 5,
      },
    ],
  });
  assert.doesNotThrow(() => validateBackupPaths(backup));
  const legacy = structuredClone(backup);
  delete legacy.tables.general_notes;
  delete legacy.tables.security_reports;
  delete legacy.tables.references;
  assert.deepEqual(backupSchema.parse(legacy).tables.general_notes, []);
  assert.throws(() => validateBackupPaths({ ...backup, files: [] }));
  assert.throws(() =>
    validateBackupPaths({
      ...backup,
      files: [{ ...backup.files[0], path: "another/owner/file" }],
    }),
  );
  assert.throws(() =>
    validateBackupPaths({
      ...backup,
      files: [backup.files[0], backup.files[0]],
    }),
  );
});
