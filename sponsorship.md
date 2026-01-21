# Frogman Classic - Sponsorship & Supabase Integration Plan

## Priority Context
Tournament director needs sponsorship link live by end of January. Focus on:
1. Supabase database setup
2. Public sponsor signup flow
3. Redemption codes with email delivery (Resend)
4. Sponsor portal for code management

---

## Supabase Project Info
- **URL**: https://zwdgwbhpntjolbpdzybi.supabase.co
- **Publishable Key**: sb_publishable_e76dfeC4SZdAXUVnXzGNGw_7pJl9dwV
- **Service Key**: sb_secret_a7yEnHhOfcZu5naov_75Gg_zmrrarte

---

## Phase 1: Supabase Setup

### 1.1 Database Schema
Run in Supabase SQL editor:

```sql
-- Event Years
create table event_years (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  start_date date,
  end_date date,
  is_active boolean default false,
  created_at timestamptz default now()
);

-- Sponsors
create table sponsors (
  id uuid primary key default gen_random_uuid(),
  event_year_id uuid references event_years(id),
  name text not null,
  contact_name text not null,
  contact_email text not null,
  payment_method text check (payment_method in ('stripe', 'check', 'invoice')),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid')),
  total_credits int not null default 2,
  access_token text unique default gen_random_uuid()::text,
  created_at timestamptz default now()
);

-- Sponsor Credits (individual redemption codes)
create table sponsor_credits (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid references sponsors(id) on delete cascade,
  redemption_code text unique not null,
  redeemed_by_team_id uuid,
  redeemed_at timestamptz,
  captain_email text,
  email_sent_at timestamptz,
  created_at timestamptz default now()
);

-- Players
create table players (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  ghin text default 'NONE',
  handicap_raw int,
  plays_yellow_tees boolean default false,
  last_handicap_update_at timestamptz,
  created_at timestamptz default now()
);

-- Teams
create table teams (
  id uuid primary key default gen_random_uuid(),
  event_year_id uuid references event_years(id),
  event_type text check (event_type in ('friday', 'sat_sun')),
  team_name text,
  sponsor_id uuid references sponsors(id),
  credit_id uuid references sponsor_credits(id),
  session_pref text default 'none' check (session_pref in ('am', 'pm', 'none')),
  notes text,
  withdrawn_at timestamptz,
  created_at timestamptz default now()
);

-- Team Players (join table)
create table team_players (
  team_id uuid references teams(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  role text default 'player' check (role in ('player', 'seal_guest')),
  primary key (team_id, player_id)
);

-- Tee Sheet Slots
create table tee_sheet_slots (
  id uuid primary key default gen_random_uuid(),
  event_year_id uuid references event_years(id),
  event_day text check (event_day in ('friday', 'saturday', 'sunday')),
  session text check (session in ('am', 'pm')),
  hole_number int not null,
  team_ids uuid[] default '{}'
);
```

### 1.2 Environment Variables
Add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://zwdgwbhpntjolbpdzybi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_e76dfeC4SZdAXUVnXzGNGw_7pJl9dwV
SUPABASE_SERVICE_ROLE_KEY=sb_secret_a7yEnHhOfcZu5naov_75Gg_zmrrarte
RESEND_API_KEY=xxx
```

---

## Phase 2: Redemption Code System

### 2.1 Code Generation
Format: `FROG-2025-XXXX` (4 random alphanumeric chars)
- Generated when sponsor is created
- One code per credit
- Stored in `sponsor_credits.redemption_code`

### 2.2 Code States
- **Available**: `redeemed_by_team_id` is null
- **Redeemed**: `redeemed_by_team_id` is set
- **Restored**: When team withdrawn, set `redeemed_by_team_id` back to null

---

## Phase 3: Public Routes

### 3.1 Sponsor Signup (`/sponsor`)
**File**: `app/sponsor/page.tsx`

Form fields:
- Company/Sponsor Name
- Contact Name
- Contact Email
- Number of Credits (2, 4, 6, 8)
- Captain Emails (optional, one per credit)

Flow:
1. Submit form -> Create sponsor + credits in Supabase
2. Generate unique redemption codes
3. Send email via Resend with codes
4. Show confirmation with sponsor portal link

### 3.2 Sponsor Portal (`/sponsor/[token]`)
**File**: `app/sponsor/[token]/page.tsx`

Features:
- View all credits with codes and status
- Copy code to clipboard
- Resend code email to specific captain
- Update captain email for a code
- See which codes are redeemed and by whom
- Future: Pay via Stripe (when available)

### 3.3 Code Redemption (`/redeem/[code]`)
**File**: `app/redeem/[code]/page.tsx`

Flow:
1. Validate code exists and is available
2. Show team registration form
3. Collect: Team name, event type, session preference, player info
4. Create team + link to credit
5. Send confirmation email

---

## Phase 4: Email Integration (Resend)

### 4.1 Install Resend
```bash
npm install resend
```

### 4.2 API Routes
**File**: `app/api/email/route.ts`

Email templates:
1. **Sponsor Welcome**: All codes + portal link
2. **Code Email**: Single code to captain
3. **Team Confirmation**: Registration confirmed

### 4.3 Email Content
Sponsor welcome email includes:
- Sponsor name, thank you message
- List of all redemption codes
- Link to sponsor portal
- Instructions for sharing codes

---

## Phase 5: Migration Strategy

### 5.1 Dual Mode
Keep mock data working while Supabase is being set up:
- Add `USE_SUPABASE` env flag
- Create `lib/db.ts` that switches between mock and Supabase
- Gradually migrate screens to use Supabase

### 5.2 Data Seeding
Create script to seed Supabase with:
- 2025 event year
- Existing players from mock data

---

## Files to Create/Modify

### New Files
1. `lib/supabase.ts` - Supabase client setup
2. `lib/db.ts` - Database abstraction layer
3. `lib/codes.ts` - Redemption code generation
4. `app/sponsor/page.tsx` - Public sponsor signup
5. `app/sponsor/[token]/page.tsx` - Sponsor portal
6. `app/redeem/[code]/page.tsx` - Code redemption/team signup
7. `app/api/email/route.ts` - Email sending via Resend
8. `lib/email-templates.ts` - Email HTML templates

### Modified Files
1. `lib/types.ts` - Add access_token to Sponsor, redemption_code to SponsorCredit
2. `app/admin/sponsors/page.tsx` - Show codes, resend options
3. `lib/mock-data.tsx` - Generate redemption codes

---

## Implementation Order

1. **Supabase project setup** - Run schema SQL in Supabase dashboard
2. **Install dependencies**: `npm install @supabase/supabase-js resend`
3. **Create lib/supabase.ts** - client setup
4. **Update lib/types.ts** - add new fields
5. **Create lib/codes.ts** - code generation
6. **Create app/sponsor/page.tsx** - signup form
7. **Create app/api/email/route.ts** - Resend integration
8. **Create app/sponsor/[token]/page.tsx** - portal
9. **Create app/redeem/[code]/page.tsx** - team registration
10. **Update admin sponsors page** - show codes

---

## MCP Servers Configured
- **Supabase**: Connected (PAT-based auth)
- **Filesystem**: Connected
- **Context7**: Connected

---

## Key User Requirements
1. Redemption codes for each sponsor credit (can be emailed to anyone)
2. Codes become invalid once redeemed
3. Codes restore to valid if team is withdrawn/deleted
4. Sponsor portal to view codes and resend emails
5. No Stripe yet (non-profit not set up), but allow future payment via confirmation link
6. Real email via Resend
