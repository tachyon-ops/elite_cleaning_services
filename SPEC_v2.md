# Specialty Cleaning Platform — Product Spec v0.2

> Working name: **[Brand]** (replace throughout)
> Purpose: thin sales-and-coordination layer over a curated marketplace of specialty cleaning provider companies in Switzerland.
> **Changes from v0.1**: this version introduces the curated marketplace model — providers self-register, get reviewed, and operate within the platform with revenue-share. The customer-facing brand and booking experience are unchanged. See changelog at end of document.

---

## 1. Product vision in one paragraph

A modern, Swiss-based booking platform for **specialty cleaning** across five verticals (aviation, yacht/marine, commercial, hospitality, special-situations). Customers book online — as guests or as registered users — and we dispatch the job to a **vetted provider company** from our curated marketplace. We hold the customer relationship, the digital storefront, the calendar, the brand, and the payment. Provider companies onboard themselves through a self-service portal, are reviewed and approved by ops, and deliver the work. Money flows through the platform via Stripe Connect; we keep a commission, providers get the rest. The first booking is risk-free (full cancellation until 24h before), and repeat customers unlock recurring schedules and locked-in pricing.

---

## 1.5 Strategic positioning — Curated, not open

This is critical to the brand and to the legal posture, so it's called out before anything else:

- **Curated marketplace, not open marketplace.** Every provider is reviewed by ops before they can take a single job. The brand promise of "vetted partners" is preserved. Customers never see unverified providers.
- **Providers are companies, not individuals.** Only registered Swiss businesses (Einzelfirma, GmbH, AG, or equivalent EU entity operating in Switzerland) can apply. No matching of individual workers to customers. This is the legal firewall that keeps us out of SECO Personalverleih (staff leasing) territory and avoids the CHF 50K–100K license deposit.
- **The platform's promise is delivery quality, not selection breadth.** We do not aspire to list every cleaner in Switzerland. We aspire to list the best ones for each vertical.
- **Special services stays curated-only forever.** Self-onboarding is too risky for biohazard, post-incident, and hoarding work. These providers are hand-picked, full stop.

---

## 2. The five service verticals

Each vertical has its own intake schema, pricing model, and SLA.

| Vertical                                                                     | Pricing model                                | Intake complexity                     | Quote SLA                  | Marketplace mode                            |
| ---------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------- | -------------------------- | ------------------------------------------- |
| **Aviation** (private jets, light aircraft, helicopter interiors)            | Per-job, quote-on-request                    | High (aircraft type, location, scope) | < 4h                       | Self-onboarding allowed, manual approval    |
| **Yacht & marine** (boats, yachts, marina-based)                             | Per-job or per-foot, quote-on-request        | Medium-high                           | < 4h                       | Self-onboarding allowed, manual approval    |
| **Commercial** (offices, studios, co-working)                                | Per m² + frequency, instant quote            | Medium                                | Instant                    | Self-onboarding allowed, manual approval    |
| **Hospitality** (Airbnb, holiday lets, B&Bs)                                 | Per-turnover flat rate, instant quote        | Low                                   | Instant                    | Self-onboarding allowed, manual approval    |
| **Special services** (post-incident, biohazard, hoarding, post-construction) | Quote-on-request, in-person assessment first | Very high — sensitive                 | < 24h, phone call required | **Hand-picked only.** No self-registration. |

> ⚠️ **Special-services note**: post-incident and biohazard scenarios often involve trauma. The booking flow for this vertical routes to a phone conversation, not an instant checkout. We never display imagery or copy that could be triggering. Providers for this vertical are recruited by ops directly. See §11.

---

## 3. User personas

### 3.1 Customer-side

1. **Guest customer** — wants to book one job, doesn't want an account. Provides email, verifies via OTP, pays, done.
2. **Registered customer** — books recurring (weekly office cleaning, monthly Airbnb turnover, quarterly yacht detail). Has a portal.

### 3.2 Provider-side (new in v2)

