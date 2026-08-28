export function diffRenderSize(patch?: string) {
  const size = { characters: patch?.length ?? 0, lines: 0, hunks: 0, large: (patch?.length ?? 0) > 200_000 }
  if (!patch || size.large) return size

  // Bound the scan without splitting or parsing a potentially enormous patch.
  for (let start = 0; start < patch.length; ) {
    const newline = patch.indexOf("\n", start)
    const end = newline === -1 ? patch.length : newline
    size.lines++
    if (patch.startsWith("@@ ", start)) size.hunks++
    size.large = size.lines > 2_000 || size.hunks > 100 || end - start > 4_000
    if (size.large) return size
    start = end + 1
  }
  return size
}
