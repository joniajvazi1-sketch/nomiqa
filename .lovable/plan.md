

# Fix Coverage Insights Showing "Poor" — Filter by User's Country

## Problem
The QoE scores ("HD Streaming", "Video Calls", etc.) average speeds across **all carriers globally** — including low-speed carriers from developing regions. So even if you're on O2 in Germany with great speeds, the global average drags everything to "Poor/Fair."

The carrier_benchmarks query (line 277) has no country filter, and the profile query (line 205) doesn't fetch `country_code`.

## Changes — `src/pages/app/AppHome.tsx`

### 1. Fetch user's country from profile (line 205)
Add `country_code` to the profiles_safe select query so we know the user's country.

### 2. Store country in state
Add a `userCountry` state variable and set it from the profile response.

### 3. Filter carrier_benchmarks by country (line 277)
When `userCountry` is available, add `.eq('country_code', userCountry)` to the carrier_benchmarks query. This ensures we only show carriers and calculate QoE from the user's country — where their actual network operates.

### 4. Fallback
If no country-specific data exists (no rows returned), fall back to the global query so the section isn't empty.

## Result
- O2 in Germany will show QoE based on German carrier averages (high speeds → "Excellent"/"Good")
- Top Carriers list will show German carriers, not random global ones
- Section becomes actually useful and personalized

## File Changed (1)

| File | Change |
|------|--------|
| `src/pages/app/AppHome.tsx` | Add `country_code` to profile select, store in state, filter carrier_benchmarks by user country with global fallback |

