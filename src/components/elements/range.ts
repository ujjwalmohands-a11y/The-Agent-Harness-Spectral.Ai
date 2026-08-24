export function take<T>(arr: readonly T[], n: number): T[] {
  return arr.slice(0, Math.max(0, n));
}
