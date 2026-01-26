
# Data Usage Optimization Plan

## Problem Summary

Your app is consuming ~300 MB in 30 hours due to **speed tests running on cellular networks every 10 minutes**. Speed tests download 3-25 MB files each time, which adds up to massive data usage.

## What's Eating the Data

| Source | Frequency | Data per Event | 30-Hour Total |
|--------|-----------|----------------|---------------|
| **Speed Tests** | Every 10 min | 3-25 MB | **~180-1800 MB** |
| Signal Logs | Every 5 min or 100m | ~3 KB | ~1 MB |
| Auto-Save | Every 5 min | ~1 KB | Negligible |

**Speed tests are responsible for 95%+ of the data usage.**

## Technical Solution

### Change 1: Wi-Fi Only Speed Tests (Critical)

Disable automatic speed tests on cellular entirely. Only run them on Wi-Fi.

**File:** `src/hooks/useNetworkContribution.ts`

```typescript
// Line ~1169-1179: Modify speed test timer
speedTestTimerRef.current = setInterval(async () => {
  // ONLY run speed tests on WiFi to save cellular data
  if (connectionType.toLowerCase() === 'wifi') {
    await runSpeedTestWithBonus();
  } else {
    console.log('[NetworkContribution] Skipping speed test on cellular (data saver)');
  }
}, SPEED_TEST_INTERVAL);

// Also update initial speed test
setTimeout(() => {
  if (connectionType.toLowerCase() === 'wifi') {
    runSpeedTestWithBonus();
  }
}, 5000);
```

### Change 2: Reduce Speed Test Frequency

Even on Wi-Fi, every 10 minutes is aggressive. Change to every 30 minutes.

**File:** `src/hooks/useNetworkContribution.ts`

```typescript
// Line ~63: Change interval
const SPEED_TEST_INTERVAL = 30 * 60 * 1000; // Run speed test every 30 minutes (was 10)
```

### Change 3: Batch Signal Log Uploads (Optional)

Instead of uploading each log immediately, batch them and sync every 15 minutes.

**File:** `src/hooks/useNetworkContribution.ts`

- Add signal logs to local queue instead of calling edge function immediately
- Flush the queue every 15 minutes OR when switching to Wi-Fi
- Estimated savings: ~50% reduction in network overhead

### Change 4: Add Data Usage Settings UI (Future)

Add user-configurable settings:
- "Wi-Fi Only Mode" toggle (default: ON)
- "Speed Test Frequency" selector (30 min, 1 hour, manual only)
- "Daily Cellular Cap" (3 MB, 10 MB, 50 MB)

## Expected Results After Fix

| Metric | Before | After |
|--------|--------|-------|
| Daily Cellular Usage | ~240 MB | **< 5 MB** |
| Monthly Cellular | ~7 GB | **< 150 MB** |
| Speed Tests on Cellular | Every 10 min | **None (Wi-Fi only)** |

## Implementation Order

1. **Immediate (Critical):** Make speed tests Wi-Fi only - this alone cuts 95% of data usage
2. **Quick Win:** Increase speed test interval from 10 to 30 minutes
3. **Optional:** Batch signal log uploads for additional efficiency
4. **Future:** Add user settings UI for data preferences

## Files to Modify

- `src/hooks/useNetworkContribution.ts` - Speed test logic and intervals
- `src/hooks/useTelcoMetrics.ts` - (Optional) Add batching support

---

## Technical Details

### Current Speed Test File Sizes

```typescript
// speedTestProviders.ts lines 39-43
const DOWNLOAD_SIZES = {
  small: 3_000_000,   // 3MB for 2G/3G
  medium: 10_000_000, // 10MB for 4G/LTE
  large: 25_000_000,  // 25MB for 5G
};
```

The system adaptively selects file size based on network type. On 5G, it downloads 25 MB per speed test. With 6 tests/hour for 30 hours = 180 tests = **4.5 GB potential on 5G**.

### Signal Log Payload Size

Each signal log is approximately 2-4 KB of JSON containing:
- GPS coordinates
- Signal metrics (RSRP, RSRQ, SINR)
- Device info
- Network type
- Speed test results (if cached)

At max 12 samples/hour, this is ~50 KB/hour - negligible compared to speed tests.
