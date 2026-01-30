
# Comprehensive Points & Challenges System Upgrade

## Summary

This plan implements your complete points-scaling and behavior-shaping system with a focus on **passive earning**, **sustainable economics**, and **anti-abuse mechanisms**. The goal is to reward consistency, not intensity.

---

## Current State Analysis

### What's Already Implemented
| Feature | Status | Notes |
|---------|--------|-------|
| Daily point cap | ✅ Done | 200 pts/day via `add_points_with_cap` RPC |
| Early user boost | ✅ Done | +50% for first 30 days |
| Relative token model | ✅ Done | Points = share of pool, not fixed USD |
| Remote config system | ✅ Done | `app_remote_config` table with kill switches |
| Challenges table | ✅ Done | 3 daily, 3 weekly challenges exist |
| Signal log limits | ✅ Done | 500 logs/day, 10 speed tests/day |
| Device integrity checks | ✅ Done | Mock location, emulator, root detection |

### What Needs to Be Built
1. **Behavior-shaping challenges** (passive, not button-tap based)
2. **Time-based rewards** (diminishing returns after 8h)
3. **Network/location change detection**
4. **Streak multiplier on background only** (not challenges)
5. **Admin controls for dynamic point adjustments**
6. **Analytics for challenge value correlation**

---

## Implementation Phases

### Phase 1: Redesign Daily Challenges (Passive-First)

Replace current challenges with behavior-shaping ones:

| Challenge | Points | Metric | Detection Logic |
|-----------|--------|--------|-----------------|
| **App Active ≥ 6h** | 25 | `session_hours` | Count session duration from `contribution_sessions` |
| **Location Changed ≥ 1km** | 15 | `distance_meters` | Already tracked in `contribution_sessions.total_distance_meters` |
| **Network Change Detected** | 10 | `network_changes` | NEW: Count distinct `network_type` in `signal_logs` today |
| **Background Scan Completed** | 20 | `data_points` | Already tracked, lower threshold (50 → 30 points) |
| **Passive Bonus** | 10 | `passive` | Auto-grant if app enabled for any time that day |

**Database Changes:**
- Add `metric_type` values: `session_hours`, `network_changes`, `passive`
- Update `challenges` table with new challenge definitions
- Add trigger to auto-complete passive challenges

### Phase 2: Weekly Challenges (Retention-Focused)

| Challenge | Points | Metric | Why It Matters |
|-----------|--------|--------|----------------|
| **5 Active Days** | 40 | `active_days` | Retention |
| **3 Different Locations** | 30 | `unique_locations` | Map expansion |
| **2 Network Types Seen** | 20 | `network_diversity` | Carrier insights |
| **No Manual Pause** | 30 | `no_pause` | Stability |

**Database Changes:**
- Add `active_days_this_week` column to track daily contributions
- Add `unique_geohashes_this_week` for location diversity
- Add `network_types_this_week` (array) for network diversity

### Phase 3: Time-Based Diminishing Returns

| Daily Active Time | Reward Multiplier |
|-------------------|-------------------|
| 0–2h | 0% (no rewards) |
| 2–6h | 50% |
| 6–12h | 100% (full) |
| 12–24h | 110% cap (max +10% bonus) |

**Implementation:**
```sql
-- New DB function: get_time_multiplier(session_hours)
CREATE FUNCTION get_time_multiplier(hours NUMERIC) 
RETURNS NUMERIC AS $$
BEGIN
  IF hours < 2 THEN RETURN 0.0;
  ELSIF hours < 6 THEN RETURN 0.5;
  ELSIF hours < 12 THEN RETURN 1.0;
  ELSE RETURN 1.1; -- Soft cap at 110%
  END IF;
END;
$$ LANGUAGE plpgsql;
```

**Frontend Changes:**
- Update `useNetworkContribution` to track active session time
- Show time-based progress in UI ("2h until full rewards")

### Phase 4: Streak System (Background Only)

| Streak Length | Background Bonus |
|---------------|------------------|
| 7 days | +10% |
| 30 days | 2× (100% bonus) |
| Cap | 2× max |

**Key Constraint:** Streak bonus applies ONLY to background contribution points, not challenge rewards.

**Database Changes:**
```sql
-- Add to user_points table
ALTER TABLE user_points ADD COLUMN background_streak_days INTEGER DEFAULT 0;
ALTER TABLE user_points ADD COLUMN last_background_date DATE;

-- Update add_points_with_cap to apply streak multiplier only to background source
```

