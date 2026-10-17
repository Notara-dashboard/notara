import test from "node:test";
import assert from "node:assert/strict";
import {
  properties,
  tenants,
  portfolio,
  meetings,
  modules,
  sampleActions,
  exposure,
} from "../src/lib/data.ts";

test("dashboard excludes the oversight property and reconciles occupancy", () => {
  assert.equal(portfolio.properties, 3);
  assert.equal(portfolio.units, 54);
  assert.equal(portfolio.occupied, 50);
  assert.equal(
    ((portfolio.occupied / portfolio.units) * 100).toFixed(1),
    "92.6",
  );
  assert.equal(properties.find((p) => p.status === "Oversight only").units, 16);
});
test("gross debit is not reduced by the sample credit and matches the latest trend", () => {
  assert.equal(portfolio.debit, 66250);
  assert.equal(tenants.find((t) => t.balance < 0).balance, -4500);
  assert.notEqual(portfolio.debit, 61750);
  assert.equal(exposure.at(-1).debit * 1000, portfolio.debit);
  assert.equal(
    (
      ((exposure.at(-2).debit - exposure.at(-1).debit) /
        exposure.at(-2).debit) *
      100
    ).toFixed(1),
    "11.1",
  );
});
test("navigation covers thirteen unique working modules", () => {
  assert.equal(modules.length, 13);
  assert.equal(new Set(modules.map((m) => m.id)).size, 13);
});
test("sample tenant and action relationships point at known compatible properties", () => {
  for (const t of tenants)
    assert.ok(properties.some((p) => p.name === t.property));
  for (const a of sampleActions) {
    assert.ok(properties.some((p) => p.name === a.property));
    if (a.tenant)
      assert.equal(
        tenants.find((t) => t.name === a.tenant)?.property,
        a.property,
      );
  }
  assert.equal(
    new Set(
      [...properties, ...tenants, ...sampleActions, ...meetings].map(
        (r) => r.id,
      ),
    ).size,
    properties.length + tenants.length + sampleActions.length + meetings.length,
  );
});
