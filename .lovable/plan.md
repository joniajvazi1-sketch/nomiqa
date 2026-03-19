

# Soften QoE Section — Rename, Explain Data Source, Clarify It's Not Monitoring

## Problem
The "Quality of Experience" section with labels like "Streaming," "Gaming," "Video Calls" implies we know how the user uses their phone. Users may think we're monitoring their internet activity. In reality, these scores are derived from **average carrier speeds and latency** collected by the community — not from watching what the user does.

## Changes — `src/pages/app/AppHome.tsx` (lines 1127-1155)

1. **Rename heading**: "Quality of Experience" → **"What Your Network Supports"**
2. **Swap icon**: `Tv` → `Sparkles` (friendlier)
3. **Add explainer subtitle** below heading: *"Estimated from average carrier speeds in your area — not from your usage"* — directly tells users this isn't monitoring
4. **Soften labels**:
   - "Streaming" → **"HD Streaming"** (capability, not activity)
   - "Video Calls" → keep
   - "Gaming" → **"Low Latency"** (technical capability)
   - "Browsing" → **"General Use"**

No logic changes — same carrier-average calculations. Pure copy and icon update.

## File Changed (1)

| File | Changes |
|------|---------|
| `src/pages/app/AppHome.tsx` | Rename QoE heading, add data-source subtitle, swap icon, soften labels |

