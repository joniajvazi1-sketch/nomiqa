
Root cause (confirmed from current repo state):
- `package.json` still pins a vulnerable override: `overrides.tar = "7.5.3"` (lines 114–117).
- `package-lock.json` is also locked to `node_modules/tar@7.5.3` (around lines 8021–8024).
- Because of this hard pin, `npm audit fix` cannot move to a patched tar version, so the 2 high vulnerabilities remain.

What happened now:
- The recent `git pull` only changed `.lovable/plan.md`; it did not include the dependency fix.
- Your `npm install` faithfully installed what the repo currently declares (`tar@7.5.3`), so audit stayed red.
- The `EBADENGINE` warning is separate (Node 23.9.0 vs package expecting Node 20/22/24 ranges). It is a warning, not the tar vulnerability cause.

Implementation plan:
1. Update dependency overrides in `package.json`
   - Change:
     - `"tar": "7.5.3"` → `"tar": "7.5.13"`
   - Keep `"esbuild": "0.25.1"` as-is.
   - (Optional hardening) also add overrides for other known transitive audit hotspots:
     - `@isaacs/brace-expansion`, `ajv`, `flatted`, `minimatch`, `rollup`.

2. Regenerate lockfiles from clean state
   - Recreate `package-lock.json` after the override update so tar resolves to `7.5.13`.
   - If Bun is used by anyone on the team, regenerate `bun.lock` too so both ecosystems stay aligned.

3. Verify and prevent regression
   - Confirm resolved version: `npm ls tar` should show `7.5.13`.
   - Confirm vulnerability status: `npm audit` should no longer report tar advisories.
   - Confirm app health: `npm run build`.
   - Commit both `package.json` + lockfile changes together so future pulls/install don’t reintroduce `7.5.3`.

Technical notes:
- This is a transitive build-toolchain vulnerability (`@capacitor/cli` dependency path), not app runtime logic.
- Best-practice runtime for consistency is Node 22 LTS (e.g., 22.13+) to remove the engine warning noise and reduce install variability.
