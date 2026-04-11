

# Plan: Optimize Edge Function Costs (Data Pipeline Untouched)

## What stays untouched
- `sync-contribution-data` — the telemetry ingestion pipeline (B2B data source)
- `export-coverage-data` — B2B data export
- All materialized views (`coverage_tiles`, `carrier_benchmarks`, etc.)
- All `signal_logs` writes and validation logic

## Optimizations

### 1. Add client-side caching to `get-contribution-stats` (high impact)
Currently called on every AppHome sync AND every AppProfile mount with zero client caching. Each call makes 5 DB queries (points, affiliate, monthly status, rank, weekly sessions).

**Fix**: Add a 2-minute `sessionStorage` cache in `useNetworkContribution.ts` and `AppProfile.tsx` — skip the edge function call if fresh data exists. The function itself stays unchanged.

### 2. Add client-side caching to `get-global-coverage` (high impact)
Called every time AppMap or NetworkDashboard mounts — each call queries `signal_logs`, `coverage_tiles`, and `profiles` with exact counts. The server has a 5-min in-memory cache, but Deno isolates cold-start frequently, so the cache is rarely warm.

**Fix**: Cache the response in `sessionStorage` for 5 minutes inside `useGlobalCoverage.ts`. Already done for `LiveNetworkStats` — replicate the same pattern.

### 3. Extend `LiveNetworkStats` client cache from 20min → 30min
Already well-cached. Extending TTL is low-risk since the underlying data changes slowly.

### 4. Add `stale-while-revalidate` pattern to `get-contribution-stats`
On AppHome, show cached stats immediately, then refresh in the background. Eliminates perceived latency and prevents redundant calls when users tab-switch.

### 5. Deduplicate `get-contribution-stats` calls on AppHome
`useNetworkContribution` calls it after every sync, AND pull-to-refresh triggers the same. Add a debounce/dedup guard so it fires at most once per 60 seconds.

## Files modified
- `src/hooks/useNetworkContribution.ts` — add sessionStorage cache + 60s dedup for stats fetch
- `src/hooks/useGlobalCoverage.ts` — add 5-min sessionStorage cache
- `src/components/LiveNetworkStats.tsx` — bump cache TTL to 30 min
- `src/pages/app/AppProfile.tsx` — read cached stats before calling edge function

## Estimated savings
These are the highest-frequency edge functions after `sync-contribution-data`. Client caching alone should reduce invocations by ~60-70% for `get-contribution-stats` and `get-global-coverage`, with zero impact on data quality or B2B pipeline.

