
Root cause (confirmed from codebase):
- `package.json` currently forces a vulnerable tar version:
  - `overrides.tar = "7.5.3"`
- `package-lock.json` also resolves `node_modules/tar` to `7.5.3`.
- Since `7.5.3` is inside the vulnerable range (`<=7.5.10`), `npm audit fix` cannot upgrade it while this override is pinned.

Why it keeps happening:
- `npm audit fix` respects your dependency graph and lock/override constraints.
- A hard override to `7.5.3` blocks the patched version, so audit remains red.

Implementation plan:
1. Update `package.json` override:
   - Change `"tar": "7.5.3"` → `"tar": "7.5.13"` (or `"^7.5.11"`).
2. Regenerate install state so lockfile picks it up:
   - remove `node_modules` and `package-lock.json`
   - run `npm install`
3. Verify:
   - `npm ls tar` should show `7.5.13`
   - `npm audit` should clear the tar advisory
   - `npm run build` to confirm no functional regression

Safety:
- This is a build-tool chain fix (`@capacitor/cli` transitive dependency), not app runtime logic.
- Pinning patched `tar` is the safest deterministic path; avoid `npm audit fix --force`.
