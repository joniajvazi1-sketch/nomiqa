

# Revised: Nomiqa University Project Deliverables

## Corrections Applied
- Removed spin wheel, leaderboard, and biometric authentication
- Renamed "Contributor Level Progress" → "Affiliate Progress" (tier progression based on team size/referrals)
- Removed EPIC 6 (Marketing Website) entirely — focus is only on the mobile app
- Email delivery uses Resend API (for eSIM order emails, support, and all transactional emails)

## 7 EPICs → 6 EPICs (Website removed)

### EPIC 1: DePIN Network Contribution (Core Product)
| ID | User Story |
|----|-----------|
| NC-1 | As a user, I want to passively collect signal data in the background so I earn points without active interaction |
| NC-2 | As a user, I want to run speed tests to contribute download/upload/latency data |
| NC-3 | As a user, I want to see my contribution session history and stats |
| NC-4 | As a user, I want coverage confirmations to validate network quality at my location |
| NC-5 | As a user, I want connection state changes tracked (WiFi-to-cellular transitions) |
| NC-6 | As a user, I want data quality scoring so higher quality contributions earn more |
| NC-7 | As an admin, I want to export aggregated coverage data for B2B sales |

### EPIC 2: Tokenomics & Points Economy
| ID | User Story |
|----|-----------|
| TE-1 | As a user, I want to earn points for background contributions with daily/monthly caps |
| TE-2 | As a user, I want streak bonuses for consecutive days of contribution |
| TE-3 | As a user, I want daily check-ins to build my streak |
| TE-4 | As a user, I want weekly/monthly challenges for bonus points |
| TE-5 | As a user, I want to set personal goals |
| TE-6 | As a user, I want to earn points from social tasks (follow on Twitter, join Telegram) |
| TE-7 | As a system, points must be frozen if fraud is detected |

### EPIC 3: eSIM Marketplace
| ID | User Story |
|----|-----------|
| ES-1 | As a user, I want to browse eSIM plans by country |
| ES-2 | As a user, I want to purchase an eSIM with Stripe (card) |
| ES-3 | As a user, I want to purchase an eSIM with crypto (Helio/Solana) |
| ES-4 | As a user, I want async eSIM provisioning via API |
| ES-5 | As a user, I want to view my eSIM installation instructions (QR code, LPA, manual) |
| ES-6 | As a user, I want to track my eSIM data usage |
| ES-7 | As a user, I want order confirmation emails with eSIM details (via Resend) |

### EPIC 4: User Authentication & Account Management
| ID | User Story |
|----|-----------|
| AU-1 | As a user, I want to register with email and password |
| AU-2 | As a user, I want to verify my email with a 6-digit code |
| AU-3 | As a user, I want to reset my password |
| AU-4 | As a user, I want to choose a unique username |
| AU-5 | As a user, I want to connect my Solana wallet |
| AU-6 | As a user, I want to delete my account and all data |
| AU-7 | As a user, I want OAuth login (Google) |
| AU-8 | As an admin, I want to view/manage users |

### EPIC 5: Referral & Affiliate System
| ID | User Story |
|----|-----------|
| RF-1 | As a user, I want a unique referral code to share |
| RF-2 | As a user, I want to apply a referral code during registration |
| RF-3 | As a user, I want to earn 10% commission on my referrals' point earnings |
| RF-4 | As a user, I want to track my referral conversions |
| RF-5 | As a user, I want to share my code via native share |
| RF-6 | As a system, referral velocity must be rate-limited to prevent abuse |
| RF-7 | As a user, I want to see my affiliate tier progress (Starter → Builder → Leader → Ambassador → Pioneer) based on team size |

### EPIC 6: Mobile App Platform (Capacitor/Native)
| ID | User Story |
|----|-----------|
| MA-1 | As a user, I want native Android/iOS app with bottom tab navigation |
| MA-2 | As a user, I want background location tracking with proper permissions |
| MA-3 | As a user, I want telephony info (carrier, network type, signal) |
| MA-4 | As a user, I want haptic feedback and sound effects |
| MA-5 | As a user, I want pull-to-refresh on all screens |
| MA-6 | As a user, I want an onboarding flow on first launch |
| MA-7 | As a user, I want push notifications |
| MA-8 | As a user, I want offline support |
| MA-9 | As a user, I want data consent controls (GDPR) |
| MA-10 | As a user, I want an interactive network globe visualization |
| MA-11 | As a user, I want app version gating for points earning |

## Deliverables to Generate

| File | Contents |
|------|----------|
| `nomiqa-epics-user-stories.pdf` | All 6 EPICs with user stories, acceptance criteria, and tasks — ready to paste into Jira |
| `nomiqa-pitch-deck.pdf` | Professional pitch presentation (app-focused, no website mention) |
| `nomiqa-project-documentation.pdf` | Full documentation covering Process, Outcome, Presentation, Documentation grading criteria |
| `nomiqa-jira-import.csv` | CSV file for Jira bulk import with all issues pre-formatted |

## Key Adjustments in All Documents
- App-only focus throughout (no website/landing page references)
- Affiliate progress tiers (team-size-based) instead of contributor levels
- Resend API for all email delivery (eSIM confirmations, support, transactional)
- No spin wheel, no leaderboard, no biometric auth
- Team: Joni Ajvazi, Achref Ouslati

## Implementation
Generate all 4 PDFs + CSV using Python scripts, write to `/mnt/documents/`, QA each visual output before delivering.

