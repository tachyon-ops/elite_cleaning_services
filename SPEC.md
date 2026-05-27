# Specialty Cleaning Platform — Product Spec v0.1

> Working name: **[Brand]** (replace throughout)
> Purpose: thin sales-and-coordination layer over a network of specialty cleaning subcontractors in Switzerland.

---

## 1. Product vision in one paragraph

A modern, Swiss-based booking platform for **specialty cleaning** across five verticals (aviation, yacht/marine, commercial, hospitality, special-situations). Customers book online — as guests or as registered users — and we dispatch the job to a vetted partner company. We hold the customer relationship, the digital storefront, the calendar, and the payment. Partners deliver the work. The first booking is risk-free (full cancellation until 24h before), and repeat customers unlock recurring schedules and locked-in pricing.

---

## 2. The five service verticals

Each vertical has its own intake schema, pricing model, and SLA.

| Vertical                                                                     | Pricing model                                | Intake complexity                     | Quote SLA                  |
| ---------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------- | -------------------------- |
| **Aviation** (private jets, light aircraft, helicopter interiors)            | Per-job, quote-on-request                    | High (aircraft type, location, scope) | < 4h                       |
| **Yacht & marine** (boats, yachts, marina-based)                             | Per-job or per-foot, quote-on-request        | Medium-high                           | < 4h                       |
| **Commercial** (offices, studios, co-working)                                | Per m² + frequency, instant quote            | Medium                                | Instant                    |
| **Hospitality** (Airbnb, holiday lets, B&Bs)                                 | Per-turnover flat rate, instant quote        | Low                                   | Instant                    |
| **Special services** (post-incident, biohazard, hoarding, post-construction) | Quote-on-request, in-person assessment first | Very high — sensitive                 | < 24h, phone call required |

> ⚠️ **Special-services note**: post-incident and biohazard scenarios often involve trauma. The booking flow for this vertical should route to a phone conversation, not an instant checkout. We never display imagery or copy that could be triggering. See §11 for compliance considerations.

---

## 3. User personas

1. **Guest customer** — wants to book one job, doesn't want an account. Provides email, verifies via OTP, pays, done.
2. **Registered customer** — books recurring (weekly office cleaning, monthly Airbnb turnover, quarterly yacht detail). Has a portal.
3. **Operator/admin (you)** — sees everything, configures pricing, manages partners.
4. **Editor** — manages bookings and customers, can quote and assign jobs to partners. Cannot change pricing rules or user roles.
5. **Dispatcher** (Phase 2) — read-only on financials, can assign and reschedule jobs.
6. **Partner company** (Phase 3) — sees only their own assigned jobs, marks complete, uploads completion photos.

---

## 4. Information architecture — public site

```
/                                    Homepage
/aviation                            Vertical landing
/yacht                               Vertical landing
/commercial                          Vertical landing
/hospitality                         Vertical landing
/special-services                    Vertical landing
/how-it-works                        Process explainer
/partners                            For collaborator recruitment
/about                               Company, team, trust signals
/contact                             Phone, email, form
/legal/privacy                       GDPR-compliant privacy policy
/legal/terms                         Terms of service
/legal/cookies                       Cookie policy
/book/[vertical]                     Booking flow entry
/account/*                           Registered customer portal
/admin/*                             Backoffice (auth-gated)
```

---

## 5. Homepage spec

### 5.1 Above the fold (hero)

- **Headline**: short, vertical-agnostic. e.g. "Specialty cleaning. Booked online. Done by experts."
- **Subhead**: one line on what makes us different — Swiss-based, vetted partners, insured delivery, single point of contact.
- **Primary CTA**: "Get a quote in 60 seconds" → opens vertical picker modal
- **Secondary CTA**: "How it works"
- **Trust strip** (immediately below hero): insured · Swiss-based · GDPR-compliant · vetted partners · _no logos until we have real ones_

### 5.2 Vertical grid

Five cards in a responsive grid. Each card has:

- Icon
- Vertical name
- One-line description
- "From CHF X" indicative pricing (instant verticals only; "Quote on request" for aviation/yacht/special)
- "Book →" CTA linking to `/book/[vertical]`

### 5.3 How it works (3 steps)

1. **Tell us about your job** — quick intake, 2 minutes.
2. **Get a price and a time** — instant for standard jobs, within 4 hours for specialty.
3. **We dispatch a vetted team** — you get reminders, completion photos, and a receipt.

