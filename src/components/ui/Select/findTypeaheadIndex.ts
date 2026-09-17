/** First option whose label starts with `query`, walking from `fromIndex`. */
export function findTypeaheadIndex(
  labels: readonly string[],
  query: string,
  fromIndex = 0,
): number {
  const needle = query.trim().toLocaleLowerCase("uk");
  if (!needle || labels.length === 0) return -1;

  const count = labels.length;
  const start = ((fromIndex % count) + count) % count;

  for (let step = 0; step < count; step += 1) {
    const index = (start + step) % count;
    if (labels[index]!.toLocaleLowerCase("uk").startsWith(needle)) {
      return index;
    }
  }

  return -1;
}

export function isTypeaheadChar(key: string): boolean {
  return key.length === 1 && key !== " " && !/[\p{Cc}\p{Cf}]/u.test(key);
}
