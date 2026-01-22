# Frogman Classic - Platform Documentation

## Current Status: LIVE
- **Live URL**: https://frogmanclassic.com
- **Sponsor Signup**: https://frogmanclassic.com/sponsor
- **Admin Panel**: https://frogmanclassic.com/admin
- **GitHub**: https://github.com/brandonnance/frogmanclassic

---

## CURRENT WORK IN PROGRESS

No active work in progress.

---

## Recently Completed

### Admin Teams Management (Jan 2026)
Full CRUD operations for teams with player management:
- ✅ Edit team metadata (name, session preference, notes)
- ✅ Add/remove players from teams with autocomplete search
- ✅ Player limits enforced (Friday = 5 players, Sat/Sun = 2 players)
- ✅ Soft-delete teams (sets `withdrawn_at` timestamp)
- ✅ Sponsor credit auto-restoration when sponsored teams are withdrawn
- ✅ Restore withdrawn teams (re-links credit if still available)
- ✅ Permanently delete withdrawn teams from database
- ✅ Withdrawn teams section with restore/delete actions

### Admin Sponsor Credit Adjustment (Jan 2026)
Director can modify sponsor credits at discretion:
- ✅ Increase credits: Automatically generates new redemption codes
- ✅ Decrease credits: Only unused credits can be removed
- ✅ Validation prevents reducing below used count
- ✅ Visual feedback shows available vs used credits
- ✅ Info messages explain what will happen on save
- ✅ Sponsor portal automatically reflects updated codes

### Admin Authentication (Jan 2026)
- ✅ Password-protected admin section (simple shared password, not full user auth)
- ✅ Middleware redirects unauthenticated users to `/admin/login`
- ✅ Session cookie lasts 3 days
- ✅ Logout button in admin sidebar
- ✅ Environment variable: `ADMIN_PASSWORD`

### Email Enhancements (Jan 2026)
- ✅ Player names included in team confirmation emails
- ✅ Updated GHIN messaging: "If there are any changes to a player's GHIN, please let the tournament director know ASAP"
- ✅ Changed "Questions?" to "Questions or changes?"

### Sponsorship & Pricing Updates (Jan 2026)
Implemented pricing and registration flow changes:

**Sponsorship Tier Updates:**
- ✅ Hole Sponsor: $1,000 → $1,500
- ✅ Event Sponsor: $1,500 → $2,000
- ✅ Renamed "$2,500 Hole Sponsor (w/ Dinner)" → "Frogman Sponsor"

**Sat/Sun Pricing & Sun Willows Discount:**
- ✅ Base price: $500 (was $400)
- ✅ Per-player Sun Willows discount: $50 off per member
  - 0 members: $500, 1 member: $450, 2 members: $400
- ✅ Changed from team-level checkbox to per-player checkboxes

**Friday Event - Sponsor Only:**
- ✅ Removed Friday from open registration
- ✅ All Friday entries require sponsor code
- ✅ Added info message directing users to sponsor packages
- ✅ API validation blocks Friday open registrations

**Session Times:**
- ✅ Morning: 7:30 AM (was just "AM")
- ✅ Afternoon: 1:00 PM (was just "PM")

### Players Page (Jan 2026)
- ✅ Filtering by registered/all, search by name/email/GHIN
- ✅ Sortable columns (name, handicap, home course)
- ✅ Inline editing for all fields
- ✅ Home course column added
- ✅ Add new player dialog

---

## Architecture Overview

### Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend
- **Deployment**: Vercel
- **DNS**: GoDaddy

### Core Entities

| Entity | Description |
|--------|-------------|
| `event_years` | Tournament year with dates and is_active flag |
| `sponsors` | Sponsor companies, scoped to event_year |
| `sponsor_credits` | Individual team entry credits, linked to sponsors |
| `players` | Persistent player directory (year-agnostic) |
| `teams` | Team registrations, scoped to event_year |
| `team_players` | Links players to teams |
| `tee_sheet_slots` | Tee time assignments |

### Year Scoping
- `sponsors` and `teams` have `event_year_id` foreign key
- `players` table is intentionally year-agnostic (persistent directory)
- Registration = player linked to a team via `team_players`
- `/api/teams` returns only players registered for the active year

---

## Completed Features

### Supabase & Database
- Database schema deployed via migrations
- All core tables created with proper relationships
- `package_id` column on sponsors for tracking sponsorship tier

