

# Redesign Referral Code Sections (Profile + MyAccount)

## What's changing

Two separate referral code UIs need visual upgrades:
1. **Mobile App Profile** (`AppProfile.tsx`, lines 632-766) — the "Invite & Earn" card with inline code editing
2. **Web MyAccount** (`ReferralCodeSection.tsx`) — standalone component with code display, edit, and apply sections

Both already support changing the referral code. The goal is to make them visually polished and ensure the "change code" feature is clearly accessible on the profile.

## Design Changes

### 1. AppProfile.tsx — Invite & Earn Card (lines 632-766)

**Current issues:** Plain card, small tap targets, code display is a basic mono text row, "Customize your code" is a tiny underlined link that's easy to miss.

**Redesign:**
- Add a subtle gradient accent strip at the top of the card
- Make the referral code display larger and more prominent with a pill-shaped container, centered bold mono text, and a gradient background
- Replace the tiny "Customize your code (one-time)" link with a visible icon button (Pencil) next to the code display — same row, always visible unless already changed
- Add a subtle "tap to copy" hint animation on the code pill
- Improve the edit mode: larger input with inline character counter, clearer save/cancel buttons
- Stats bar: add subtle icons for Team Members and Team Points
- "Got a Referral Code?" section: make the Apply button more prominent with a gradient outline style

### 2. ReferralCodeSection.tsx (web version)

**Current issues:** Functional but plain. The code is shown as oversized text. Apply section looks disconnected.

**Redesign:**
- Wrap the entire section in a single cohesive card with a subtle gradient border
- Code display: centered pill with copy-on-click, subtle shimmer animation on hover
- Change button: show as an icon button beside the code (not below), with tooltip
- Apply section: compact inline form with real-time validation indicator (already exists, just tighten spacing)
- Add micro-interactions: copy confirmation with checkmark animation

## Files Changed (2)

| File | Changes |
|------|---------|
| `src/pages/app/AppProfile.tsx` | Redesign the Invite & Earn card (lines 632-766): larger code display pill, visible edit button, improved stats bar, better apply referral section |
| `src/components/ReferralCodeSection.tsx` | Visual refresh: gradient border card, pill-style code display, tighter layout, hover shimmer on copy |

## Technical Notes
- No backend changes needed — all logic (change code, apply code, copy) already works
- No new dependencies — uses existing Tailwind utilities and shadcn components
- The `update-referral-code` edge function already handles the one-time change restriction server-side