### 5.4 Trust + differentiation block

- Why we exist (the gap in the market)
- What we vet partners on (insurance, certifications, references)
- The first-booking promise: free reschedule or cancellation up to 24h before; if you're not happy, we re-do or refund (within policy)

### 5.5 Recurring pitch (this is the marketing hook the customer mentioned)

- Headline: "First clean? No commitment."
- Subhead: "Try us once. If it works, lock in a recurring schedule and save."
- Visual: a calendar with recurring jobs highlighted.

### 5.6 Testimonials (placeholder until real)

- Empty state with copy: "Coming soon — we're early." Then populate as real reviews come in. Never use fake reviews.

### 5.7 FAQ

- "Do you do the cleaning yourselves?" — No. We coordinate vetted Swiss partners and stand behind the quality.
- "Where do you operate?" — Start with Zurich + Lake Zurich area; expand as we add partners.
- "What if something is damaged?" — Our partners carry liability insurance; we mediate claims.
- "How do I pay?" — Stripe; major cards, TWINT, Apple Pay.
- "Can I cancel?" — Yes, free up to 24h before the job.
- "Is my data safe?" — Yes; GDPR-compliant, EU/CH hosting, never sold.

### 5.8 Footer

- Legal links · contact · social · language switch (EN / DE / FR / IT planned, EN-only at launch)

---

## 6. Booking flow spec

The single most important flow. Reused across all verticals with vertical-specific intake.

```
[Vertical landing or homepage CTA]
        ↓
Step 1 — Intake (vertical-specific schema, see §7)
        ↓
Step 2 — Schedule (calendar availability check, see §8)
        ↓
Step 3 — Quote
   ├── Instant vertical: price calculated client-side from rules
   └── Specialty vertical: "We'll send your quote within 4 hours"
        ↓
Step 4 — Contact
   ├── Guest: email + phone, OTP code to email
   └── Registered: skip; payment method on file
        ↓
Step 5 — Payment (Stripe)
   ├── Instant verticals: full payment OR 30% deposit
   ├── Specialty verticals: 30% deposit on quote acceptance
   └── First booking flag: full refund if cancelled >24h before
        ↓
Step 6 — Confirmation
   ├── Email with booking details + .ics calendar invite
   ├── SMS reminder 24h before (optional, Phase 2)
   └── "Want to make this recurring?" prompt (post-completion, see §6.2)
```

### 6.1 Guest checkout + OTP details

- Email collected at Step 4
- 6-digit code sent via Resend/Postmark
- Code expires after 10 min, max 5 attempts
- Once verified, a `guest_user` record is created with `otp_verified=true`
- The same email on next visit can be "claimed" by creating a password → upgrades to `registered_user` and inherits booking history

### 6.2 Recurring unlock flow

- After the first booking is marked complete + rated 4+ stars, send an email: "Make this recurring and save 10%."
- Link goes to `/account/recurring/new?from_booking=[id]`
- They register if guest, then choose: weekly / bi-weekly / monthly / quarterly
- Stripe Subscription created with the recurring product
- Discount applied automatically as a coupon

---

## 7. Vertical-specific intake schemas

Stored as JSON on the booking record. Each vertical has its own form component.

### 7.1 Aviation

- Aircraft type (dropdown: light jet, mid jet, heavy jet, turboprop, helicopter, other)
- Tail number (optional, for our records)
- Location (airport + FBO/hangar)
- Service requested (multi-select: interior detail, exterior wash, deep clean, restock, disinfection)
- Last detail date
- Preferred date/window
- Notes (free text)

### 7.2 Yacht & marine

- Vessel type (motor / sail / catamaran / other)
- Length in meters
- Marina + berth
- Service requested (interior, exterior, both, deep clean, end-of-season)
- Last service date
- Access details (key, code, marina office)
- Preferred date/window

### 7.3 Commercial

- Office type (office, studio, retail, co-working, gym, restaurant — others)
- Surface area in m²
- Number of rooms / floors
- Frequency wanted (one-off, weekly, bi-weekly, monthly)
- Preferred time (business hours, after-hours, weekends)
- Special requirements (security clearance, key handover, etc.)

### 7.4 Hospitality

