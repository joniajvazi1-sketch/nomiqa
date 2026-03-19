

# Fix Globe Heatmap — Sync Rotation and Optimize Rendering

## Root Cause of Glitching
The Earth and coverage tiles rotate **independently** in separate `useFrame` loops (both at `0.0003/frame`). Since they're in different `<group>` elements, floating-point drift causes the tiles to visually desync from the globe surface over time — they jitter and slide.

Additionally, rendering up to **500 individual `<CoverageTile>` React components** (each with its own mesh, glow ring, and click target) is expensive and causes frame drops on mobile.

## Plan

### 1. Unify rotation — put tiles inside the Earth group
- Remove the independent `useFrame` rotation from `CoverageTiles` (line 244-246)
- Instead, make `CoverageTiles` a child of the Earth `<group>` so they rotate together automatically
- This requires restructuring `GlobeScene` to nest `CoverageTiles` inside `Earth`

### 2. Use InstancedMesh for tile rendering
- Replace 500 individual `<mesh>` components with a single `THREE.InstancedMesh`
- Set per-instance color and transform via matrices — one draw call instead of 500+
- Keep the click/tooltip logic via raycasting on the instanced mesh

### 3. Remove duplicate glow meshes
- Each tile currently renders 3 meshes (disc + glow ring + invisible click target = 1500 meshes for 500 tiles)
- With instanced rendering, use 1 InstancedMesh for discs + 1 for glow = 2 draw calls total

### File: `src/components/app/NetworkGlobe.tsx`

| Change | Why |
|--------|-----|
| Refactor `Earth` to accept children, render tiles inside its rotating group | Eliminates rotation desync |
| Replace `CoverageTile` loop with `InstancedMesh` for discs and glow rings | 2 draw calls instead of 1500 meshes |
| Keep tooltip via raycasting `instanceId` on click | Preserves interactivity |
| Remove independent `useFrame` from `CoverageTiles` | No more drift |

