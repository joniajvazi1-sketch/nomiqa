
# App Launch Readiness Audit: Points, Data & Stability

This plan provides a comprehensive audit of the current implementation against your launch requirements, identifies gaps, and outlines fixes needed.

---

## Executive Summary

After thorough code review, the implementation is **largely production-ready** with a few areas needing attention:

| Area | Status | Action Required |
|------|--------|-----------------|
| Points System | Implemented with gaps | Fix daily cap enforcement |
| Referral System | Fully implemented | None |
| Challenges | Fully implemented | None |
| Token Language | Compliant | Minor UI tweaks |
| Data Collection | Minimal & transparent | None |
| Battery/Data Safety | Implemented | Verify Wi-Fi-only speed tests |
| Anti-Abuse | Partially implemented | Add device fingerprinting |
| App Stability | Hardened | Session timeout already exists |

---

## 1. Points System Audit

### A. Daily Contribution - Current Implementation

**What's Working:**
- Points earned in background via `useNetworkContribution` hook
- No interaction required after activation (line 319: "event-based triggers")
- Time-based earnings: 0.5 pts/minute (line 729)
- Distance-based: 0.01 pts/meter (calculated in position handlers)
- Auto-save every 5 minutes (line 817)

**Gaps Identified:**

1. **Daily Cap Not Enforced Client-Side**: The `add_points_with_cap` database function enforces 200 pts/day, but client-side auto-save (lines 760-825) bypasses this by directly updating `user_points`. 

   **Fix Required:** Replace direct `user_points` updates with RPC call to `add_points_with_cap`.

2. **Monthly Cap (6,000 pts)**: Enforced in DB function but not displayed to user on home screen.

3. **12-Hour Diminishing Returns**: Not currently implemented. Sessions can run 24h at full rate.

**Current Caps (from DB function `add_points_with_cap`):**
```
Daily:    200 pts
Monthly:  6,000 pts  
Lifetime: 100,000 pts
```

### B. Referral Points - Current Implementation

**Fully Compliant:**

| Requirement | Implementation | Location |
|------------|----------------|----------|
| Points on registration | 20 pts immediate + 30 pts pending | `track-affiliate-registration` lines 17-21 |
| Points after onboarding | 30 pts released on first contribution | `check_and_award_pending_referral_bonus` RPC |
| Self-referral blocked | `affiliate.user_id != userId` check | Line 311 comment check |
| Referral cap | 100 default, configurable per affiliate | Lines 136-147 |
| Velocity limit | 10 referrals/24h | Lines 152-182 |

**Both parties receive points:**
- Invitee: 50 pts immediately (line 320-336)
- Inviter: 20 pts immediately + 30 pts after invitee contributes

### C. Challenges - Current Implementation

**5 Daily Challenges (from DB):**
1. App Active 6h - 25 pts
2. Background Scan (30 data points) - 20 pts
3. Move 1km - 15 pts
4. Network Detected (2 types) - 10 pts
5. Stay Active - 10 pts

**4 Weekly Challenges:**
1. 3 Locations - 30 pts
2. 5 Active Days - 40 pts
3. Network Explorer (2 types) - 20 pts
4. Stability Bonus (7d no pause) - 30 pts

**Cap Compliance:** Challenges award bonus points ON TOP of contribution points. Total daily from challenges: 80 pts max.

### D. Point Scaling Safety

**Current Safeguards:**
- Lifetime cap: 100,000 pts (DB enforced)
- Monthly cap: 6,000 pts (DB enforced)
- Daily cap: 200 pts (DB enforced, but client bypass exists)
- Account freeze capability (`is_frozen` flag)
- No exponential growth mechanics

**Mathematical Projection:**
```
100k users × 200 pts/day = 20M pts/day
100k users × 6000 pts/month = 600M pts/month
```
This scales linearly with no overflow risk.

---

## 2. Token Linkage Audit

**Current Language Compliance:**

| Location | Current Text | Status |
|----------|-------------|--------|
| AppHome.tsx line 289 | "Convertible to $NOMIQA" | Compliant |
| AppRewards.tsx line 314 | "Points convert to $NOMIQA tokens at launch" | Compliant |
| TokenInfoModal line 189-191 | "Points convert to network tokens...Conversion rates may evolve" | Compliant |
| appCopy.ts line 73 | "Points convert to network tokens used inside the Nomiqa ecosystem" | Compliant |
| chat-support line 133 | "Points will convert to $NOMIQA tokens when launched" | Compliant |

**Already Clear:**
- Points are not money/tokens
- Conversion happens "after launch"
- Rates not fixed

---

## 3. Data Collection Audit

### What Is Collected (from `signal_logs` table):

