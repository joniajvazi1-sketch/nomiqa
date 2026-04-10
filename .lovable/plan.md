

# Tighten Privacy Policy for Google Play Resubmission

## Summary
Apply the 3 critical wording fixes identified in the review to eliminate rejection risks, plus add a scope statement and data deletion contact section.

## Changes

### 1. Fix "exact location" wording (Translation key `privacyLegalLocationItem1`)

**Current**: "GPS coordinates — rounded to 4 decimal places (~11 meter precision). We never store your exact location."

**New**: "GPS coordinates — the app may access precise device location data via GPS. Before storage, coordinates are rounded to 4 decimal places (~11 meter precision). We do not retain full precise coordinates in our production datasets."

This matches Google's focus on *access and collection*, not just storage.

### 2. Strengthen background location paragraph (Translation key `privacyLegalLocationWhen2`)

**Current**: Mentions ACCESS_BACKGROUND_LOCATION and capping at 12 samples/hour.

**New**: "Background location is collected only if you explicitly grant background location permission (Android: ACCESS_BACKGROUND_LOCATION; iOS: 'Always' location permission) and enable contribution features that require passive network measurements while the app is not in the foreground. You can disable background collection at any time in the app settings or your device settings. When active, collection is capped at 12 samples per hour to minimize battery impact. A persistent notification is always visible while background collection is running."

### 3. Add scope statement to controller section (Translation key `privacyLegalControllerContent`)

**New**: "This Privacy Policy applies to the Nomiqa mobile application (Android and iOS) and related services operated by Business Unlimited Worldwide Ltd. ('Nomiqa', 'we', 'us'). Business Unlimited Worldwide Ltd. is the data controller for the personal data processed through these services. Contact: privacy@nomiqa-depin.com"

### 4. Add new Section 11: Data Deletion Requests

Add a new `PolicySection` in `LegalPrivacyPolicy.tsx` and corresponding translation keys:

**Title**: "11. How to Request Data Deletion"

**Content**: "You may request deletion of your account and all associated personal data by: (1) Using the in-app delete account function (Settings > Delete Account), (2) Using the in-app delete data function (Settings > Delete Data) to remove contribution data only, or (3) Emailing privacy@nomiqa-depin.com. Requests are processed within 30 days in accordance with GDPR requirements."

### 5. Soften aggregated tiles retention wording (Translation key `privacyLegalLocationRetention2`)

**Current**: "Aggregated and anonymized coverage tiles are retained indefinitely as they contain no personal data."

**New**: "Aggregated and anonymized coverage tiles are retained indefinitely. These tiles cannot be linked back to any individual user or device, as all identifying information is removed during the aggregation process."

## Files Modified

- `src/contexts/TranslationContext.tsx` — Update 4 existing translation keys + add 2 new keys (all 10 languages)
- `src/components/privacy/LegalPrivacyPolicy.tsx` — Add Section 11 (Data Deletion)

