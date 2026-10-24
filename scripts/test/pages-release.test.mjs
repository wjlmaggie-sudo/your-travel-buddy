import test from "node:test";
import assert from "node:assert/strict";
import { assertPagesRelease } from "../pages-release.mjs";
const clean = {
  head: "combined-main",
  main: "combined-main",
  dirty: false,
  release: { sourceCommit: "combined-main", dirty: false },
};
test("accepts the clean combined main release", () =>
  assert.doesNotThrow(() => assertPagesRelease(clean)));
test("rejects a stale branch even when its own artifact matches it", () => {
  assert.throws(
    () =>
      assertPagesRelease({
        ...clean,
        head: "older-branch",
        release: { sourceCommit: "older-branch", dirty: false },
      }),
    /current GitHub main/,
  );
});
test("rejects stale, uncommitted or unidentified build artifacts", () => {
  for (const release of [
    undefined,
    { sourceCommit: "previous-main", dirty: false },
    { sourceCommit: "combined-main", dirty: true },
  ])
    assert.throws(() => assertPagesRelease({ ...clean, release }), /Pages build again/);
  assert.throws(() => assertPagesRelease({ ...clean, dirty: true }), /commit your source/);
});