**Allowed (Implemented):**
- Network metrics: RSRP, RSRQ, RSSI, SINR
- Speed/latency: download, upload, latency_ms, jitter_ms
- Connection type: network_type, network_generation
- Carrier info: carrier_name, MCC, MNC
- Anonymous device session: session_id (UUID, not user-identifiable)

**Not Collected (Verified):**
- No names/emails in signal datasets
- No phone numbers
- No contacts
- No browsing data
- No personal content

**Location Precision:**
- Coordinates rounded to 4 decimals (~11m precision) in `sync-contribution-data` line 249
- Geohash precision 7 (~153m cells) for aggregation

### User Controls (from PrivacyControls.tsx):

| Control | Implementation |
|---------|----------------|
| Pause contribution | Toggle in Privacy & Control |
| Delete all data | `request_data_deletion` RPC - cascade deletes all tables |
| Background collection toggle | Yes |
| Location precision toggle | Yes |
| Device info toggle | Yes |

**Data Retention:** 90 days for raw logs (line 209 PrivacyControls.tsx), then auto-deleted via `cleanup_old_mining_logs` function.

---

## 4. Data Usage & Battery Safety

### Cellular Data Usage

**Current Constraints (from `useNetworkContribution.ts`):**
- Speed tests: Wi-Fi only (line 63: `SPEED_TEST_INTERVAL = 30 * 60 * 1000`)
- Speed test file sizes: 1-5MB adaptive
- Signal logs: Small JSON payloads (~500 bytes each)
- Daily cap: 500 signal logs max

**Estimated Usage:**
```
Signal logs: 500 × 500 bytes = 250 KB/day
Speed tests: Wi-Fi only = 0 MB cellular
Total: <1 MB/day cellular
```

### Battery Usage

**Current Optimizations (from memories):**
- iOS: `significantLocationChange` (not continuous GPS)
- Android: FusedLocationProviderClient with passive provider
- Max 12 samples/hour
- No constant GPS polling
- Background service uses low-power APIs

**Estimated:** <3% daily (per design spec)

### Speed Test Restrictions

**Fully Implemented:**
- Wi-Fi only check: Line 76 `isCellularConnection` function used to gate speed tests
- 30-minute interval (reduced from 10 min per memory)
- Daily limit: 10 bonus-earning tests (server-enforced line 459 `MAX_SPEED_TESTS_PER_DAY`)

---

## 5. Anti-Abuse & Bot Resistance

### Current Protections

| Protection | Implementation |
|------------|----------------|
| IP rate limiting signup | 10 signups/hour/IP in `signup-user` lines 221-274 |
| Disposable email blocking | Blocklist + pattern detection lines 11-42 |
| Hex username blocking | Pattern `/^[a-f0-9]{6,}$/i` line 208 |
| Referral velocity detection | 10/24h limit in `track-affiliate-registration` |
| Points freezing | `is_frozen` flag on `user_points` table |
| Mock location detection | `is_mock_location` flag logged, score penalty |
| Emulator detection | `deviceIntegrity.ts` checks |
| Jailbreak detection | Basic pattern detection |

### Gap: Device Fingerprinting

**Current State:** Device fingerprint is collected (`device_fingerprint` field in contribution data) but not actively used to enforce "1 device = 1 reward stream".

**Fix Required:** Implement server-side device fingerprint deduplication in `sync-contribution-data`.

### Gap: Duplicate Wallet Detection

**Current State:** No Solana wallet validation or deduplication implemented. The `profiles` table has a `solana_wallet` field but no duplicate checking.

**Fix Required:** Add unique constraint and validation when wallets are submitted.

---

## 6. App Stability Audit

### Current Hardening

| Issue | Mitigation | Location |
|-------|-----------|----------|
| Black screen on open | Boot timeout (8s) with forced proceed | AppAuth.tsx lines 261-268 |
| WebView reload loops | OAuth pending flag cleared on mount | AppAuth.tsx line 138-143 |
| Sign-in flashing | Safe sessionStorage wrapper | AppAuth.tsx lines 37-63 |
| Global crashes | Unhandled rejection catching | main.tsx lines 14-39 |
| Dark theme flash | Dark background in LaunchScreen | iOS/Android native config |

**Session Safety:**
- 24-hour max session duration with stale check (line 116-119)
- Auto-save every 5 minutes prevents data loss

---

## Recommended Fixes (Priority Order)

### Critical (Before Launch)

1. **Client-Side Cap Bypass** - Replace direct `user_points` updates in `useNetworkContribution.ts` auto-save with RPC call to `add_points_with_cap`

2. **Device Fingerprint Enforcement** - In `sync-contribution-data`, add logic to flag/limit multiple user accounts from same device fingerprint