3. **Prospective provider** — visits `/providers`, reads the pitch, submits an application. Has no platform access yet.
4. **Onboarding provider** — application accepted; uploading documents (insurance, VAT, references), connecting Stripe, drafting service listings. Cannot yet receive jobs.
5. **Active provider** — fully onboarded; receives job offers, manages availability, completes jobs, gets paid.
6. **Provider team member** — staff added by a provider to their company account; can view jobs and update status but cannot edit company-level settings or banking.

### 3.3 Platform-side

7. **Operator / Super Admin (you)** — sees everything, configures pricing rules, approves providers, manages disputes.
8. **Editor** — manages bookings and customers, can quote and assign jobs. Cannot change pricing rules, approve providers, or manage user roles.
9. **Dispatcher** (Phase 2) — read-only on financials, can assign and reschedule jobs.
10. **Provider Ops** (new role in v2) — reviews provider applications, manages provider performance, handles disputes. Cannot change platform commission rates.

---

## 4. Information architecture — public site

```
/                                    Homepage (customer-facing, unchanged)
/aviation                            Vertical landing
/yacht                               Vertical landing
/commercial                          Vertical landing
/hospitality                         Vertical landing
/special-services                    Vertical landing
/how-it-works                        Process explainer
/about                               Company, team, trust signals
/contact                             Phone, email, form
/book/[vertical]                     Booking flow entry
/account/*                           Registered customer portal

# Provider-facing (new in v2)
/providers                           Provider recruitment landing
/providers/apply                     Application form (open to all)
/providers/how-it-works              Process, commission, requirements
/providers/account/*                 Provider portal (auth-gated)

# Backoffice (extended in v2)
/admin/*                             Backoffice (auth-gated, RBAC)

# Legal
/legal/privacy                       GDPR-compliant privacy policy
/legal/terms                         Terms of service (customer side)
/legal/provider-terms                Provider master services agreement (new)
/legal/cookies                       Cookie policy
/legal/impressum                     Swiss Impressum
```

---

## 5. Homepage spec

Unchanged from v0.1 §5 — the customer doesn't need to know about the marketplace mechanic. Add only:

- Footer link to `/providers` ("Become a partner") in the footer's secondary nav, not the primary nav.
- No mention of "marketplace" or "platform" anywhere in customer-facing copy. We are a vetted-partner brokerage, full stop.

(See v0.1 spec for full homepage detail.)

---

## 5b. Provider recruitment page (`/providers`) — new in v2

The opposite-facing equivalent of the homepage. Sold to provider companies, not customers.

### 5b.1 Hero

- Headline: "Grow your specialty cleaning business with [Brand]"
- Subhead: one line on what they get — qualified leads, no marketing spend, transparent commission, fast payouts.
- Primary CTA: "Apply to join" → `/providers/apply`
- Secondary: "How it works" anchor link

### 5b.2 What we offer providers

Three-column section:

1. **Qualified jobs, not leads.** Customers have already paid a deposit. No chasing, no flaking.
2. **Transparent economics.** Flat commission, no hidden fees, weekly Stripe payouts.
3. **Premium positioning.** Our customer is a yacht owner, an FBO, a luxury Airbnb host. Your work is sold at its real value.

### 5b.3 Requirements

What providers must have to apply:

- Registered Swiss business (Einzelfirma, GmbH, AG, or EU equivalent operating in CH)
- Valid liability insurance (Betriebshaftpflicht), minimum CHF 5M cover
- VAT number if turnover exceeds CHF 100K (otherwise self-declaration)
- For aviation/yacht: vertical-specific certifications + 2 references
- For hospitality/commercial: 1 reference + clean criminal record extract
- For special services: applications closed — we recruit directly

### 5b.4 Commission structure (see §18 for full detail)

| Vertical         | Platform commission     | What providers keep |
| ---------------- | ----------------------- | ------------------- |
| Commercial       | 15%                     | 85%                 |
| Hospitality      | 15%                     | 85%                 |
| Aviation         | 20%                     | 80%                 |
| Yacht & marine   | 20%                     | 80%                 |
| Special services | Negotiated per contract | —                   |

