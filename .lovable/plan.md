

# Fix Globe — Make It Visible and Useful

## Root Cause
The globe canvas is crammed into a **220x220px circle** with `overflow-hidden` and `rounded-full`. The stats overlay eats the top 110px. The parent div has `pointerEvents: 'none'`. Result: tiles are clipped away and the globe can't be interacted with.

## Plan

### 1. NetworkGlobe.tsx — Strip overlay, fill the space
- **Remove** the header overlay (stats, legend, disclaimer, privacy text) from inside the globe component — these belong in AppHome, not layered on top of the canvas
- **Remove** the 220x220 circular clip container — let the canvas fill its parent naturally
- **Remove** the `pointer-events-none` wrapper — let users spin/zoom the globe
- Keep the Canvas at full width/height of its container with `alpha: true` for transparent background
- Keep Earth, tiles, OrbitControls, Stars — the 3D scene itself is fine

### 2. AppHome.tsx — Better layout for globe section
- Remove `pointerEvents: 'none'` from the globe section container (line 808) so users can actually interact with the globe
- Move the 3 stats cards (Samples, Areas, Contributors) **below** the globe as a simple row, not overlaid on top
- Add a small "Tap tiles for details" hint below the globe
- Reduce section height from 50vh to ~340px — enough for a visible globe + stats row underneath
- Add a "View Full Map" link to `/app/map` for deeper exploration

### Result
- Globe fills ~250px square, tiles are visible, user can spin/zoom
- Stats displayed cleanly below, not blocking the view
- Interactive — tapping tiles shows signal quality info
- Links to full map for detailed exploration

### Files Changed (2)
| File | Change |
|------|--------|
| `src/components/app/NetworkGlobe.tsx` | Remove overlay UI, remove circular clip, let canvas fill container |
| `src/pages/app/AppHome.tsx` | Fix pointer events, add stats row + map link below globe |

