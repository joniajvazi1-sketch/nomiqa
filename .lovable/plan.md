

# Cost Optimization Audit — What's Done vs. What's Left

## Already Implemented ✓

Your codebase already has most of the optimizations in place:

1. **Distance + event logging** — `MIN_DISTANCE_THRESHOLD = 75m`, `shouldLogOnNetworkChange()`, `shouldLogOnSignalChange()` with 5 dBm threshold ✓
2. **Batching** — `BATCH_SIZE = 20` records before flush, with `flushBatch()` on stop/background ✓
3. **Hourly sample cap** — `MAX_SAMPLES_PER_HOUR = 12` prevents over-logging ✓
4. **Auto-save throttling** — Session updates every 2 minutes (`AUTO_SAVE_INTERVAL_MS`), not every second ✓
5. **Materialized views** — `coverage_tiles` refreshed every 15 min, B2B views every 6 hours ✓
6. **Raw log cleanup** — 90-day retention via `pg_cron` for both `signal_logs` and `mining_logs` ✓
7. **PII cleanup** — 120-day anonymization of order data ✓

## Remaining Optimizations (3 items)

### 1. Tile Saturation — Reduce logging in well-covered areas
Currently every location is logged at the same frequency regardless of existing coverage density. In city centres where you already have thousands of data points, new logs add minimal B2B value.

**Implementation:**
- Before logging, check if the current geohash tile already has recent high-quality data (query `coverage_tiles` materialized view)
- If tile has 50+ samples in last 7 days with avg quality > 70, skip every other log (double the distance threshold to 150m)
- New/sparse tiles keep the standard 75m threshold
- Cache tile saturation status locally for 30 minutes to avoid repeated DB lookups

**Files:** `src/hooks/useTelcoMetrics.ts`, `src/hooks/useNetworkContribution.ts`

### 2. Reduce raw log retention from 90 → 60 days
Your advisor recommends 60 days. B2B buyers need trends and aggregates, not 3-month-old raw pings. The materialized views already preserve the aggregated value.

**Implementation:** Update the `cleanup_old_signal_logs` and `cleanup_old_mining_logs` cron functions from `INTERVAL '90 days'` to `INTERVAL '60 days'`.

**Method:** Database migration to replace the two cleanup functions.

### 3. Increase batch size from 20 → 25
Minor tweak matching advisor's recommendation. Reduces edge function invocations by ~20%.

**Files:** `src/hooks/useTelcoMetrics.ts` (change `BATCH_SIZE` constant)

## Expected Savings

| Optimization | Write Reduction | Already Done? |
|---|---|---|
| Event-based logging (75m/signal/network) | 60-80% | ✓ |
| Batch 20→25 records | ~20% fewer API calls | Planned |
| Hourly cap (12/hr) | Prevents runaway | ✓ |
| Tile saturation skip | 15-30% in dense areas | Planned |
| 90→60 day retention | 33% less storage | Planned |
| Session update throttle (2min) | 95% fewer updates | ✓ |
| Materialized views | Eliminates live queries | ✓ |

**Bottom line:** You're already at ~70-80% optimization. The 3 remaining items will squeeze out another 15-25% on top.

## Technical Details

- Tile saturation check will use `supabase.from('coverage_tiles')` with a geohash filter, cached in a `Map<string, { saturated: boolean; checkedAt: number }>` ref
- The 60-day retention change is a simple function body replacement via migration
- No new tables, no new edge functions, no schema changes needed