### 5b.5 FAQ for providers

- Do I need to give you exclusivity? No. Work with whomever else you want.
- How fast do I get paid? Within 7 days of job completion via Stripe Connect.
- Who owns the customer relationship? We do. You serve them, but reach-out and follow-up goes through the platform.
- What if a customer is unhappy? The platform mediates. See dispute policy in `/legal/provider-terms`.
- Can I set my own prices? For quote-on-request verticals, yes (within review). For instant verticals, you accept the platform price.

---

## 6. Booking flow spec

Same as v0.1 §6 for the customer-facing flow. New in v2: the provider-acceptance flow that fires when a booking is created.

### 6.0 Provider-side job offer flow (new)

```
Booking created in platform
        ↓
Matching engine selects 1-3 eligible providers
   (vertical match + region + availability + rating)
        ↓
Job offered to top-ranked provider via:
   email + provider portal notification + SMS (Phase 2)
        ↓
Provider has 30 minutes to accept/decline
   (instant verticals) or 2 hours (quote-on-request)
        ↓
   ├── Accepted: booking → assigned, customer notified
   ├── Declined: offer moves to next provider in ranking
   └── Timed out: offer expires, moves to next provider
        ↓
If all offers exhausted: booking flagged for ops manual assignment
```

### 6.0.1 Matching engine — MVP rules

For the MVP, matching is simple deterministic ranking, not ML:

1. Provider must be active and in good standing
2. Provider must serve the vertical
3. Provider must serve the region (postal code prefix match)
4. Provider must have stated availability for the slot
5. Rank by: avg rating × on-time % × inverse-recent-job-count (load-balancing)

(See v0.1 §6.1 for guest checkout/OTP, §6.2 for recurring unlock.)

---

## 7. Vertical-specific intake schemas

Unchanged from v0.1 §7. Provider listings store the _capabilities_ schema (what they can do), customer bookings store the _requirements_ schema (what they need). Matching engine intersects them.

---

## 8. Calendar & availability model

### 8.1 Updated for v2 — providers manage their own calendars

In v0.1, ops marked slots manually. In v2:

- **Providers**: set their own working hours, block dates, and availability through the provider portal calendar.
- **Ops**: can still override and manually assign in edge cases via the admin calendar.
- **Customers**: see only the aggregate availability across all active providers in their region/vertical.

### 8.2 Calendar features

- **Working hours**: per provider team, set once with overrides per date
- **Capacity**: each provider can set a max concurrent jobs/day (e.g. "we can do 3 yacht details per day")
- **Blackout dates**: vacation, public holidays, full-day blocks
- **Auto-block on accept**: when a provider accepts a job, that slot is automatically blocked
- **iCal export** (Phase 2): provider can subscribe to their accepted-jobs calendar
- **iCal import** (Phase 3): provider can import an external calendar to auto-block already-busy time

---

## 9. Backoffice spec

### 9.1 Roles & permissions matrix (updated for v2)

| Capability                           | Super Admin | Provider Ops | Editor  | Dispatcher |
| ------------------------------------ | :---------: | :----------: | :-----: | :--------: |
| View all bookings                    |      ✓      |      ✓       |    ✓    |     ✓      |
| Create / edit bookings               |      ✓      |      ✓       |    ✓    |     ✓      |
| Assign to provider manually          |      ✓      |      ✓       |    ✓    |     ✓      |
| Edit pricing rules                   |      ✓      |      —       |    —    |     —      |
| Edit commission rates                |      ✓      |      —       |    —    |     —      |
| Review provider applications         |      ✓      |      ✓       |    —    |     —      |
| Approve / suspend providers          |      ✓      |      ✓       |    —    |     —      |
| Issue refunds                        |      ✓      |      —       | ✓ (cap) |     —      |
| Manage users & roles                 |      ✓      |      —       |    —    |     —      |
| View revenue / financial reports     |      ✓      |      —       |    —    |     —      |
| View provider payouts ledger         |      ✓      |      ✓       |    —    |     —      |
| Approve manual payouts               |      ✓      |      —       |    —    |     —      |
| Export data (GDPR)                   |      ✓      |      —       |    —    |     —      |
| Delete customer/provider data (GDPR) |      ✓      |      —       |    —    |     —      |

