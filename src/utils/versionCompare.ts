/**
 * Compare two semver strings (e.g. "1.0.2" vs "1.0.1")
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

/**
 * Check if the given version meets the minimum requirement
 */
export function meetsMinVersion(current: string, minimum: string): boolean {
  return compareSemver(current, minimum) >= 0;
}
