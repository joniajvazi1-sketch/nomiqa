

# Fix: Remove Duplicate Translation Keys Causing Build Error

## Root Cause
Lines 1183, 1189, and 1201 in `TranslationContext.tsx` each contain **duplicate language keys** within their inner objects. When the privacy policy translations were updated, the new text was added but the old text was appended rather than replaced. TypeScript strict mode (via SWC/Vite) treats duplicate object literal properties as a fatal error (`TS1117`), which cascades into the `TS1128` error at the closing brace.

## Fix
For each of the three affected lines, remove the trailing old duplicate translations, keeping only the new updated versions:

### Line 1183 (`privacyLegalLocationItem1`)
Remove everything after the first `IT: "..."` entry (the old `ES`, `FR`, `DE`, `RU`, `ZH`, `JA`, `PT`, `AR`, `IT` duplicates at the end of the line).

### Line 1189 (`privacyLegalLocationWhen2`)
Remove everything after the first `IT: "..."` entry (the old `ES`, `FR`, `DE`, `RU`, `ZH`, `JA`, `PT`, `AR`, `IT` duplicates at the end of the line).

### Line 1201 (`privacyLegalLocationRetention2`)
Remove everything after the first `IT: "..."` entry (the old `ES`, `FR`, `DE`, `RU`, `ZH`, `JA`, `PT`, `AR`, `IT` duplicates at the end of the line).

## Files Modified
- `src/contexts/TranslationContext.tsx` — Trim 3 lines to remove duplicate keys