### Redemption Code System
- Code format: `FROG-2025-XXXX` (4 random alphanumeric chars)
- Codes generated when sponsor is created (one per credit)
- States: Available (not redeemed) / Redeemed (linked to team)
- Codes restore when team is withdrawn/deleted

### Public Routes
- `/` - Homepage with event info and sponsor CTA
- `/register` - Open team registration (Sat/Sun only - Friday is sponsor-only)
- `/sponsor` - Sponsor signup with package selection
- `/sponsor/[token]` - Sponsor portal (view codes, resend emails, manage credits)
- `/sponsor/edit` - Edit sponsor details via access token
- `/redeem/[code]` - Team registration with code redemption (supports both events)

### Email Integration
- Resend configured with domain: `frogmanclassic.com`
- FROM address: `Frogman Classic <noreply@frogmanclassic.com>`
- Email types:
  - `sponsor_welcome` - All codes + portal link
  - `captain_code` - Single code to team captain
  - `team_confirmation` - Registration confirmed

### Admin Dashboard
- `/admin/login` - Password-protected login (3-day session)
- `/admin` - Dashboard with stats (sponsors, teams, players, credits)
- `/admin/sponsors` - Manage sponsors, view/adjust credits, payment status
- `/admin/teams` - Full team management (edit, delete, restore, player management)
- `/admin/players` - View all players with registered/all toggle, inline editing
- `/admin/tee-sheets` - Placeholder (coming soon)

### Player Import & Autocomplete
- Imported 165 players from GHIN CSV list
- Player autocomplete on registration forms
- Suffix field support (Jr, Sr, II, III, etc.)
- Search API endpoint: `/api/players/search`
- GHIN field conditional display (only for Sat/Sun events)

### Year Filtering (Admin)
- Dashboard shows "Registered Players" vs "Player Directory" counts
- Players page has tabs: "All Players" vs "Registered 2026"
- Sidebar displays active event year dynamically

---

## Sponsorship Packages

| ID | Name | Price | Credits | Extras |
|----|------|-------|---------|--------|
| banner | Banner Sponsor | $500 | 0 | - |
| hole_1000 | Hole Sponsor | $1,500 | 1 | ONE event |
| event_1500 | Event Sponsor | $2,000 | 2 | BOTH events |
| frogman | Frogman Sponsor | $2,500 | 2 | + dinner table |
| golf_cart | Golf Cart Sponsor | $5,000 | 2 | + SEAL play, dinner |
| driving_range | Driving Range Sponsor | $5,000 | 2 | + SEAL play, dinner |
| tee_block | Tee Block Sponsor | $7,500 | 2 | + SEAL play, dinner |
| flag | Flag Sponsor | $7,500 | 2 | + SEAL play, dinner |
| seal | SEAL Sponsor | $7,500 | 2 | + SEAL play (both events), dinner |
| tee_prize | Tee Prize Sponsor | $10,000 | 2 | + dinner |
| tournament | Tournament Sponsor | $20,000 | 5 | Event named after company |

### Credit System
- Credits = team entries into events
- "ONE Frogman event" = 1 credit
- "BOTH Frogman events" = 2 credits
- Tournament sponsor = 5 credits

### Entry Pricing
- **Friday Florida Scramble**: Sponsor entry only (no open registration)
- **Sat/Sun 2-Man Best Ball**: $500 base, $50 off per Sun Willows member
  - 0 members: $500
  - 1 member: $450
  - 2 members: $400

---

## API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/event-year` | GET | Get active event year |
| `/api/sponsors` | GET, POST | List/create sponsors |
| `/api/sponsors/[token]` | GET, PATCH, DELETE | Sponsor by access token |
| `/api/sponsors/[token]/credits/[creditId]` | PATCH | Update credit (resend email) |
| `/api/sponsors/edit` | GET, PATCH | Edit sponsor via token |
| `/api/sponsors/edit/credits/[creditId]` | PATCH | Edit credit email |
| `/api/teams` | GET | List all teams with players |
| `/api/teams/[id]` | PATCH, DELETE, POST | Edit/withdraw/restore/delete team |
| `/api/players` | GET | List all players |
| `/api/players/search` | GET | Search players by name |
| `/api/redeem/[code]` | POST | Redeem code (create team) |
| `/api/redeem/[code]/validate` | GET | Validate redemption code |
| `/api/email` | POST | Send emails via Resend |
| `/api/admin/auth` | POST, DELETE | Admin login/logout |

