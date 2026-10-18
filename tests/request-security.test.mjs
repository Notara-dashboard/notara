import test from "node:test";
import assert from "node:assert/strict";
import { sameOrigin } from "../src/lib/request-security.ts";
test("accepts actual Host when Next normalises the internal hostname", () => {
  assert.equal(
    sameOrigin(
      new Request("http://localhost:3100/api/auth", {
        headers: { host: "127.0.0.1:3100", origin: "http://127.0.0.1:3100" },
      }),
    ),
    true,
  );
});
test("rejects cross-site, missing, null, and wrong-protocol origins", () => {
  for (const origin of [
    "https://attacker.invalid",
    "null",
    "https://127.0.0.1:3100",
    "",
  ])
    assert.equal(
      sameOrigin(
        new Request("http://localhost:3100/api/auth", {
          headers: { host: "127.0.0.1:3100", ...(origin ? { origin } : {}) },
        }),
      ),
      false,
    );
});
