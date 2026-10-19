import test from "node:test";
import assert from "node:assert/strict";
import {
  readCollectionCSV,
  validateCollectionRow,
} from "../src/lib/collection-import.ts";
const id = "11111111-1111-4111-8111-111111111111";
test("imports map source headings and preserve multiline meeting notes", () => {
  const result = readCollectionCSV(
    "meetings",
    'Title,When,Notes,consent\nReview,2026-10-19T09:00:00+02:00,"First line\nSecond line",not_recording',
    { Title: "name", When: "starts_at" },
  );
  assert.equal(result.rows[0].values.notes, "First line\nSecond line");
  assert.equal(
    validateCollectionRow("meetings", result.rows[0].values).consent,
    "not_recording",
  );
});
test("updates require a valid version, unique ID, and retain omitted fields", () => {
  assert.throws(() => readCollectionCSV("actions", `id,name\n${id},Changed`));
  assert.throws(() =>
    readCollectionCSV("actions", `id,version,name\n${id},1,A\n${id},1,B`),
  );
  assert.deepEqual(
    readCollectionCSV("actions", `id,version,name\n${id},1,Changed`).rows[0]
      .values,
    { name: "Changed" },
  );
});
test("CSV round trips numeric credits, formulas and unrecognized columns safely", () => {
  const row = readCollectionCSV(
    "arrears_balances",
    `name,amount,owner_id\n'=SUM(A1),'-100.25,forged`,
  ).rows[0];
  assert.equal(row.values.name, "=SUM(A1)");
  assert.equal(row.values.amount, -100.25);
  assert.equal(row.values.owner_id, undefined);
  assert.throws(() => readCollectionCSV("actions", "name,name\nA,B"));
  assert.throws(() =>
    readCollectionCSV("actions", "name\n" + Array(501).fill("A").join("\n")),
  );
});
test("new capture validates dates, complete source reports, and safe source links", () => {
  assert.throws(() =>
    validateCollectionRow("general_notes", {
      name: "Note",
      note_date: "2026-02-30",
    }),
  );
  assert.throws(() =>
    validateCollectionRow("references", {
      name: "Source",
      source_url: "javascript:alert(1)",
    }),
  );
  const report = {
    name: "Weekly report",
    property_id: id,
    start_date: "2026-10-19",
    end_date: "2026-10-25",
    status: "draft",
    findings: "a".repeat(12000),
  };
  assert.equal(
    validateCollectionRow("security_reports", report).findings.length,
    12000,
  );
  assert.throws(() =>
    validateCollectionRow("security_reports", {
      ...report,
      end_date: "2026-10-18",
    }),
  );
  assert.throws(() =>
    validateCollectionRow("security_reports", { ...report, owner_id: id }),
  );
});
