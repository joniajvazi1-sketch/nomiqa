

# Full Infrastructure Audit — Post-Optimization

## 1. Concurrency & User Capacity

### Current Setup: Medium Instance + Optimizations Applied

**What changed:**
- Sync interval: 2 min → 5 min (60% fewer edge function calls)
- Batch size: 25 → 50 logs per call (50% fewer API calls)
- DB indexes added on `signal_logs(user_id, recorded_at)`, `contribution_sessions(user_id, started_at)`, `contribution_sessions(started_at)`
- `get-network-stats-cached` now uses `estimated_row_count()` (pg_class) instead of `count: 'exact'`

### Capacity Table (Medium Instance, Post-Optimization)

```text
Users    Concurrent    Sync calls/min    Signal inserts/min    Status
─────    ──────────    ──────────────    ──────────────────    ──────
50       5-10          1-2               50-100                ✅ Comfortable
100      10-20         2-4               100-200               ✅ Fine
500      50-75         10-15             500-750               ⚠️ Near limit
1,000    100-150       20-30             1,000-1,500           🔴 At ceiling
10,000   1,000-1,500   200-300           10,000-15,000         💀 Impossible
```

**Assumptions:**
- 5-15% of registered users are active simultaneously (mobile app norm)
- Each active user syncs every 5 min with ~50 signal logs
- Medium instance: ~30-50 DB connections, ~15-25 concurrent edge functions

### What Fails First (in order):

1. **Edge function concurrency** (~15-25 simultaneous) — at ~150 active users
2. **DB connection pool** (~30-50 connections) — at ~200 active users
3. **DB write throughput** (signal_logs inserts) — at ~500 active users
4. **Cron/materialized view refreshes** (compete for connections + CPU) — degrades under load
5. **Auth** — Supabase Auth scales independently, not a bottleneck until ~50k+
6. **Storage/bandwidth** — not a bottleneck (signal logs are text rows, not files)

### Peak writes/min:
- At 100 concurrent contributors: ~200-400 signal log rows/min
- At 500 concurrent: ~1,000-1,500 rows/min (Medium ceiling)

---

## 2. Signal Log Optimisation Impact

### What's Active:

| Optimization | Status | Implementation |
|---|---|---|
| Distance-based logging (75m / 150m saturated) | ✅ Active | `useTelcoMetrics.ts` — `shouldLogDataPoint()` |
| Signal-change threshold (±5 dBm) | ✅ Active | `shouldLogOnSignalChange()` |
| Network/cell-tower change trigger | ✅ Active | `shouldLogOnNetworkChange()` |
| Batching (50 logs per API call) | ✅ Active | `addToBatch()`, `BATCH_SIZE = 50` |
| Tile saturation deduplication | ✅ Active | `isTileSaturated()` — doubles distance to 150m when tile has 50+ samples |
| Hourly sample cap | ✅ Active | `MAX_SAMPLES_PER_HOUR = 12` |
| Daily caps | ✅ Active | 500 signal logs/day, 10 speed tests/day (server-enforced) |

### Estimated % Reduction (vs naive "log everything"):

| Metric | Reduction | How |
|---|---|---|
| DB writes | ~70-85% | Distance threshold + hourly cap + tile saturation |
| API calls | ~80-90% | Batching (50x) + 5-min sync interval |
| Storage growth | ~60-75% | Fewer duplicate rows in dense areas |
| Edge executions | ~60% | 5-min interval vs 2-min |

### B2B Data Quality Impact:

**No degradation to sellable data quality.** The optimizations specifically target:
- Duplicate stationary logs (low value) — removed
- Dense city saturation (redundant samples) — reduced frequency, not eliminated
- Preserved: network handoffs, signal changes ≥5dBm, cell tower transitions, 5G events, roaming events

These are all **high-value triggers** that still log immediately regardless of distance/time thresholds. The system preferentially keeps rare/valuable data and reduces only redundant commodity samples.

---

## 3. Supabase Cost Projection

Based on Medium plan ($50/month base on Lovable Cloud) + usage:

```text
DAU      DB storage    Edge invokes    Bandwidth    Est. Monthly Total
─────    ──────────    ────────────    ─────────    ──────────────────
100      ~500MB        ~30k/mo         ~2GB         ~$50-60
1,000    ~5GB          ~300k/mo        ~15GB        ~$75-100
10,000   ~50GB         ~3M/mo          ~100GB       ~$200-400
100,000  ~500GB        ~30M/mo         ~1TB         ~$2,000-5,000+
```

**Recommended plan path:**
- Now → launch: **Medium** ($50/mo) — handles up to ~5,000 registered users
- At 5k-20k users: **Large** (~$100/mo) — handles up to ~25,000
- At 20k-50k users: **XL** (~$200/mo) + architectural changes
- At 100k+: **Enterprise/dedicated** + read replicas + partitioning

