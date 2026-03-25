
Goal: remove the remaining `tar` vulnerability safely via code/config only (no risky broad upgrades).

What I found
1. `package.json` currently pins:
   - `"overrides": { "tar": "7.5.3" }`
2. `package-lock.json` confirms installed:
   - `node_modules/tar` = `7.5.3`
3. Your audit warning targets `tar <= 7.5.10`, so the override is forcing a vulnerable version.  
   This is why `npm audit fix` cannot resolve it.

Implementation plan
1. Update `package.json` override for `tar`
   - Replace `"tar": "7.5.3"` with a patched pin, e.g. `"tar": "7.5.13"` (or at minimum `>=7.5.11`).
   - Keep using overrides (safe, controlled, no forced major jumps).

2. Regenerate lockfile to apply override cleanly
   - Reinstall dependencies so `package-lock.json` is rewritten with patched `tar`.

3. Validate resolution
   - Re-run `npm audit` and confirm `tar` advisory is gone.
   - Run `npm run build` to confirm no functional regression.

Safety rationale
- This only affects a transitive build-time dependency (`@capacitor/cli` chain), not app runtime logic.
- Pinning exact patched `tar` is the safest deterministic fix and avoids `npm audit fix --force`.