### Phase 5: Network/Location Change Detection

**New tracking in `signal_logs`:**
```sql
-- Count network changes today (for challenge completion)
SELECT COUNT(DISTINCT network_type) 
FROM signal_logs 
WHERE user_id = $1 
AND recorded_at >= CURRENT_DATE;

-- Count unique geohash prefixes (5-char = ~5km cells)
SELECT COUNT(DISTINCT LEFT(location_geohash, 5))
FROM signal_logs
WHERE user_id = $1
AND recorded_at >= CURRENT_DATE;
```

**Challenge auto-completion:**
- Scheduled cron job (every 30 min) checks metrics and updates `user_challenge_progress`
- OR real-time trigger on `signal_logs` insert

### Phase 6: Admin Controls (Remote Config)

Add new remote config entries:

| Config Key | Default | Purpose |
|------------|---------|---------|
| `points_per_hour_active` | 5 | Base hourly rate |
| `daily_challenge_total_target` | 80 | Total daily challenge points |
| `weekly_challenge_total_target` | 120 | Total weekly challenge points |
| `max_daily_points` | 200 | Hard cap (already exists) |
| `background_base_points` | 50 | Base background earnings |
| `streak_max_multiplier` | 2.0 | Max streak bonus |
| `min_active_hours_for_rewards` | 2 | Minimum active time |

**Admin Dashboard (Future):**
- Add admin-only edge function to update `app_remote_config`
- Log all changes to `security_audit_log`

### Phase 7: Analytics for Challenge Value Tracking

**New table: `challenge_analytics`**
```sql
CREATE TABLE challenge_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id),
  date DATE NOT NULL,
  completions INTEGER DEFAULT 0,
  claims INTEGER DEFAULT 0,
  avg_completion_time_hours NUMERIC,
  correlated_signal_quality NUMERIC, -- Avg confidence score of users who complete
  correlated_retention_7d NUMERIC, -- % who return within 7 days
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Daily cron job:** Aggregate previous day's challenge data for analysis.

---

## Technical Implementation Order

1. **Database migrations** (15 min)
   - Update `challenges` table with new passive challenges
   - Add `session_hours` tracking columns
   - Add network/location diversity tracking

2. **Update `sync-contribution-data` edge function** (20 min)
   - Apply time-based multiplier
   - Apply streak bonus to background only
   - Auto-detect and record network changes

3. **Update `useChallenges` hook** (15 min)
   - Fetch new challenge types
   - Calculate passive metrics (session hours, network changes)
   - Auto-complete passive bonus challenge

4. **Update challenge progress calculation** (15 min)
   - Server-side aggregation for `session_hours`
   - Server-side count for `network_changes`
   - Add weekly aggregation queries

5. **Add remote config entries** (5 min)
   - Insert new config rows for point values
   - Make edge function read these dynamically

6. **Frontend UI updates** (10 min)
   - Show time-based progress indicator
   - Show streak bonus breakdown
   - Update challenge descriptions

---

## Security & Anti-Abuse Measures

| Measure | Implementation |
|---------|----------------|
| **Device integrity** | ✅ Already checking mock location, emulator |
| **Rate limits** | ✅ 500 logs/day, 10 speed tests/day |
| **Daily point cap** | ✅ 200 pts/day hard limit |
| **Streak verification** | Check `signal_logs` entries exist, not just app open |
| **One referral reward per user** | ✅ Already enforced via unique constraint |
| **No compounding multipliers** | Apply boosts sequentially, not multiplicatively |

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/sync-contribution-data/index.ts` | Add time multiplier, streak logic |
| `src/hooks/useChallenges.ts` | Fetch new metrics, auto-complete passive |
| `src/components/app/ChallengesSection.tsx` | Update UI for passive challenges |
| `src/components/app/ChallengeCard.tsx` | Show streak bonus breakdown |
| `src/utils/tokenomics.ts` | Add time multiplier utilities |
| NEW: `supabase/functions/process-challenges/index.ts` | Cron job for auto-completion |

---

## Expected Outcomes

After implementation:
- ✅ Users earn ~80 pts/day from passive behavior
- ✅ Power users (8h+ active) earn up to 170 pts/day with streak
- ✅ No button-mashing or gaming required
- ✅ All point values adjustable without app redeploy
- ✅ Challenge data correlates with valuable user behavior
- ✅ System scales from 10 to 10M users without inflation

---

## Summary One-Liner

> "Our goal is to reward consistency and passive contribution, not intensity or spam."