**Cost drivers:** Signal logs table is the dominant cost (storage + writes). At 10k DAU writing 100-200 logs/day each, that's 1-2M rows/day = ~60M rows/month. At ~1KB/row avg, that's ~60GB/month raw growth (before 60-day retention cleanup).

---

## 4. Sellable Data Volume

### Per-Session (avg 2-hour active contribution):

| Data Type | Volume | B2B Value |
|---|---|---|
| Signal logs | 24-48 rows (12/hr cap × 2hr) | High — RSRP, cell ID, carrier, geohash |
| Speed tests | 0-4 (auto every 30min on WiFi) | Very High — throughput benchmarks |
| Coverage confirmations | 1-5 (triggered at boundaries) | High — ground-truth validation |
| Connection events | 2-10 (handoffs, roaming changes) | Very High — network transition data |

### Per Active Contributor Per Day (avg 4-6 hours):

| Metric | Estimate |
|---|---|
| Signal logs | 48-72 rows |
| New tiles discovered | 5-20 (urban), 20-50 (travel/rural) |
| Unique carriers observed | 1-3 |
| 5G cell observations | 2-10 (in 5G areas) |
| Handoff events | 5-15 |

### At Scale:

```text
Contributors/day    Signal logs/day    New tiles/day    Unique carriers/day
────────────────    ───────────────    ─────────────    ───────────────────
100                 5,000-7,000        500-2,000        20-50
1,000               50,000-70,000      2,000-10,000     50-150
10,000              500k-700k          5,000-20,000     100-300
```

**Daily sellable map coverage growth** (at 1,000 DAU): ~2,000-10,000 new geohash-7 tiles/day (~153m² resolution). In a new city, a single contributor on a car trip can map 200+ new tiles in an hour.

---

## 5. Coverage Quality & Saturation

- **Dense city saturation**: A well-covered city block (geohash-5 tile, ~5km²) saturates at **50+ high-quality samples** — reachable in 1-3 days with 5+ urban contributors
- **Low-value threshold**: After 50 samples with avg quality >70, additional stationary logs from the same tile add minimal B2B value → distance threshold doubles to 150m
- **Saturated tiles ARE logged less frequently**: ✅ Active via `isTileSaturated()` — uses `coverage_tiles` materialized view
- **Value preservation for special scenarios**:
  - **New roads/highways**: Automatically high-value (no existing tile data → not saturated → normal 75m threshold)
  - **Airports**: Indoor flag + rare location bonus → always valuable
  - **Trains**: Continuous movement = new tiles every few seconds → never saturated
  - **Roaming**: Roaming flag makes every log premium B2B data (cross-border analytics)
  - **Time-of-day variation**: Same tile at different hours = new congestion data (not deduplicated by time)

---

## 6. Data Quality Impact

### Confidence Score: ✅ Still Strong
The `computeConfidenceScore()` function (server-side) is unchanged. Scoring factors:
- GPS accuracy (penalty for >20m, >50m, >100m)
- Signal data completeness (bonuses for RSRP, RSRQ, SINR, cell ID, MCC/MNC)
- Device integrity (penalties for mock location, emulator, root)
- Speed test data (bonus when present)

### Still Collecting:

| Data Type | Status | Notes |
|---|---|---|
| 5G transitions | ✅ Yes | Network change trigger fires immediately |
| Indoor/outdoor variation | ✅ Yes | `is_indoor` flag preserved |
| Mobility patterns | ✅ Yes | `speed_mps`, heading, distance all logged |
| Congestion patterns | ✅ Yes | Time-of-day inherent in `recorded_at` |
| Time-of-day changes | ✅ Yes | Hourly cap of 12 ensures temporal spread |

### B2B Analytics Degradation Risk: **Low**
The materialized views (`coverage_tiles`, `carrier_benchmarks`, `network_congestion`, `network_qoe_scores`) aggregate across all logs. Reducing redundant stationary logs actually *improves* view quality by reducing noise from repeated identical readings.

---

## 7. Top 5 Scaling Risks (Post-Optimization)

### Risk 1: Edge Function Concurrency Wall
- **What breaks**: `sync-contribution-data` queues up, timeouts cascade
- **At what level**: ~150-200 concurrent contributors (Medium)
- **Fix**: Upgrade to Large instance (doubles concurrency limit)
- **Cost**: ~$100/mo (Large) vs ~$50/mo (Medium)

### Risk 2: Materialized View Refresh Lock Contention
- **What breaks**: `coverage_tiles` refresh holds locks, blocks inserts
- **At what level**: ~500k+ rows in signal_logs (reachable at ~1,000 DAU in 1-2 weeks)
- **Fix**: Move refresh to off-peak hours (2-4 AM) + use `CONCURRENTLY` refresh + reduce frequency to 1-6 hours
- **Cost**: Free (configuration change)

