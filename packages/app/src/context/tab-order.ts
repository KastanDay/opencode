export function insertAfterUnique<T>(
  items: readonly T[],
  next: T,
  after: T | undefined,
  same: (left: T, right: T) => boolean,
): T[] {
  if (items.some((item) => same(item, next))) return [...items]
  const index = after ? items.findIndex((item) => same(item, after)) : -1
  if (index === -1) return [...items, next]
  return [...items.slice(0, index + 1), next, ...items.slice(index + 1)]
}
