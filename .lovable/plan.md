

# Implementation Plan: Fix 3 Post-Launch Gaps

Based on your approval with modifications (no monthly cap UI, referral points bypass caps), here's the implementation plan:

---

## Summary of Changes

| Gap | Fix | Status |
|-----|-----|--------|
| 1. Solana wallet uniqueness | Add unique constraint | ✅ Will implement |
| 2. Monthly cap UI tracker | Skip | ❌ Not needed per your request |
| 3. Leaderboard O(n) scaling | Optimize to single-pass | ✅ Will implement |
| 4. Referral points bypass caps | New RPC function | ✅ Will implement |

---

## Database Migration

### Gap 1: Solana Wallet Unique Constraint

**Problem:** 26 duplicate wallets found in production - this is a Sybil attack vector for token distribution.

**Solution:**
1. Clear duplicate wallets (keep only the earliest entry per address)
2. Drop old non-unique index
3. Create new unique partial index on `LOWER(solana_wallet)`

```sql
-- Clean duplicates (keep earliest)
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY LOWER(solana_wallet) 
    ORDER BY created_at ASC
  ) as rn
  FROM public.profiles WHERE solana_wallet IS NOT NULL
)
UPDATE public.profiles p SET solana_wallet = NULL
FROM duplicates d WHERE p.id = d.id AND d.rn > 1;

-- Create unique index
CREATE UNIQUE INDEX idx_profiles_solana_wallet_unique
ON public.profiles (LOWER(solana_wallet))
WHERE solana_wallet IS NOT NULL;
```

### Gap 3: Leaderboard Optimization

**Problem:** Current function runs 3 separate full-table scans + updates.

**Solution:** Single CTE computes all 3 ranks, updates only changed rows:

```sql
WITH ranked AS (
  SELECT user_id,
    ROW_NUMBER() OVER (ORDER BY total_points DESC NULLS LAST) as new_rank_all_time,
    ROW_NUMBER() OVER (ORDER BY weekly_points DESC NULLS LAST) as new_rank_weekly,
    ROW_NUMBER() OVER (ORDER BY monthly_points DESC NULLS LAST) as new_rank_monthly
  FROM leaderboard_cache
  WHERE total_points > 0 OR weekly_points > 0 OR monthly_points > 0
)
UPDATE leaderboard_cache lc SET 
  rank_all_time = ranked.new_rank_all_time,
  rank_weekly = ranked.new_rank_weekly,
  rank_monthly = ranked.new_rank_monthly
FROM ranked WHERE lc.user_id = ranked.user_id
  AND (ranks changed...);
```

**Performance gain:** ~3x faster, only updates rows where ranks changed.

### Gap 4: Referral Points Bypass Caps

**Problem:** Referral points currently count against daily/monthly caps.

**Solution:** New `add_referral_points` RPC function that:
- Bypasses daily cap (200 pts)
- Bypasses monthly cap (6,000 pts)
- Still enforces lifetime cap (100,000 pts)
- Still checks if account is frozen
- Logs all referral points for audit

---

## Edge Function Update

**File:** `supabase/functions/track-affiliate-registration/index.ts`

**Changes:**
- Replace direct `user_points` table updates with `add_referral_points` RPC calls
- Update response to include `bypassedCaps: true`

**Before (lines 267-290):**
```typescript
// Direct table update - counts against caps
await supabase.from('user_points').update({
  total_points: points + IMMEDIATE_SIGNUP_BONUS
}).eq('user_id', affiliate.user_id);
```

**After:**
```typescript
// RPC call - bypasses daily/monthly caps
await supabase.rpc('add_referral_points', {
  p_user_id: affiliate.user_id,
  p_points: IMMEDIATE_SIGNUP_BONUS,
  p_source: 'referral_immediate'
});
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/20260203120000_fix_three_gaps.sql` | Create | Database migration with all fixes |
| `supabase/functions/track-affiliate-registration/index.ts` | Modify | Use new `add_referral_points` RPC |

---

## Testing Checklist

After implementation:
1. **Wallet uniqueness:** Try setting duplicate wallet → Should fail
2. **Leaderboard:** Verify rankings still work correctly
3. **Referral bypass:** Invite a user when at 199/200 daily cap → Referral points should still award
4. **Frozen account:** Verify frozen accounts still can't receive referral points

---

## Rollback Safety

- Wallet constraint can be dropped without data loss
- Leaderboard function is idempotent
- `add_referral_points` function can be dropped, edge function would need revert

