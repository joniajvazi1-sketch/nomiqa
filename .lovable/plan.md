

# Fix NPM Audit Vulnerabilities via package.json Overrides

## Approach

Use npm `overrides` in `package.json` to pin vulnerable transitive dependencies to patched versions. This is the safest approach — no manual `npm audit fix`, no risk of unexpected major version bumps.

## Current State

`package.json` already has an `overrides` section with `esbuild` and `tar` pinned. We'll update `tar` and add the remaining vulnerable packages.

## Changes

**File: `package.json`** — Update the `overrides` section:

```json
"overrides": {
  "esbuild": "0.25.1",
  "@isaacs/brace-expansion": ">=5.0.1",
  "ajv": ">=6.14.0",
  "flatted": ">=3.4.2",
  "minimatch": ">=3.1.4",
  "rollup": ">=4.58.1",
  "tar": ">=7.5.11"
}
```

**Version targets** (based on the advisory fix ranges):
- `@isaacs/brace-expansion` ≥5.0.1 — fixes Uncontrolled Resource Consumption
- `ajv` ≥6.14.0 — fixes ReDoS with `$data`
- `flatted` ≥3.4.2 — fixes unbounded recursion DoS and prototype pollution
- `minimatch` ≥3.1.4 — fixes multiple ReDoS vulnerabilities
- `rollup` ≥4.58.1 — fixes arbitrary file write via path traversal
- `tar` ≥7.5.11 — fixes hardlink/symlink path traversal (updated from current 7.5.3)

**Note on lodash:** Lodash 4.17.21 is the latest 4.x release and the vulnerability has no fix within that major version. Since it's only used by build tooling (not shipped to users), it poses zero runtime risk. Adding an override would require lodash 5.x which doesn't exist yet.

After this change, delete `node_modules` and `package-lock.json`, then run `npm install` to regenerate the lock file with patched versions.

