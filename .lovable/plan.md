

# Fix: Apply tar override that didn't persist

## Problem
`package.json` still has `"tar": "7.5.3"` — the previous update was not committed to your repository. The other security overrides are also missing.

## Change

**File: `package.json`** — Replace the `overrides` block:

```json
"overrides": {
  "esbuild": "0.25.1",
  "@isaacs/brace-expansion": ">=5.0.1",
  "ajv": ">=6.14.0",
  "flatted": ">=3.4.2",
  "minimatch": ">=3.1.4",
  "rollup": ">=4.58.1",
  "tar": "7.5.13"
}
```

## After deployment
On your local machine:
```bash
rm -rf node_modules package-lock.json
npm install
npm audit
```

This should clear the 2 remaining high-severity vulnerabilities.

