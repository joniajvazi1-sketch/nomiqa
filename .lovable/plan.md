

# Implementation Plan: Fix Data Pipeline Gaps + Additional Issues

## Summary of Current State

| Component | Status | Issue |
|-----------|--------|-------|
| signal_logs retention | ❌ No cleanup | Unbounded growth (1,036 rows now, will explode at scale) |
| mining_logs retention | ✅ Has cleanup | `cleanup_old_mining_logs()` (90 days) exists |
| coverage_tiles refresh | ❌ Disabled | Materialized view exists but empty (no cron job) |
| B2B export API | ❌ Missing | No edge function for CSV/JSON export |
| speed_test_results | ⚠️ Empty (0 rows) | Will fill naturally post-launch |
| safe_coverage_tiles (K-anon) | ✅ Exists | B2B schema with ≥5 users, ≥20 samples filter |

---

## GAP 1: signal_logs Retention (CRITICAL)

### Problem
- `signal_logs` table has no cleanup function
- Currently 1,036 rows, oldest from Jan 18
- At 100k users × 12 samples/hour = 1.2M rows/day → DB performance death

### Solution
Create `cleanup_old_signal_logs(90 days)` function and schedule daily cron

### Database Changes

```sql
-- Function to cleanup old signal logs (90-day retention)
CREATE OR REPLACE FUNCTION public.cleanup_old_signal_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete signal logs older than 90 days
  DELETE FROM public.signal_logs
  WHERE recorded_at < now() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup for audit
  INSERT INTO public.webhook_logs (event_type, payload, processed)
  VALUES (
    'signal_logs_cleanup_executed',
    jsonb_build_object(
      'deleted_logs', deleted_count,
      'executed_at', now(),
      'retention_days', 90
    ),
    true
  );
  
  RETURN deleted_count;
END;
$$;

-- Schedule daily cleanup at 5 AM
SELECT cron.schedule(
  'cleanup-signal-logs-daily',
  '0 5 * * *',
  $$SELECT cleanup_old_signal_logs();$$
);
```

---

## GAP 2: coverage_tiles Cron (Empty View)

### Problem
- `coverage_tiles` materialized view exists but is empty (0 rows)
- `refresh_coverage_tiles()` function exists but no cron job scheduled
- Demo risk: B2B buyers see empty dashboard

### Solution
Enable the cron job to refresh every 15 minutes

### Database Changes

```sql
-- Schedule coverage tiles refresh every 15 minutes
SELECT cron.schedule(
  'refresh-coverage-tiles-15min',
  '*/15 * * * *',
  $$SELECT refresh_coverage_tiles();$$
);

-- Also do an immediate refresh to populate data
SELECT refresh_coverage_tiles();
```

---

## GAP 3: B2B Export API Endpoint

### Problem
- No way to export `safe_coverage_tiles` for buyers
- Buyers want CSV/JSON with date range filters
- Must be API-key authenticated (not user auth)

### Solution
Create new edge function: `export-coverage-data`

### New Edge Function: `supabase/functions/export-coverage-data/index.ts`

Features:
- API key authentication via `X-API-Key` header (checked against `app_remote_config`)
- Format support: `json` (default) or `csv`
- Date range filter: `?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
- Row limit: max 10,000 per request
- Sources from `b2b.safe_coverage_tiles` (K-anonymity enforced)

```typescript
// Endpoint: GET /export-coverage-data?format=csv&country=DE
// Headers: X-API-Key: <b2b_api_key>
// Response: CSV or JSON of aggregated coverage data
```

**Config update** (via insert tool):
```sql
INSERT INTO app_remote_config (config_key, config_value, is_sensitive, description)
VALUES (
  'b2b_api_keys',
  '["demo-key-12345"]'::jsonb,
  true,
  'API keys for B2B export access'
);
```

---

## GAP 4: Speed Test Population (Non-Blocking)

### Status
- Table exists with correct schema
- Currently 0 rows
- Will populate naturally as users run speed tests

### No Action Required
The app already saves speed test results via `sync-contribution-data` when `speed_test_down` is present. Just needs users to run tests.

---

## Additional Gap Identified: mining_logs Cron Missing

### Problem
`cleanup_old_mining_logs()` function exists but has no cron job scheduled!

### Solution
```sql
-- Schedule mining logs cleanup daily at 4 AM
SELECT cron.schedule(
  'cleanup-mining-logs-daily',
  '0 4 * * *',
  $$SELECT cleanup_old_mining_logs();$$
);
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Migration | Create | Add cleanup function + cron jobs |
| `supabase/functions/export-coverage-data/index.ts` | Create | B2B export endpoint |
| `supabase/config.toml` | Update | Add export-coverage-data config |

---

## Implementation Sequence

1. **Database migration**: 
   - Create `cleanup_old_signal_logs()` function
   - Schedule all 3 cron jobs (signal_logs, mining_logs, coverage_tiles)
   - Immediate refresh of coverage_tiles

2. **Edge function**: Create `export-coverage-data` with API key auth

3. **Config**: Add B2B API key to remote config

---

## Post-Implementation Verification

| Check | Command | Expected |
|-------|---------|----------|
| Signal logs cron exists | `SELECT * FROM cron.job WHERE jobname LIKE '%signal%'` | 1 row |
| Mining logs cron exists | `SELECT * FROM cron.job WHERE jobname LIKE '%mining%'` | 1 row |
| Coverage tiles cron exists | `SELECT * FROM cron.job WHERE jobname LIKE '%coverage%'` | 1 row |
| Coverage tiles populated | `SELECT COUNT(*) FROM coverage_tiles` | >0 rows |
| Export endpoint works | `curl .../export-coverage-data?format=json` with API key | JSON response |

---

## Buyer Demo Readiness After This

| Deliverable | Status |
|-------------|--------|
| Coverage heatmap API | ✅ `get-global-coverage` exists |
| Aggregated tiles (CSV/JSON) | ✅ NEW `export-coverage-data` |
| K-anonymity guarantee | ✅ `b2b.safe_coverage_tiles` (≥5 users, ≥20 samples) |
| Retention policy | ✅ 90 days raw, aggregates refreshed every 15min |
| Data volume proof | ⚠️ Depends on user count (currently low) |

