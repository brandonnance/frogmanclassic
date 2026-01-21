# Frogman Classic - Sponsorship & Supabase Integration Plan

## Current Status: LIVE
- **Live URL**: https://frogman.brandon-nance.com
- **Sponsor Signup**: https://frogman.brandon-nance.com/sponsor
- **Admin Panel**: https://frogman.brandon-nance.com/admin

---

## Completed Features

### Phase 1: Supabase Setup ✅
- Database schema deployed via migrations
- Tables: event_years, sponsors, sponsor_credits, players, teams, team_players, tee_sheet_slots
- Added `package_id` column to sponsors table for tracking sponsorship tier

### Phase 2: Redemption Code System ✅
- Code format: `FROG-2025-XXXX` (4 random alphanumeric chars)
- Codes generated when sponsor is created (one per credit)
- States: Available (not redeemed) / Redeemed (linked to team)
- Codes restore when team is withdrawn/deleted

### Phase 3: Public Routes ✅
- `/sponsor` - Sponsor signup with package selection
- `/sponsor/[token]` - Sponsor portal (view codes, resend emails, manage credits)
- `/sponsor/edit` - Edit sponsor details via access token
- `/redeem/[code]` - Team registration with code redemption

### Phase 4: Email Integration ✅
- Resend configured with domain: `frogman.brandon-nance.com`
- FROM address: `Frogman Classic <noreply@frogman.brandon-nance.com>`
- Email types:
  - `sponsor_welcome` - All codes + portal link
  - `captain_code` - Single code to team captain
  - `team_confirmation` - Registration confirmed

### Phase 5: Admin Dashboard ✅
- `/admin` - Dashboard with stats (sponsors, teams, players, credits)
- `/admin/sponsors` - Manage sponsors, view credits, payment status
- `/admin/teams` - View registered teams
- `/admin/players` - View all players
- `/admin/tee-sheets` - Placeholder (coming soon)

### Credit System ✅
- Credits = team entries into events
- "ONE Frogman event" = 1 credit
- "BOTH Frogman events" = 2 credits
- Tournament sponsor = 5 credits

---

## Deployment Info

### Vercel
- Auto-deploys from GitHub main branch
- Environment variables configured

### Cloudflare DNS
- CNAME: frogman.brandon-nance.com → cname.vercel-dns.com

### GitHub
- Repo: https://github.com/brandonnance/frogmanclassic

---

## Supabase Project Info
- **URL**: https://zwdgwbhpntjolbpdzybi.supabase.co
- **Project ID**: zwdgwbhpntjolbpdzybi
- **Keys**: Stored in .env.local and Vercel (rotated Jan 2025)

---

## Sponsorship Packages

| ID | Name | Price | Credits | Extras |
|----|------|-------|---------|--------|
| banner | Banner Sponsor | $500 | 0 | - |
| hole_1000 | Hole Sponsor | $1,000 | 1 | ONE event |
| event_1500 | Event Sponsor | $1,500 | 2 | BOTH events |
| hole_2500 | Hole Sponsor (w/ Dinner) | $2,500 | 2 | + dinner table |
| golf_cart | Golf Cart Sponsor | $5,000 | 2 | + SEAL play, dinner |
| driving_range | Driving Range Sponsor | $5,000 | 2 | + SEAL play, dinner |
| tee_block | Tee Block Sponsor | $7,500 | 2 | + SEAL play, dinner |
| flag | Flag Sponsor | $7,500 | 2 | + SEAL play, dinner |
| seal | SEAL Sponsor | $7,500 | 2 | + SEAL play (both events), dinner |
| tee_prize | Tee Prize Sponsor | $10,000 | 2 | + dinner |
| tournament | Tournament Sponsor | $20,000 | 5 | Event named after company |

---

## Remaining Work

### Priority: Before Tournament
- [ ] Tee sheet management (assign teams to tee times)
- [ ] GHIN handicap sync for players

### Future (After Non-Profit Setup)
- [ ] Stripe payment integration
- [ ] Online payment via sponsor portal

### Nice to Have
- [ ] Export functionality (CSV/Excel)
- [ ] Bulk email to all sponsors/captains
- [ ] Player statistics dashboard

---

## API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/sponsors` | GET, POST | List/create sponsors |
| `/api/sponsors/[token]` | GET, PATCH, DELETE | Sponsor by access token |
| `/api/sponsors/[token]/credits/[creditId]` | PATCH | Update credit (resend email) |
| `/api/sponsors/edit` | GET, PATCH | Edit sponsor via token |
| `/api/sponsors/edit/credits/[creditId]` | PATCH | Edit credit email |
| `/api/teams` | GET | List all teams with players |
| `/api/players` | GET | List all players |
| `/api/redeem/[code]` | POST | Redeem code (create team) |
| `/api/redeem/[code]/validate` | GET | Validate redemption code |
| `/api/email` | POST | Send emails via Resend |

---

## Security Notes
- Service role key rotated Jan 2025 (was exposed in .claude/settings.local.json)
- `.claude/` directory now in .gitignore
- All sensitive keys stored in .env.local (gitignored)

---

## MCP Servers Configured
- **Supabase**: Connected via PAT
- **Filesystem**: Connected
- **Context7**: Connected

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
  test-data.tsx       # Mock data for testing

app/
  sponsor/
    page.tsx          # Sponsor signup
    [token]/page.tsx  # Sponsor portal
    edit/page.tsx     # Edit sponsor
  redeem/
    [code]/page.tsx   # Team registration
  admin/
    page.tsx          # Dashboard
    sponsors/page.tsx # Manage sponsors
    teams/page.tsx    # View teams
    players/page.tsx  # View players
    tee-sheets/page.tsx # Placeholder
```
