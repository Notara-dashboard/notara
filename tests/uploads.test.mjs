import test from "node:test";
import assert from "node:assert/strict";
import { validFile, safeFilename, maxUploadBytes } from "../src/lib/uploads.ts";
test("file validation rejects fake headers, empty and oversized bodies", () => {
  assert.equal(
    validFile(new TextEncoder().encode("fake PDF"), "application/pdf"),
    false,
  );
  assert.equal(validFile(new Uint8Array(), "text/plain"), false);
  assert.equal(
    validFile(new Uint8Array(maxUploadBytes + 1), "text/plain"),
    false,
  );
  assert.equal(
    validFile(new Uint8Array([137, 80, 78, 71]), "image/png"),
    false,
  );
  assert.equal(validFile(new TextEncoder().encode("text"), "text/plain"), true);
});
test("document filenames cannot supply paths or controls", () => {
  assert.equal(
    safeFilename("../private/secret\u0000.txt"),
    ".._private_secret_.txt",
  );
  assert.equal(safeFilename(""), "document");
});