### Risk 3: signal_logs Table Bloat
- **What breaks**: Insert latency increases, index maintenance slows, backups grow
- **At what level**: ~10M+ rows (reachable at 1,000 DAU in ~3 months)
- **Fix**: Time-based partitioning (monthly partitions) + ensure 60-day retention cleanup runs reliably
- **Cost**: Free (migration + config)

### Risk 4: Device Fingerprint Check Latency
- **What breaks**: Each `sync-contribution-data` call queries `offline_contribution_queue` for fingerprint abuse — gets slow at scale
- **At what level**: ~1M+ rows in offline_contribution_queue
- **Fix**: Add index on `(device_fingerprint, user_id)` + consider caching recent fingerprint checks
- **Cost**: Free (index migration)

### Risk 5: Daily Limits Table Hot Rows
- **What breaks**: `user_daily_limits` upsert contention — every sync call reads+writes the same row per user per day
- **At what level**: ~500+ concurrent contributors
- **Fix**: Client-side daily limit tracking + server validation only on batch flush
- **Cost**: Free (code change)

---

## 8. Investor-Grade Projection

At current efficiency with 1,000 DAU (conservative):

```text
Metric                          Monthly Estimate
──────────────────────────────  ────────────────
Raw signal log rows             1.5M - 2.1M
Unique geohash-7 tiles          30k - 100k (cumulative growth)
Unique carriers observed         100 - 300
QoE samples (speed + latency)   30k - 120k
Countries with coverage          20 - 50
B2B coverage footprint growth    ~500-2,000 km² new coverage/month
```

At 10,000 DAU:
```text
Raw rows/month:                 15M - 21M
New tiles/month:                100k - 500k
QoE samples/month:              300k - 1.2M
Coverage growth:                ~5,000-20,000 km²/month
```

**Network effect**: Coverage value grows non-linearly. At 10k DAU across 20+ countries, the dataset becomes competitive with commercial coverage databases (OpenSignal, Ookla) for specific geographies.

---

## 9. Abuse & Reward Farming Load

### Current Capacity:

| Action | Rate Limit | Concurrent Capacity |
|---|---|---|
| Contribution points | 200/day, 6k/month, 100k lifetime (via `add_points_with_cap` RPC) | Scales with DB |
| Referral claims | Velocity tracking + 100 max referrals per affiliate | ~50-100 concurrent |
| Social task claims | 1 claim per platform per user (unique constraint) | ~200 concurrent |
| Claim button (earnings) | 1 per 24h per user (webhook_logs rate limit) | ~50 concurrent |
| Offline queue replays | 1,000-item FIFO cap, server validates all entries | ~100 concurrent |

### Can it handle 1,000+ concurrent claim attempts?

**Social tasks/daily check-ins**: Yes — simple inserts with unique constraints, handled by DB.

**Earnings claim button**: No — each claim triggers a Resend email API call + multiple DB queries. At 1,000 concurrent, Resend rate limits (~100/sec) and edge function concurrency would bottleneck. **Fix**: Queue claims and process in batches.

**Contribution point farming**: Protected by device fingerprint enforcement (max 2 accounts/device, freeze at 5), daily/monthly/lifetime caps, anti-cheat validation (speed checks, teleportation detection, pattern analysis). At scale this is robust.

---

## 10. Million-User Architecture Path

### Current architecture supports without redesign:

| Scale | Supported? | Notes |
|---|---|---|
| 10k users | ✅ Yes | Large instance + current optimizations |
| 100k users | ⚠️ Partially | Needs: table partitioning, read replicas, edge function queuing |
| 1M users | ❌ No | Full redesign required |

### First redesign step for 100k+:

1. **Table partitioning on signal_logs** (by month) — prevents single-table bloat
2. **Read replica** for materialized view refreshes — stops analytics from competing with writes
3. **Edge function request queuing** (e.g., Redis/BullMQ via external service) — prevents concurrency exhaustion
4. **Estimated cost**: ~$500-1,000/mo infrastructure

### For 1M users:

- **Dedicated Postgres cluster** (not shared Supabase)
- **Streaming ingestion** (Kafka/Kinesis → batch writes) instead of per-user edge function calls
- **CDN-cached analytics** — pre-computed dashboards, not real-time queries
- **Estimated cost**: ~$5,000-15,000/mo infrastructure
- **Estimated engineering time**: 2-4 months with 2 backend engineers

**Bottom line**: The current optimized architecture is solid for the 20k launch and growth to ~50k users on a Large instance. The first architectural inflection point comes at ~100k users when you need partitioning + read replicas.