### 9.2 Backoffice screens (additions in **bold**)

1. **Dashboard** — KPIs: bookings, revenue, **active providers, pending applications, payouts due**
2. **Bookings** — as v0.1
3. **Quotes** — as v0.1
4. **Customers** — as v0.1
5. **Calendar** — as v0.1, but now aggregating all provider calendars
6. **Providers** — **expanded**: list, search, profile view, performance stats, application history, banking/Stripe Connect status, suspension controls
7. **Provider applications** — **new screen**: queue of pending applications with document viewer, approve/reject workflow, request-more-info option
8. **Payouts** — **new screen**: ledger of platform earnings, provider earnings, pending payouts, payout history, manual payout trigger
9. **Disputes** — **new screen**: customer-provider issues, evidence collection, resolution workflow, refund/payout adjustment tools
10. **Services & Pricing** — as v0.1
11. **Commissions** — **new screen** (super admin only): edit commission rates per vertical, scheduled changes, audit history
12. **Users & Roles** — as v0.1
13. **Settings** — as v0.1
14. **Audit log** — as v0.1, with provider-side actions logged too

---

## 10. Data model (PostgreSQL) — extended for v2

Existing entities from v0.1 retained. New entities and field additions:

```
# EXISTING (from v0.1), with additions
users
  + provider_company_id (nullable fk providers, set when user is a provider staff member)

partners → renamed to providers
  + slug (for /providers/[slug] public profile in future)
  + legal_entity_type enum (einzelfirma, gmbh, ag, other_eu)
  + uid_number (Swiss UID number for VAT/business identification)
  + bank_details_verified bool
  + stripe_connect_account_id (Stripe Connect account)
  + stripe_connect_status enum (pending, active, restricted, rejected)
  + onboarding_status enum (applied, under_review, approved, active, suspended, terminated)
  + onboarding_completed_at
  + commission_override_rate decimal (nullable, set per provider for negotiated cases)
  + criminal_record_extract_url (encrypted storage)
  + insurance_doc_url (encrypted storage)
  + insurance_expires_at
  + verticals[] (which verticals they're approved for)

bookings
  + provider_offer_id (fk to current offer being considered)
  + provider_payout_amount_chf (calculated at job completion)
  + commission_amount_chf (calculated at job completion)

# NEW in v2

provider_applications
  id, applicant_email, applicant_name, company_name, legal_entity_type,
  verticals_requested[], region, submitted_at, status enum (submitted,
  under_review, info_requested, approved, rejected), reviewer_user_id,
  decision_at, decision_notes, application_data jsonb

provider_documents
  provider_id, doc_type enum (insurance, criminal_record, vat_cert,
  certification, reference), file_url, expires_at, verified bool,
  verified_by_user_id, verified_at, uploaded_at

provider_listings (capabilities published in marketplace)
  provider_id, category_id, custom_price_chf (nullable, only quote-verticals),
  service_radius_km, capacity_per_day, lead_time_hours, active bool

provider_offers (per-booking offers to providers)
  booking_id, provider_id, offered_at, expires_at, response enum
  (pending, accepted, declined, timed_out), response_at, decline_reason

provider_availability (extended from v0.1 availability_blocks)
  + auto_blocked bool (set true when blocked by an accepted booking)
  + booking_id (nullable, links auto-blocked slots to source booking)

payouts (new)
  provider_id, booking_id (nullable for adjustments), amount_chf,
  currency, stripe_transfer_id, status enum (scheduled, in_transit, paid,
  failed, reversed), scheduled_for, paid_at, failure_reason

commission_ledger (new)
  booking_id, gross_amount_chf, commission_rate, commission_amount_chf,
  provider_payout_chf, calculated_at, settled_at, notes

provider_reviews (separate from booking reviews — performance over time)
  provider_id, period_start, period_end, jobs_completed, avg_rating,
  on_time_pct, cancellation_pct, computed_at

disputes (new)
  booking_id, opened_by enum (customer, provider, ops), reason enum,
  description, evidence_urls[], status enum (open, in_review, resolved,
  closed), resolution enum (refund_full, refund_partial, redo, dismissed),
  resolved_by_user_id, resolved_at, refund_amount_chf,
  payout_adjustment_chf
```