- Property type (Airbnb, B&B, holiday let, hotel room)
- Number of bedrooms / bathrooms
- Surface area in m²
- Frequency (per-turnover, weekly during high season, etc.)
- Linen change required? (yes/no)
- Key handling (lockbox code, smart lock, in-person)
- iCal sync URL for Airbnb/Booking (Phase 2 — auto-detect turnovers)

### 7.5 Special services

- Type (multi-select with sensitivity controls: post-incident, biohazard, hoarding, post-construction, other)
- Scale (small room, full property, multiple rooms)
- Urgency (immediate <24h, within a week, flexible)
- Location (postal code only at this stage)
- Phone number — **required**, this vertical never closes online
- Consent to be contacted by phone within 24h

> Special services skips Steps 2-5 of the standard flow. After intake, customer is told "we'll call you within 24 hours" and a high-priority ticket goes to ops.

---

## 8. Calendar & availability model

The hardest part of the system. Three approaches, in order of MVP-friendliness:

### 8.1 MVP approach: manual slot management

- Each partner team has a `working_hours` config (e.g. Mon-Fri 8-18) and a `blocked_dates` list (vacation, fully booked).
- Ops marks slots as "available" or "booked" in the backoffice calendar.
- The booking flow shows next 14 days of available slots for the selected vertical + region.
- If no slot is available in the next 14 days, the form switches to "join the waitlist" and we contact when capacity frees up.

### 8.2 Phase 2: partner self-managed via portal

- Partner companies log into their own portal
- They set their availability themselves and mark jobs complete
- Calendar updates in real-time

### 8.3 Phase 3: external calendar sync

- iCal / Google Calendar sync per partner team
- Auto-import their existing bookings as blocked time

> For launch, build only §8.1. Don't over-engineer this until you have 3+ partners.

---

## 9. Backoffice spec

Auth-gated under `/admin`. Role-based access via middleware.

### 9.1 Roles & permissions matrix

| Capability                       | Super Admin |      Editor       | Dispatcher |
| -------------------------------- | :---------: | :---------------: | :--------: |
| View all bookings                |      ✓      |         ✓         |     ✓      |
| Create / edit bookings           |      ✓      |         ✓         |     ✓      |
| Assign to partner                |      ✓      |         ✓         |     ✓      |
| Edit pricing rules               |      ✓      |         —         |     —      |
| Manage partners                  |      ✓      |   ✓ (view only)   |     —      |
| Manage users & roles             |      ✓      |         —         |     —      |
| View revenue / financial reports |      ✓      |         —         |     —      |
| Issue refunds                    |      ✓      | ✓ (with approval) |     —      |
| Export data (GDPR)               |      ✓      |         —         |     —      |
| Delete customer data (GDPR)      |      ✓      |         —         |     —      |

### 9.2 Backoffice screens

1. **Dashboard** — KPIs: bookings today / this week / this month, revenue MTD, pending quotes, jobs awaiting completion, customer satisfaction (avg rating).
2. **Bookings** — table view, filters (status, vertical, partner, date range, customer), bulk actions, detail view with full intake + timeline.
3. **Quotes** — pending quotes that need ops to price (specialty verticals); approve/send workflow.
4. **Customers** — list, search, profile view with booking history, manual GDPR export/delete.
5. **Calendar** — week/month view, all jobs across all partners, drag to reschedule (Phase 2).
6. **Partners** — company profiles, contracted services, contact info, performance stats (job count, avg rating, on-time %).
7. **Services & Pricing** — per-vertical service offerings, base prices, multipliers (m², frequency discount, urgency surcharge).
8. **Users & Roles** — admin only, invite team members, assign roles.
9. **Settings** — branding, email templates, legal pages content, integrations.
10. **Audit log** — every admin action logged (who, what, when) — required for GDPR compliance.

---

## 10. Data model (PostgreSQL)

Core entities. All tables have `id` (uuid), `created_at`, `updated_at`. Soft delete via `deleted_at` where relevant.