---

## Key Files

```
lib/
  supabase.ts         # Supabase client setup
  types.ts            # TypeScript interfaces
  codes.ts            # Redemption code generation
  email-templates.ts  # HTML email templates
  sponsorship-packages.ts  # Package definitions
  calculations.ts     # Utility calculations

app/
  sponsor/
    page.tsx          # Sponsor signup
    [token]/page.tsx  # Sponsor portal
    edit/page.tsx     # Edit sponsor
  redeem/
    [code]/page.tsx   # Team registration
  admin/
    page.tsx          # Dashboard
    layout.tsx        # Admin layout with sidebar
    login/page.tsx    # Admin login page
    login/layout.tsx  # Override layout (no sidebar)
    sponsors/page.tsx # Manage sponsors
    teams/page.tsx    # View teams
    players/page.tsx  # View players
    tee-sheets/page.tsx # Placeholder
  api/
    admin/auth/route.ts # Admin login/logout API

middleware.ts           # Admin route protection

components/
  admin/
    sidebar.tsx       # Admin navigation
  player-autocomplete.tsx  # Player search/select

scripts/
  import-ghin-list.ts # CSV import script
```

---

## Handicap Logic

```
if plays_yellow_tees:
    handicap_playing = handicap_raw - 2
else:
    handicap_playing = handicap_raw
```

Team combined handicap = sum(handicap_playing)

### GHIN Status Indicator
```
if handicap_raw is null or ghin == 'NONE': status = 'missing'
elif now - last_handicap_update_at <= 4 days: status = 'fresh'
else: status = 'stale'
```

### Flight Calculation (Sat/Sun)
1. Sort teams by combined handicap ascending
2. Determine midpoint index
3. Include all teams with handicap <= cutoff handicap in Flight 1
4. Remaining teams = Flight 2

---

## Remaining Work

### Priority: Before Tournament
- [ ] Tee sheet management (assign teams to tee times)
- [ ] GHIN handicap sync for players
- [x] Players page: sorting, inline editing
- [x] Teams page: edit, delete, restore functionality
- [x] Sponsor credit adjustment

### Future (After Non-Profit Setup)
- [ ] Stripe payment integration
- [ ] Online payment via sponsor portal

### Nice to Have
- [ ] Export functionality (CSV/Excel)
- [ ] Bulk email to all sponsors/captains
- [ ] Player statistics dashboard
- [ ] Historical year navigation (admin dropdown)
- [ ] "Setup next tournament" feature

---

## Deployment Info

### Vercel
- Auto-deploys from GitHub main branch
- Environment variables configured

### Supabase
- **URL**: https://zwdgwbhpntjolbpdzybi.supabase.co
- **Project ID**: zwdgwbhpntjolbpdzybi
- Keys stored in .env.local and Vercel

### GoDaddy DNS
- Domain: frogmanclassic.com → Vercel

---

## Security Notes
- Service role key rotated Jan 2025 (was exposed in .claude/settings.local.json)
- `.claude/` directory now in .gitignore
- All sensitive keys stored in .env.local (gitignored)
- Edit tokens provide passwordless access to sponsor/team data
- Admin section protected by shared password (`ADMIN_PASSWORD` env var)
- Admin auth uses httpOnly cookie with 3-day expiration

---

## MCP Servers Configured
- **Supabase**: Connected via PAT
- **Filesystem**: Connected
- **Context7**: Connected

---

## Original Tech Spec Reference

### Registration Workflows

**Sponsor Signup**
- Select tier
- Payment or mark offline
- Generate edit token
- Send confirmation email

**Team Signup**
- Select event
- Enter players
- Choose sponsor credit OR direct pay
- Generate team edit token

**Team Withdrawal**
- Soft-delete team
- Restore sponsor credit
- Notify sponsor

### Admin Capabilities
- ✅ Add/edit/remove sponsors
- ✅ Add/edit/remove teams (with player management)
- ✅ Add/edit players
- ✅ Inline edit player handicap
- ✅ Assign/revoke sponsor credits
- [ ] Export CSVs

### Tee Sheets (Planned)
- event_day, session (am/pm), hole_number, team_ids[]
- Desktop: Drag & drop assignment
- Mobile: Move / swap actions only

### Year Rollover (Future)
- Duplicate sponsorship tiers
- Reset credits
- Carry forward player directory
- New EventYear record