### 10.1 Booking state machine (extended)

```
draft → intake_submitted → quote_pending (specialty) → quote_sent →
quote_accepted → payment_pending → confirmed →
  offer_dispatched → offer_accepted (NEW) →
assigned → in_progress → completed →
  payout_scheduled (NEW) → payout_paid (NEW)

Cancellation: cancelled_by_customer, cancelled_by_ops, cancelled_no_provider
(NEW — no provider accepted within timeout)

Dispute states overlay: dispute_open, dispute_resolved (do not block
the main state machine but freeze payouts)
```

### 10.2 Provider state machine (new)

```
application_submitted → under_review →
  ├── info_requested → (back to under_review)
  ├── approved → onboarding_in_progress → onboarding_complete → active
  └── rejected (terminal)

From active: → suspended (temporary, e.g. expired insurance) → active
From active: → terminated (permanent, e.g. dispute losses, fraud)
```

---

## 11. GDPR & compliance checklist — extended

### 11.1 Legal documents (v2 additions in bold)

- Privacy policy (lawful basis declared per purpose: contract for booking data, consent for marketing, **legitimate interest for provider performance data**)
- Terms of service (customer-facing)
- **Provider Master Services Agreement** — separately negotiated, signed during onboarding (electronic signature OK)
- Cookie policy
- Impressum
- **Data Processing Agreement (DPA)** template for providers (since they may process customer personal data on our behalf)

### 11.2 Technical requirements (v2 additions)

- All v0.1 requirements retained
- **Stripe Connect verification (KYC/KYB)** — handled by Stripe, but we store the verification status
- **Provider document encryption at rest** — insurance certs, criminal records, banking details: stored in a separate Supabase Storage bucket with row-level access policies
- **Provider data export**: separate endpoint at `/providers/account/data-export`
- **Provider data deletion**: complicated — providers have legal retention obligations (Swiss tax retention is 10 years on invoices). Provider account closure ≠ data deletion. See §11.5.

### 11.3 Special-services compliance — unchanged from v0.1

### 11.4 Payment & financial compliance (significantly expanded)

- **Stripe Connect Express accounts** for all providers — Stripe handles KYC and Swiss banking validation
- **Platform escrow**: customer payment is captured at booking, held until job completion, then split via Stripe transfer to provider (minus commission)
- **Commission invoicing**: platform issues a monthly invoice to each provider for commission earned. Provider keeps their books as if they invoiced the customer directly (because legally, they did — the platform is their sales channel).
- **VAT handling**:
  - Platform VAT registration triggers at CHF 100K of platform revenue (commission only, not GMV)
  - Providers handle their own VAT on the services delivered
  - Two separate invoicing chains: customer ← provider (for services) and provider ← platform (for commission)
- **Anti-money-laundering**: Stripe Connect KYB satisfies Swiss FINMA requirements at MVP scale; larger volumes (>CHF 10M GMV) need separate AML review

### 11.5 Provider data retention

- Tax-relevant data (invoices, payouts): retain 10 years per Swiss commercial law
- Operational data (job history, ratings): retain while active + 2 years
- Personal data (contact details of provider staff): erase on request unless tax-relevant
- A terminated provider's data is anonymized in customer-facing displays (reviews show "former partner") but kept intact in audit log

---

## 12. Tech stack recommendation — minor additions

All v0.1 choices retained. New for v2:

| Layer                 | Choice                                               | Why                              |
| --------------------- | ---------------------------------------------------- | -------------------------------- |
| Payments              | **Stripe Connect (Express)** in addition to Checkout | Marketplace payouts to providers |
| Document signing      | **Documenso** or **DocuSign Click** for provider MSA | Electronic signature, EU-region  |
| Identity verification | Bundled in Stripe Connect KYC                        | No separate vendor needed        |

---

## 13. Phased rollout plan — updated for v2

### Phase 0 — Static validation (Week 1)

Unchanged.

### Phase 1 — MVP single-tenant booking (Weeks 2-4)

- Customer booking flow for instant verticals
- Stripe one-time payment (no Connect yet)
- Backoffice for ops
- **All "providers" are hand-coded in the admin** — no portal yet
- Goal: 10 bookings end-to-end

### Phase 2 — Marketplace v1 (Weeks 5-10)

- Provider recruitment page + application flow
- Provider portal: listings, calendar, job inbox
- **Stripe Connect integration** (Express accounts)
- Job offer / accept flow with timeout
- Commission ledger + automated payouts
- Provider approval workflow in backoffice
- Customer-facing site unchanged
- Goal: 3-5 active providers, 50 jobs processed through the marketplace

### Phase 3 — Specialty verticals & recurring (Weeks 11-14)

- Quote-on-request workflow for aviation, yacht
- Special services intake (still curated-only on supply side)
- Recurring bookings via Stripe Subscriptions
- Customer accounts + portal
- Goal: first recurring customer; first specialty job via the marketplace

### Phase 4 — Scale & quality (Weeks 15-22)

- Disputes module
- Provider performance reviews (weekly)
- SMS notifications
- Multi-language (DE first)
- iCal sync for provider calendars
- Multi-region expansion
- Goal: 20+ active providers, hands-off ops for routine bookings

---

## 14. Out of scope (revised)

These are explicitly _not_ in this spec — decide later, don't build now.

- **Open (un-curated) marketplace mode** — applications without approval. Not happening.
- **Individual workers as providers** — legal firewall, never crossed.
- **Featured / paid-placement listings** — Etsy-style ads. Diluttes the brand, not in v2.
- **Provider-to-provider subcontracting** — too complex, opens liability gaps.
- **Native mobile apps** (iOS/Android) — PWA is enough for years.
- **Real-time chat between customer and provider** — phone + email for now.
- **AI-generated job scoping from photos** — fun but not core.
- **Public API** — only build if a provider asks.
- **White-label for providers** — distraction.

---

## 15. Open questions before starting

1. **Brand name + domain** — still open.
2. **First vertical(s) to launch** — recommendation unchanged: commercial + hospitality (instant) + yacht (marketing hook).
3. **Geographic launch zone** — Zurich + Lake Zurich, or wider?
4. **Commission rates** — recommendation is 15/20/25%; needs to be set before any provider signs.
5. **First 3 providers** — recruit them in person, don't wait for the portal. Use them to stress-test the onboarding flow before opening it publicly.
6. **VAT registration trigger** — calculate based on commission revenue, not GMV.
7. **Founder liability insurance** — get the brokerage-layer policy before any booking goes live.
8. **Stripe Connect application** — apply now; approval can take 2-3 weeks in Switzerland.
9. **Provider MSA terms** — draft with a Swiss lawyer; specifically the non-circumvention clause, IP, data, and dispute clauses.
10. **Customer service channel** — phone? WhatsApp? Email-only? SLAs.

---

## 16. Success metrics — updated for v2

All v0.1 metrics retained. New marketplace-specific metrics:

- **Supply-side acquisition**: applications submitted → approved → activated → first job completed
- **Supply utilization**: avg jobs/active provider/month, % of provider capacity used
- **Match quality**: avg job offers per booking before acceptance, % of bookings auto-matched vs. manually assigned
- **Provider retention**: % of providers active 3/6/12 months after onboarding
- **Financial**: commission revenue, payout volume, take-rate by vertical
- **Quality**: dispute rate per 100 bookings, dispute resolution time, refund-as-%-of-GMV

