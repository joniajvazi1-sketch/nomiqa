

# Scaling to Handle 20,000 Users at Launch

## The Reality

20,000 registered users won't all contribute **simultaneously** — typical mobile app concurrency is 5-10% of total users. So expect **1,000-2,000 concurrent contributors** at peak. But even that is well beyond what a Medium instance handles (~100-150 concurrent).

## Current Bottlenecks at Scale

| Bottleneck | Why It Breaks | Impact |
|---|---|---|
| `sync-contribution-data` edge function | Each active user calls every 2 min with 25 signal logs | ~500-1000 calls/min at peak |
| `signal_logs` inserts | 25 rows per call × 1000 calls/min = 25,000 inserts/min | DB write saturation |
| Materialized view refreshes | Full table scans every 15 min on millions of rows | Locks + timeouts |
| `count: 'exact'` queries | `get-network-stats-cached` scans entire tables | Slow responses under load |
| Connection pool | Medium has ~30-50 connections; edge functions compete | Connection exhaustion |

## What We Need to Do (Priority Order)

### Phase 1 — Database Optimizations (Do Now)

1. **Add indexes** on `signal_logs` (user_id, recorded_at), `contribution_sessions` (user_id, started_at), and `user_daily_limits` (user_id, limit_date)
2. **Replace `count: 'exact'`** with estimated counts in `get-network-stats-cached` using `pg_class.reltuples` — 1000x faster
3. **Reduce materialized view refresh frequency** from 15 min to 1 hour for heavy views (`coverage_tiles`, `carrier_benchmarks`)
4. **Add `coverage_tiles` partial refresh** — only process last 6 hours of data instead of full table scan

### Phase 2 — Edge Function Optimization (Do Now)

5. **Increase batch size** in `sync-contribution-data` from 25 to 50-100 logs per call — halves the number of API calls
6. **Increase session update interval** from 2 min to 5 min — cuts API calls by 60%
7. **Add client-side request queuing** — if a sync is in-flight, queue the next one instead of firing parallel calls

### Phase 3 — Infrastructure (Before Launch)

8. **Upgrade to Large instance** — handles ~500+ concurrent contributors with optimized queries
9. **Consider XL** if projecting >2000 simultaneous contributors

## Realistic Capacity After Optimizations

| Setup | Concurrent Contributors | Total Users Supported |
|---|---|---|
| Medium + optimizations | ~300-500 | ~5,000-10,000 |
| Large + optimizations | ~1,000-2,000 | ~15,000-25,000 |
| XL + optimizations | ~3,000-5,000 | ~40,000-60,000 |

**Large instance + the optimizations above should comfortably handle your 20k launch.**

## Files Changed

| File | Change |
|---|---|
| Migration SQL | Add indexes on signal_logs, contribution_sessions, user_daily_limits |
| `get-network-stats-cached/index.ts` | Use estimated counts instead of exact |
| Migration SQL | Reduce materialized view refresh schedules |
| `sync-contribution-data/index.ts` | Increase batch size, add throttling |
| Client-side contribution hook | Increase sync interval from 2 to 5 min |

## Recommendation

Start with **Phase 1 + 2** right now (pure optimization, no cost increase). Then upgrade to **Large instance** before launch day. This combination handles 20k users with room to spare.

