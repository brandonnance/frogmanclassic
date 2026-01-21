# Frogman Classic Platform – Technical Spec & Implementation Outline

## Purpose
This document is a technical handoff spec intended for implementation by Claude or another LLM-assisted developer. It describes data models, workflows, and system behavior without UI polish concerns.

---

## High-Level Architecture

- Web application (single domain, multi-year)
- Passwordless authentication via signed edit tokens
- Event-year–scoped data
- External systems:
  - Stripe (payments)
  - Golf Genius (scoring / leaderboard)

---

## Core Entities

### EventYear
- id
- year
- start_date
- end_date
- is_active

### Sponsor
- id
- event_year_id
- name
- contact_name
- contact_email
- payment_method (stripe | check | invoice)
- payment_status (pending | paid)
- total_credits
- credits_used

### SponsorCredit
- id
- sponsor_id
- redeemed_by_team_id (nullable)
- redeemed_at (nullable)

### Team
- id
- event_year_id
- event_type (friday | sat_sun)
- team_name (nullable; required for friday if no sponsor)
- sponsor_id (nullable)
- credit_id (nullable)
- session_pref (am | pm | none)
- notes
- withdrawn_at (nullable)

### Player
- id
- first_name
- last_name
- email (nullable)
- phone (nullable)
- ghin
- handicap_raw
- plays_yellow_tees (bool)
- handicap_playing (computed)
- last_handicap_update_at

### TeamPlayer (join)
- team_id
- player_id
- role (player | seal_guest)

---

## Handicap Logic

```
if plays_yellow_tees:
    handicap_playing = handicap_raw - 2
else:
    handicap_playing = handicap_raw
```

Team combined handicap = sum(handicap_playing)

---

## Flight Calculation (Sat/Sun)

1. Sort teams by combined handicap ascending
2. Determine midpoint index
3. Include all teams with handicap <= cutoff handicap in Flight 1
4. Remaining teams = Flight 2

Store flight as computed field, recalc on handicap update

---

## GHIN Status Indicator

```
if handicap_raw is null or ghin == 'NONE': status = 'missing'
elif now - last_handicap_update_at <= 4 days: status = 'fresh'
else: status = 'stale'
```

---

## Registration Workflows

### Sponsor Signup
- Select tier
- Payment or mark offline
- Generate edit token
- Send confirmation email

### Team Signup
- Select event
- Enter players
- Choose sponsor credit OR direct pay
- Generate team edit token

### Team Withdrawal
- Soft-delete team
- Restore sponsor credit
- Notify sponsor

---

## Admin Capabilities

- Add/edit/remove sponsors
- Add/edit/remove teams
- Add/edit players
- Inline edit player handicap
- Assign/revoke sponsor credits
- Export CSVs

---

## Tee Sheets

### Data
- event_day
- session (am | pm)
- hole_number
- team_ids[]

### Desktop
- Drag & drop assignment

### Mobile
- Move / swap actions only

---

## Notifications

Event-based email triggers:
- Sponsor payment
- Credit redeemed/restored
- Team confirmed/withdrawn
- Tee sheets published

Role-gated recipients

---

## Year Rollover

- Duplicate sponsorship tiers
- Reset credits
- Carry forward player directory
- New EventYear record

---

## Out of Scope (v1)
- GHIN API integration
- Full Golf Genius API sync
- Public authentication accounts

---

## Demo / Mock Environment (Pre-Production)

### Purpose
This platform will first be built as a **live demo and mock environment** hosted at:

- `frogman.brandon-nance.com`

The demo is intended for:
- Stakeholder walkthroughs
- Feature validation
- UX iteration
- Blueprinting the production build

It should feel real and be fully navigable, but **does not require production-grade security or payments**.

---

### Demo Constraints

- **No authentication system required**
  - Admin routes are openly accessible for demo purposes
- **No Stripe / payment processing**
  - Payment states are mocked in data
- **No email sending**
  - Email events simulated with UI notifications or console logs
- **No database required** initially
  - Use static or in-memory mock data

---

### Suggested Tech Stack (Demo)

- Next.js (App Router or Pages Router)
- Tailwind CSS
- Optional: shadcn/ui for tables, dialogs, badges
- Local mock data stored in `/data/{eventYear}.json`

---

### Demo Data Requirements

Mock data should be realistic and sized appropriately:

- 20–40 Sponsors
- 150–200 Players
- Friday Teams:
  - 4-player default
  - Some 5-player teams with `seal_guest` role
- Sat/Sun Teams:
  - 2-player teams
  - GHIN provided or `NONE`
- Tee sheets pre-filled for demo purposes

---

### Demo Logic to Implement (High Value)

These calculations should be fully functional in the demo:

- GHIN freshness status
- Yellow/senior tee handicap adjustment
- Combined team handicap
- Flight calculation (inclusive cutoff rule)
- Sponsor credit consumption / restoration (client-side only)

---

### Admin Routes (Demo)

- `/admin` – Dashboard
- `/admin/sponsors` – Sponsor list + credits
- `/admin/teams` – Team management
- `/admin/players` – Player management (inline handicap editing)
- `/admin/tee-sheets` – Tee sheet builder

---

### Production Migration Plan

Once approved, this demo codebase will be:

- Migrated to `frogmanclassic.com`
- Wired to a real database
- Integrated with Stripe and email services
- Secured with token-based edit links

The demo should be written cleanly so UI components and logic can be reused in production.

---

## Notes for Claude
- Favor clarity and realism over completeness
- Build admin-first screens
- Mobile-first for intake, desktop-first for planning
- Assume director overrides are valid
- Write code as if it will become production later