---

## 17. AI build prompt — updated for v2

> Build a Next.js 15 App Router project in TypeScript with Tailwind and shadcn/ui. Use Supabase for Postgres + Auth + Storage. Stripe for payments AND Stripe Connect (Express accounts) for marketplace payouts. Resend for transactional email. Implement the customer-facing booking flow in §6 and the provider-side flow in §6.0. Build the provider portal screens in §19 alongside the customer portal. Use RLS policies so customers see only their bookings, providers see only their assigned/offered jobs, and admin role sees all. Implement the booking state machine in §10.1 AND the provider state machine in §10.2 strictly — no shortcuts. Commission rates and matching rules in §18. Start with Phase 1 of §13 (manual providers, no Connect), then Phase 2 (full marketplace).

---

## 18. Commission & payout model (new in v2)

### 18.1 Commission rates (defaults)

| Vertical         | Commission | Notes                                                     |
| ---------------- | ---------- | --------------------------------------------------------- |
| Commercial       | 15%        | High volume, easy delivery                                |
| Hospitality      | 15%        | High volume, easy delivery                                |
| Aviation         | 20%        | Higher sales effort, premium customer                     |
| Yacht & marine   | 20%        | Higher sales effort, premium customer                     |
| Special services | Negotiated | Per-contract, typically 25-30% reflecting ops involvement |

These are platform-wide defaults. Individual providers can have an override (e.g. founding-partner deals at 10%) stored on the providers table. All overrides go into the audit log.

### 18.2 Money flow

```
Customer pays platform (full amount via Stripe Checkout)
           ↓
Funds held in platform Stripe balance
           ↓
   Job confirmed completed (customer marks done, or auto after 48h)
           ↓
Platform creates a Stripe Transfer to provider's Connect account:
   amount = booking total − commission − any agreed deductions
           ↓
Provider receives payout to their bank within Stripe's standard timing
   (typically 2 business days in CH)
```

### 18.3 Refund and chargeback handling

- **Customer cancellation >24h before**: full refund from platform; no provider payout, no commission earned
- **Customer cancellation <24h before**: 50% to provider (compensation for held capacity), 50% refunded to customer, platform takes no commission
- **Provider no-show**: full refund to customer, no payout to provider, platform absorbs cost, provider strike logged
- **Customer dispute (post-job)**: payout held until dispute resolved; commission held in escrow
- **Chargeback**: amount clawed back from provider's next payout; multiple chargebacks trigger suspension

### 18.4 Payout schedule

- Default: weekly payout every Monday for jobs completed Mon-Sun previous week
- Hold period: 7 days post-completion before payout becomes eligible (covers dispute window)
- Manual payout: super admin can trigger early payout in edge cases (logged in audit)
- Minimum payout: CHF 50 (smaller balances roll to next cycle)

### 18.5 Tax invoicing

- The provider invoices the customer directly (legal seller of service) — invoice generated by the platform on their behalf and shows their VAT number
- The platform invoices the provider monthly for the commission earned — platform's own invoice with platform VAT number
- Customer sees one charge on their card from the platform brand; the underlying VAT structure is invisible to them

---

## 19. Provider portal spec (new in v2)

Auth-gated under `/providers/account`. Provider role assigned after onboarding completion.

### 19.1 Screens

1. **Dashboard** — KPIs: upcoming jobs, jobs this week, earnings MTD, average rating, pending offers
2. **Job inbox** — new offers awaiting accept/decline, with full booking details, customer-anonymized until accept
3. **Calendar** — manage availability, see assigned jobs, mark complete
4. **Jobs** — full history, filter by status, see customer rating per job
5. **Listings** — services I offer, regions I cover, pricing (where applicable), capacity rules
6. **Earnings** — payout history, upcoming payouts, downloadable monthly statements
7. **Documents** — uploaded credentials, expiry warnings (insurance expiring in 30 days), upload renewals
8. **Profile** — company details, contact info, public profile preview
9. **Team** — invite staff members (e.g. dispatchers within the provider company), assign roles
10. **Settings** — notification preferences, Stripe Connect status, account closure

