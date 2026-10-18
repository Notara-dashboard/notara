import test from "node:test";
import assert from "node:assert/strict";
import { readAuthReply } from "../src/lib/auth-flow.ts";
test("auth responses never expose JSON parsing failures for empty or HTML server errors", async () => {
  for (const body of ["", "<html>Server error</html>", "null", "[]"])
    await assert.rejects(
      readAuthReply(new Response(body, { status: 500 })),
      /Sign-in is temporarily unavailable/,
    );
});
test("auth replies preserve safe service errors and successful navigation", async () => {
  await assert.rejects(
    readAuthReply(
      Response.json({ error: "Verify your email first." }, { status: 401 }),
    ),
    /Verify your email first/,
  );
  assert.deepEqual(
    await readAuthReply(Response.json({ ok: true, next: "/login?setup=1" })),
    { ok: true, next: "/login?setup=1" },
  );
});
