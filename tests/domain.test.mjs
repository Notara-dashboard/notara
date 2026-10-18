import test from "node:test";
import assert from "node:assert/strict";
import {
  recordSchema,
  preferenceSchema,
  defaultPreferences,
  today,
} from "../src/lib/domain.ts";
import { modules } from "../src/lib/data.ts";
const id = "11111111-1111-4111-8111-111111111111";
const lease = {
  name: "Lease",
  property_id: id,
  premises_id: id,
  tenant_id: id,
  start_date: "2026-10-01",
  end_date: "2027-09-30",
  monthly_rent: 1000,
  notes: "",
};
test("lease validation rejects reversed dates and negative rent", () => {
  assert.equal(recordSchema("leases").safeParse(lease).success, true);
  assert.equal(
    recordSchema("leases").safeParse({ ...lease, end_date: "2026-09-01" })
      .success,
    false,
  );
  assert.equal(
    recordSchema("leases").safeParse({ ...lease, monthly_rent: -1 }).success,
    false,
  );
});
test("calendar rejects reversed events", () => {
  assert.equal(
    recordSchema("events").safeParse({
      name: "Meeting",
      property_id: null,
      starts_at: "2026-10-18T10:00:00+02:00",
      ends_at: "2026-10-18T09:00:00+02:00",
      location: "",
      notes: "",
    }).success,
    false,
  );
});
test("dates reject impossible calendar dates", () => {
  assert.equal(
    recordSchema("leases").safeParse({ ...lease, start_date: "2026-02-30" })
      .success,
    false,
  );
});
test("turnover uses a reporting month and preserves missing versus zero", () => {
  const v = {
    name: "Return",
    requirement_id: id,
    period: "2026-09-01",
    amount: 0,
    notes: "",
  };
  assert.equal(recordSchema("turnover_submissions").safeParse(v).success, true);
  assert.equal(
    recordSchema("turnover_submissions").safeParse({ ...v, amount: null })
      .success,
    false,
  );
  assert.equal(
    recordSchema("turnover_submissions").safeParse({
      ...v,
      period: "2026-09-15",
    }).success,
    false,
  );
});
test("financial balances preserve credits and require finite values", () => {
  const v = {
    name: "Balance",
    snapshot_id: id,
    property_id: id,
    tenant_id: id,
    amount: -400,
    notes: "",
  };
  assert.equal(recordSchema("arrears_balances").parse(v).amount, -400);
  assert.equal(
    recordSchema("arrears_balances").safeParse({ ...v, amount: NaN }).success,
    false,
  );
});
test("mutations reject injected owner and identity fields", () => {
  assert.equal(
    recordSchema("leases").safeParse({ ...lease, owner_id: id }).success,
    false,
  );
  assert.equal(
    recordSchema("leases").safeParse({ ...lease, id }).success,
    false,
  );
});
test("names and email fields are validated", () => {
  assert.equal(
    recordSchema("properties").safeParse({
      name: "   ",
      address: "",
      category: "active",
      property_type: "Commercial",
      notes: "",
    }).success,
    false,
  );
  assert.equal(
    recordSchema("tenants").safeParse({
      name: "Tenant",
      registration: "",
      email: "invalid",
      phone: "",
      external_id: "",
      notes: "",
    }).success,
    false,
  );
});
test("preferences enforce a unique complete widget layout", () => {
  assert.equal(preferenceSchema.safeParse(defaultPreferences).success, true);
  assert.equal(
    preferenceSchema.safeParse({
      ...defaultPreferences,
      widgets: Array(5).fill("brief"),
    }).success,
    false,
  );
});
test("all thirteen areas remain available and dates are SAST business dates", () => {
  assert.equal(new Set(modules.map((m) => m.id)).size, 13);
  assert.match(today(), /^\d{4}-\d{2}-\d{2}$/);
});