```
users
  id, email (unique), password_hash (nullable for guests), role enum,
  name, phone, locale, gdpr_marketing_consent bool, deleted_at

guest_emails
  email (unique), otp_code, otp_expires_at, otp_attempts, verified_at

partners (collaborator companies)
  name, contact_email, contact_phone, address, vat_number, insurance_doc_url,
  status enum (active, paused, terminated), notes

partner_teams
  partner_id, name, working_hours jsonb, service_categories[], region

service_categories
  slug, name, vertical enum, pricing_model enum (instant, quote_on_request),
  active bool

service_offerings
  category_id, name, base_price_chf, unit (per_job, per_hour, per_m2, per_foot),
  description

bookings
  id, customer_id (fk users or guest_emails), vertical, category_id,
  intake jsonb, scheduled_at, scheduled_window, location_address, location_geo,
  partner_team_id (nullable until assigned), status enum (see §10.1),
  total_amount_chf, deposit_amount_chf, stripe_payment_intent_id,
  stripe_subscription_id (nullable), is_first_booking bool, cancellation_reason

quotes
  booking_id, ops_user_id, amount_chf, valid_until, sent_at, accepted_at,
  rejected_at, notes

payments
  booking_id, stripe_charge_id, amount_chf, status enum, refunded_amount_chf

recurring_schedules
  customer_id, category_id, frequency enum, day_of_week, time_window,
  stripe_subscription_id, status enum, next_run_at

availability_blocks
  partner_team_id, starts_at, ends_at, reason (vacation, booked, capacity)

reviews
  booking_id, rating int (1-5), comment, public bool, customer_id

audit_log
  actor_user_id, action, target_table, target_id, before jsonb, after jsonb,
  ip_address, user_agent

consent_log (GDPR)
  user_id or email, consent_type enum (marketing, cookies_analytics, etc.),
  granted bool, granted_at, revoked_at, ip_address
```

### 10.1 Booking state machine

```
draft → intake_submitted → quote_pending (specialty only) → quote_sent →
quote_accepted → payment_pending → confirmed → assigned → in_progress →
completed → invoiced → paid

Cancellation states from any pre-in_progress state: cancelled_by_customer,
cancelled_by_ops. Refunds calculated per policy.
```

---

## 11. GDPR & compliance checklist

### 11.1 Legal documents needed (Day 1)

- Privacy policy (lawful basis declared per purpose: contract for booking data, consent for marketing)
- Terms of service
- Cookie policy
- Imprint (Swiss legal requirement — "Impressum")

### 11.2 Technical requirements

- Cookie consent banner — non-essential cookies blocked until consent (use `vanilla-cookieconsent` or similar)
- All user data export endpoint (`/account/data-export` returns JSON of everything we hold)
- Account deletion: `/account/delete` triggers full erasure within 30 days (immediate for guest emails)
- Audit log of every admin action on personal data
- EU/CH hosting (Vercel Frankfurt, Supabase eu-central-1, or Swiss provider like Infomaniak)
- DPAs with: Stripe, email provider (Resend/Postmark), hosting, analytics provider
- Encryption at rest (DB) and in transit (TLS everywhere, HSTS)
- Password hashing: bcrypt or argon2 (never plain or md5)

### 11.3 Special-services compliance

- Photos and videos uploaded for special-services jobs are highly sensitive. Store in a separate encrypted bucket with access logging. Auto-delete after 90 days unless legal hold.
- The intake form for special services should have a more prominent privacy notice.
- Optional: have a clinical/insurance advisor review the workflow before launch.

### 11.4 Payment & financial compliance

- Stripe handles PCI compliance; never store card numbers ourselves
- Swiss VAT: register if annual turnover exceeds CHF 100K (Stripe Tax can compute and report)
- Invoices must show VAT-compliant fields once registered

---

## 12. Tech stack recommendation

| Layer          | Choice                                                | Why                                            |
| -------------- | ----------------------------------------------------- | ---------------------------------------------- |
| Framework      | **Next.js 15 (App Router)**                           | Best ecosystem, server components, easy deploy |
| Language       | TypeScript                                            | Type safety end-to-end                         |
| Styling        | Tailwind + shadcn/ui                                  | Fast, beautiful defaults, no design lock-in    |
| Database       | PostgreSQL via **Supabase**                           | Auth, RLS, storage, EU region — all in one     |
| Auth           | Supabase Auth + custom OTP for guests                 | Email/password + magic link built-in           |
| Payments       | **Stripe** (Checkout, Subscriptions, Customer Portal) | Industry standard                              |
| Email          | **Resend** (or Postmark)                              | Modern, EU region available                    |
| File storage   | Supabase Storage                                      | Already in the stack                           |
| Hosting        | **Vercel** (Frankfurt region)                         | Zero-config Next.js                            |
| Analytics      | **Plausible** (self-hostable, GDPR-friendly)          | No cookie banner needed for analytics          |
| Error tracking | Sentry                                                | Self-host or use EU region                     |
| CMS (optional) | Sanity or none (MDX for legal pages)                  | Keep simple                                    |

