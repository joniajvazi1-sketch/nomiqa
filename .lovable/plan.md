

# Fix Missing Globe Heatmap + Bad Quality Ratings

## Problems Found

**1. Tiles invisible — z-fighting with cloud layer**
The coverage tiles are placed at radius `1.52` (line 76), which is the exact same radius as the cloud mesh (line 243). The clouds render on top and hide the tiles entirely.

**2. Quality always "weak" — relative scoring is broken**
The quality tier uses `cell.count / maxCount` (line 65). If one city has 5,000 data points and most have 50, nearly everything scores near zero → "weak." The actual `intensity` field from the edge function (signal strength) is ignored entirely.

**3. Camera starts at z=50, maxDistance=6**
The initial camera position is `z=50` (line 353) for non-personal view, but `maxDistance` on OrbitControls is `6`. The camera snaps from 50→6 on first frame, causing a jarring jump.

## Plan

### File: `src/components/app/NetworkGlobe.tsx`

| Change | Details |
|--------|---------|
| Move tiles above cloud layer | Change tile radius from `1.52` to `1.535` — above clouds (1.52) but below atmosphere (1.55) |
| Use actual signal intensity for quality | Replace `cell.count / maxCount` with `cell.intensity` which already contains normalized signal strength (0-1) from the edge function |
| Fix camera start position | Change `initialCameraZ` from `50` to `3.5` so it doesn't snap/jump on load |
| Increase tile base size | Bump minimum tile size from `0.025` to `0.035` so tiles are more visible on mobile's small globe |
| Increase disc opacity | Raise from `0.85` to `0.95` for better visibility |

### Result
- Tiles visible above the cloud layer, no z-fighting
- Quality tiers reflect actual signal strength (O2 Germany = strong signal → green tiles)
- Smooth camera entry, no snap from z=50

