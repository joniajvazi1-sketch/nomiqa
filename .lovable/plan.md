

# Cloud Cost Reduction — All Changes

## Why You're Getting Charged So Much on Small

You have **two duplicate airlo-products cron jobs** (job 1 every 55min AND job 5 every hour), **coverage_tiles refreshing every 15 minutes**, and the **chatbot on 13+ pages** making AI calls. On a Small instance, every edge function invocation and materialized view refresh counts significantly.

## Changes

### 1. Remove Chatbot from Low-Value Pages (9 pages)

Remove `<SupportChatbot />` from: Terms, Privacy, Roadmap, About, Rewards, Download, Affiliate, Index, Token/NetworkDashboard.

Keep it only on: **Help, ShopPage, GettingStarted, MyAccount**.

### 2. Add Daily Message Cap (15/day) in SupportChatbot

Add a localStorage-based counter that resets daily. After 15 messages, show "Daily limit reached — email support@nomiqa-depin.com".

### 3. Trim Conversation History to Last 6 Messages

In `SupportChatbot.tsx`, only send the last 6 messages to the edge function. In `chat-support/index.ts`, change `.max(20)` to `.max(8)` in the schema validation. This cuts token cost per call by ~60%.

### 4. Fix Duplicate Cron Jobs and Reduce Frequencies

Using the insert tool (data operations):
- **Delete job 1** (duplicate airlo-products every 55min)
- **Update job 5** (airlo-products): change from `0 * * * *` to `0 */6 * * *` (every 6 hours)
- **Update job 13** (coverage_tiles): change from `*/15 * * * *` to `0 */4 * * *` (every 4 hours instead of every 15 min — this alone saves ~90 edge function calls/day)
- **Update job 15** (qoe_scores): change from `15 */6 * * *` to `15 */12 * * *` (every 12 hours)

### 5. Deploy Updated Edge Function

Deploy `chat-support` with the trimmed message limit.

## Expected Savings

| Change | Impact |
|---|---|
| Remove duplicate airlo cron | ~24 fewer edge calls/day |
| Coverage tiles 15min → 4hr | ~90 fewer DB refreshes/day |
| Chatbot removal from 9 pages | ~60-70% fewer AI calls |
| Message cap + history trim | ~40% less token cost per remaining call |
| **Combined** | **Estimated 50-70% cost reduction** |

## Files Modified

- `src/pages/Terms.tsx` — remove SupportChatbot
- `src/pages/Privacy.tsx` — remove SupportChatbot
- `src/pages/Roadmap.tsx` — remove SupportChatbot
- `src/pages/About.tsx` — remove SupportChatbot
- `src/pages/Rewards.tsx` — remove SupportChatbot
- `src/pages/Download.tsx` — remove SupportChatbot
- `src/pages/Affiliate.tsx` — remove SupportChatbot
- `src/pages/Index.tsx` — remove SupportChatbot
- `src/pages/NetworkDashboard.tsx` — remove SupportChatbot
- `src/components/SupportChatbot.tsx` — add 15/day message cap, trim history to 6
- `supabase/functions/chat-support/index.ts` — change max messages from 20 to 8
- Cron job data updates via insert tool (delete job 1, update jobs 5/13/15)