> Alternative if you prefer: SvelteKit + Drizzle + Lucia. Both work. Next.js has more AI training data, so AI agents build it more reliably.

---

## 13. Phased rollout plan

### Phase 0 — Static validation (Week 1)

- Homepage + 5 vertical landing pages
- Single "request a quote" form that emails ops
- No backoffice, no payments, no calendar
- **Goal**: see if anyone clicks. Spend zero on the rest until they do.

### Phase 1 — MVP booking (Weeks 2-4)

- Full booking flow for instant verticals (commercial, hospitality)
- Guest checkout + OTP
- Stripe one-time payment
- Manual calendar slots
- Backoffice: dashboard, bookings, customers, manual quote workflow
- RBAC: super admin + editor
- Legal pages, cookie consent, basic GDPR
- **Goal**: process first 10 bookings end-to-end without breaking.

### Phase 2 — Specialty & recurring (Weeks 5-8)

- Quote-on-request workflow for aviation, yacht, special services
- Customer accounts + portal
- Stripe Subscriptions for recurring jobs
- Email reminders, review requests
- iCal invites
- **Goal**: first recurring customer; first specialty job booked through quote flow.

### Phase 3 — Scale enablers (Weeks 9-14)

- Partner portal (partners log in, see their jobs, mark complete)
- SMS reminders (Twilio)
- Multi-language (DE first, then FR/IT)
- iCal sync for partner calendars
- Multi-region (add Lake Geneva, Basel)
- Advanced reporting & exports
- **Goal**: hand-off ops work to editors so founder time goes to sales.

---

## 14. Out of scope (explicitly)

The following are _not_ in this spec. Decide later, don't build now.

- Native mobile apps (iOS/Android) — PWA is enough for years
- Real-time chat with partners — email + phone fine for now
- AI-generated job scoping from photos — fun but not core
- Marketplace mode (partners list themselves) — we are a curated channel, not an open marketplace
- Customer loyalty / referrals program — Phase 4+
- Public API — only build if a partner asks
- White-label for partners — distraction

---

## 15. Open questions you need to answer before starting

1. **Brand name + domain** — register before any other work.
2. **First vertical(s) to launch with** — pick one or two of the five for MVP. My recommendation: **commercial + hospitality** (instant pricing = highest conversion, easiest delivery) plus **yacht** as the specialty hook for marketing.
3. **Geographic launch zone** — Zurich + Lake Zurich, or wider?
4. **Pricing strategy per vertical** — instant verticals need rules now; specialty stays quote-driven.
5. **First partner(s) signed** — the spec assumes you have at least one before customers can book. If you don't have a partner yet, the booking flow goes to "we'll contact you" until you do.
6. **VAT registration** — likely not needed at first (under CHF 100K), but plan the trigger.
7. **Founder liability insurance** — get the brokerage-layer policy before any booking goes live.
8. **Customer service channel** — phone? WhatsApp? Email-only? Define SLAs.

---

## 16. Success metrics (what we measure)

- **Acquisition**: unique visitors → quote requests → completed bookings
- **Conversion**: quote → booking by vertical; first booking → recurring conversion
- **Operations**: avg quote response time, on-time job completion %, partner utilization
- **Financial**: revenue, gross margin (revenue - partner cost), customer LTV, CAC
- **Quality**: avg rating, NPS, refund rate, repeat-booking rate
- **Compliance**: GDPR requests handled within SLA, audit log completeness

---

## 17. AI build prompt (for Cursor / Claude Code)

> Build a Next.js 15 App Router project in TypeScript with Tailwind and shadcn/ui. Use Supabase for Postgres + Auth + Storage. Stripe for payments. Resend for transactional email. Implement the data model in §10, the booking flow in §6, and the homepage in §5. Build only Phase 1 in §13 to start. Apply the GDPR requirements in §11. Use RLS policies in Supabase so customers can only read their own bookings, and admin role can read all. Implement the booking state machine in §10.1 strictly — no shortcuts.

---

_End of v0.1 spec. Iterate as you learn from real users._
