

# Redesign "Network Intelligence" to Feel Like Analytics, Not Surveillance

## Problem
The current section has several elements that feel like real-time people monitoring:
- **"Network Intelligence"** title with a pulsing green "live" dot — sounds like a surveillance dashboard
- **"Live Activity Feed"** with a red pulsing dot showing individual measurements with country flags, carrier names, and "2m ago" timestamps — looks like tracking specific people in real-time
- **"Recent Activity"** label reinforces the impression of watching user actions

## Redesign

### Rename and reframe
- **"Network Intelligence"** → **"Coverage Insights"** (analytical, not surveillance)
- Remove the pulsing green dot from the header (no "live monitoring" vibe)
- **"Quality of Experience"** → keep as-is (this part is fine, it's aggregate)
- **"Top Carriers"** → keep as-is (aggregate benchmarks, fine)
- **"Recent Activity"** → **Remove entirely** or replace with **"Network Trends"** showing aggregate stats (e.g. "5G coverage grew 12% this week") instead of individual timestamped entries

### Specific changes

| Element | Current | New |
|---------|---------|-----|
| Section title | "Network Intelligence" + pulsing green dot | "Coverage Insights" — no pulse dot |
| QoE section | Keep | Keep as-is |
| Top Carriers | Keep | Keep — add subtitle "Based on community data" |
| Recent Activity feed | Individual entries with flags, carriers, "now"/"2m" timestamps, red pulse dot | **Remove entirely** — this is the main offender. Replace with a small "Community Stats" row: total samples today, active coverage areas |

### File: `src/pages/app/AppHome.tsx` (lines 1114-1230)
1. Rename header text and remove pulse indicator
2. Add "Based on community data" subtitle under Top Carriers
3. Replace the "Recent Activity" feed (lines 1192-1229) with a simple aggregate stats row showing today's sample count and coverage areas — no individual entries, no timestamps, no "live" indicators

