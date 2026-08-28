import { expect, test } from "bun:test"
import { diffRenderSize } from "../../src/feature-plugins/system/diff-viewer-size"

test("counts patch text without counting the trailing newline as another line", () => {
  const patch = "--- a/file\n+++ b/file\n@@ -1 +1 @@\n-old\n+new\n"
  expect(diffRenderSize(patch)).toEqual({ characters: patch.length, lines: 5, hunks: 1, large: false })
  expect(diffRenderSize(patch.slice(0, -1))).toEqual({ characters: patch.length - 1, lines: 5, hunks: 1, large: false })
  expect(diffRenderSize()).toEqual({ characters: 0, lines: 0, hunks: 0, large: false })
  expect(diffRenderSize("").large).toBe(false)
})

test.each([
  { label: "characters", allowed: ("x".repeat(999) + "\n").repeat(200), extra: "x" },
  { label: "lines", allowed: "x\n".repeat(2000), extra: "x\n" },
  { label: "hunks", allowed: "@@ -1 +1 @@\n".repeat(100), extra: "@@ -2 +2 @@\n" },
  { label: "line length", allowed: "x".repeat(4000), extra: "x" },
])("bounds $label before parsing", ({ allowed, extra }) => {
  expect(diffRenderSize(allowed).large).toBe(false)
  expect(diffRenderSize(allowed + extra).large).toBe(true)
})