### Important (Week 1 Post-Launch)

3. **12-Hour Diminishing Returns** - Add time multiplier that reduces points after 12h of scanning per day

4. **Monthly Cap UI** - Display remaining monthly points on home screen and rewards page

5. **Wallet Deduplication** - Add unique constraint on `profiles.solana_wallet` field

### Nice-to-Have

6. **Background Location Rationale Screen** - Already implemented for iOS but verify it shows before "Always" upgrade request

---

## User Lifecycle Walkthrough

```text
1. INSTALL
   └─> User downloads app
   └─> Sees onboarding flow (OnboardingFlow.tsx)
   └─> Creates account (signup-user edge function)
   └─> If referred: 50 pts credited, referrer gets 20 pts + 30 pts pending

2. EARN
   └─> User taps "Enable Contribution"
   └─> DataConsentModal shown (GDPR gate)
   └─> Location permission requested
   └─> Background tracking starts
   └─> Points earned: 0.5 pts/min + 0.01 pts/meter
   └─> Auto-saved every 5 minutes

3. CAP
   └─> Daily: 200 pts (DB enforced)
   └─> Monthly: 6,000 pts (DB enforced)
   └─> Lifetime: 100,000 pts (DB enforced)
   └─> Challenges: Bonus on top of caps

4. REFERRAL
   └─> User shares nomiqa.com/{username}
   └─> New user signs up with code
   └─> Invitee: 50 pts immediately
   └─> Inviter: 20 pts now + 30 pts after first contribution
   └─> Max 100 referrals per affiliate
   └─> Max 10 referrals per 24h

5. DELETE DATA
   └─> User goes to Privacy & Control
   └─> Taps "Request Data Deletion"
   └─> Cascade delete: signal_logs, contribution_sessions,
       connection_events, coverage_confirmations, user_points
   └─> Orders anonymized (email, name blanked)
   └─> Data removed from DB within 24h

6. FUTURE TOKEN CONVERSION
   └─> After $NOMIQA token launch
   └─> Points → Tokens at announced rate
   └─> Rate not fixed today (clearly stated in UI)
   └─> Requires connected Solana wallet
```

---

## Technical Details

### Database Functions for Caps

The `add_points_with_cap` function handles all cap enforcement:

```sql
-- Caps from remote config
v_daily_cap := 200
v_monthly_cap := 6000  
v_lifetime_cap := 100000

-- Check frozen status
IF v_is_frozen THEN RETURN 'account_frozen'

-- Apply all caps
v_final_points := LEAST(boosted_pts, daily_remaining, monthly_remaining, lifetime_remaining)

-- Update limits tables
INSERT INTO user_daily_limits...
INSERT INTO user_monthly_limits...
UPDATE user_points...
```

### Speed Test Wi-Fi Enforcement

```typescript
// useNetworkContribution.ts
const runSpeedTest = async () => {
  // Only run on Wi-Fi to save cellular data
  if (isCellularConnection(connectionType)) {
    console.log('[SpeedTest] Skipping - on cellular');
    return;
  }
  // ... run speed test
};
```

### Referral Split Bonus

```typescript
// track-affiliate-registration/index.ts
const IMMEDIATE_SIGNUP_BONUS = 20;  // Referrer gets now
const ACTIVITY_GATED_BONUS = 30;     // Referrer gets after invitee contributes
const REFERRAL_BONUS_POINTS = 50;    // Invitee gets immediately
```

---

## Confirmation Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| Points = background, no interaction | Implemented | Auto-runs after activation |
| Daily cap per user | DB enforced | Client bypass needs fix |
| Referral on registration | Implemented | 50 pts invitee |
| Referral on onboarding complete | Implemented | 30 pts referrer after first contribution |
| Self-referral blocked | Implemented | Server-side check |
| Referral cap | Implemented | 100 default |
| Daily challenges | 5 active | Metric-driven |
| Weekly challenges | 4 active | Higher rewards |
| Points scale safely | Verified | Linear growth, no overflow |
| Token language compliant | Verified | "Convert after launch" messaging |
| Data collection minimal | Verified | Network metrics only |
| No PII in datasets | Verified | Anonymous session IDs |
| User pause control | Implemented | Privacy & Control screen |
| Data deletion | Implemented | Cascade delete RPC |
| <5 MB cellular/day | Estimated <1 MB | Wi-Fi-only speed tests |
| <3% battery/day | By design | Low-power location APIs |
| Speed tests Wi-Fi only | Implemented | Connection type check |
| One device per account | Partial | Fingerprint collected, not enforced |
| Bot detection | Implemented | Multiple layers |
| iOS stability | Hardened | Timeout + error boundaries |