### 19.2 Provider portal design

Uses the same design system as the customer-facing site (see `DESIGN_SPEC.md`). Tighter information density per the backoffice rules in design spec §5.5. No marketing copy, no big display type — this is an operational tool.

### 19.3 Mobile-first

Providers are likely managing jobs on the road. The portal must be fully usable on a phone, especially:

- Job inbox (accept/decline within minutes)
- Calendar (block a slot from your phone)
- Mark-job-complete with photo upload

---

## 20. Provider onboarding flow (new in v2)

```
[/providers landing page]
        ↓
Step 1 — Application form (/providers/apply)
   - Company name + legal entity type
   - Contact name, email, phone
   - Region + verticals interested in
   - Why you'd be a good fit (free text)
   - Submit
        ↓
Step 2 — Email confirmation + provisional account
   - Magic link to set password
   - Lands on /providers/account/onboarding (gated)
        ↓
Step 3 — Document upload
   - Insurance certificate (PDF)
   - Criminal record extract (if applicable to vertical)
   - VAT certificate (if applicable)
   - Vertical certifications (e.g. for aviation)
   - Add 1-2 references (name, contact)
        ↓
Step 4 — Stripe Connect onboarding
   - Redirect to Stripe Connect Express onboarding
   - Stripe verifies KYB/KYC
   - Returns to platform with status
        ↓
Step 5 — Listing draft
   - What services do you offer?
   - Where do you operate?
   - Capacity per day
   - Lead time required
        ↓
Step 6 — Review by Provider Ops
   - Application + documents reviewed in admin
   - 3 outcomes: approved, info-requested, rejected
   - Approved = portal switches to "active", first job offers can flow
        ↓
Step 7 — Welcome
   - First-job ramp-up: limit offers to 3 jobs in first week
   - Performance reviewed after 5 jobs before full activation
```

### 20.1 Onboarding SLA

- Application acknowledgment: within 24h (automated email)
- Document review: within 5 business days
- Stripe Connect verification: depends on Stripe (typically 1-3 business days)
- Total onboarding time target: < 10 business days from application to first eligible offer

---

## 21. Changelog from v0.1

- **§1.5 added** — Strategic positioning making the curated marketplace explicit
- **§2 updated** — Added "marketplace mode" column; special services stays curated-only
- **§3 expanded** — Added provider-side personas; added Provider Ops role
- **§4 updated** — Added `/providers/*` paths; added `/legal/provider-terms`
- **§5b added** — Provider recruitment page spec
- **§6 extended** — Added provider-side job offer flow (§6.0) and matching engine (§6.0.1)
- **§8 rewritten** — Calendar now managed by providers themselves
- **§9 extended** — New roles (Provider Ops), new screens (Provider applications, Payouts, Disputes, Commissions)
- **§10 extended** — Renamed `partners` to `providers` with new fields; new tables for applications, documents, listings, offers, payouts, commission_ledger, disputes
- **§10.1 extended** — Added offer_dispatched/accepted states; added provider state machine §10.2
- **§11 extended** — Provider terms, DPA, document encryption, Stripe Connect, tax invoicing
- **§12 extended** — Stripe Connect, document signing
- **§13 rewritten** — Marketplace phase added (Phase 2), other phases shifted
- **§14 updated** — Open marketplace, individual workers, featured listings, sub-subcontracting all explicitly out
- **§15 updated** — New open questions (commission rates, first providers, Stripe Connect application, MSA legal)
- **§16 updated** — Marketplace-specific metrics
- **§17 updated** — Build prompt mentions Connect and provider portal
- **§18 added** — Commission & payout model
- **§19 added** — Provider portal spec
- **§20 added** — Provider onboarding flow

---

_End of v0.2 spec. Iterate as the marketplace finds its shape._
