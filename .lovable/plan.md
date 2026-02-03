# Data Pipeline Status - Updated 2026-02-03

## ✅ Completed Fixes

| Component | Status | Details |
|-----------|--------|---------|
| signal_logs retention | ✅ Fixed | `cleanup_old_signal_logs()` + daily cron at 5 AM |
| mining_logs retention | ✅ Fixed | Cron scheduled at 4 AM (function existed) |
| coverage_tiles refresh | ✅ Fixed | Cron every 15 min, 391 tiles populated |
| B2B export API | ✅ Created | `export-coverage-data` endpoint (deploying) |
| B2B API key | ✅ Configured | `demo-key-nomiqa-b2b-2026` in remote config |

## Cron Jobs Active

| Job | Schedule | Function |
|-----|----------|----------|
| cleanup-signal-logs-daily | 0 5 * * * | 90-day signal log retention |
| cleanup-mining-logs-daily | 0 4 * * * | 90-day mining log retention |
| refresh-coverage-tiles-15min | */15 * * * * | Materialized view refresh |

## B2B Export API

**Endpoint:** `GET /export-coverage-data`

**Authentication:** `X-API-Key: demo-key-nomiqa-b2b-2026`

**Parameters:**
- `format`: `json` (default) or `csv`
- `country`: Filter by country code (e.g., `DE`)
- `carrier`: Filter by carrier name (partial match)
- `network`: Filter by network generation (e.g., `LTE`, `5G`)
- `limit`: Max rows (default 1000, max 10000)
- `offset`: Pagination offset
- `demo`: Set to `true` for relaxed K-anon thresholds (pre-launch demos)

**Privacy Thresholds:**
- Production: ≥5 unique users AND ≥20 samples per tile
- Demo mode: ≥1 user AND ≥5 samples per tile

## Current Data State

| Metric | Value |
|--------|-------|
| Total tiles | 391 |
| Max samples per tile | 155 |
| Tiles meeting production K-anon | 0 (need more users) |
| Tiles available in demo mode | 20+ (≥5 samples) |

## Buyer Demo Readiness

| Deliverable | Status |
|-------------|--------|
| Coverage heatmap API | ✅ `get-global-coverage` |
| Aggregated tiles export | ✅ `export-coverage-data` |
| K-anonymity guarantee | ✅ Configurable thresholds |
| Retention policy | ✅ 90 days raw, 15min refresh |
| Data volume | ✅ 391 tiles, demo mode available |

