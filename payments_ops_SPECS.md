# Payments, Cancellation, Calendar & Mediation — Spec v0.1

> Companion to `SPEC.md` and `DESIGN_SPEC.md`.
> This document defines the money flow, cancellation policy, booking calendar, recurring/rescheduling, and the mediation system.
> These five pieces are the moat: aggregated demand + a guarantee + reliable payment + a system of record neither side can replicate alone.

---

## 1. Money flow — what's collected, when, and where it goes

### 1.1 Price components (internal)

Every booking total is built from three parts. **The customer sees ONE price.** Do not itemise these on the checkout screen — line-itemised fees read as Ryanair, not Swiss luxury. The split is internal and only surfaces in the cancellation terms.

| Component        | Goes to  | Purpose                                            |
| ---------------- | -------- | -------------------------------------------------- |
| **Service cost** | Partner  | What the partner is paid for the job               |
| **Booking fee**  | Platform | Your commission / margin                           |
| **Risk buffer**  | Platform | Reserve for refunds, partner no-shows, chargebacks |

`total_charged = service_cost + booking_fee + risk_buffer`

Start with booking fee = a flat % of service cost (e.g. 15–20%) and risk buffer = a small flat % (e.g. 3–5%). Tune both with real data.

### 1.2 Checkout flow — authorise, then capture on partner confirmation

This directly answers "validate availability before collecting the upfront." Use Stripe's separate authorise/capture:

```
Customer checks out
   ↓
Stripe PaymentIntent created with capture_method = "manual"
   → card AUTHORISED (funds held, not charged)
   ↓
Job dispatched to partner → partner confirms availability within SLA
   ├── Partner CONFIRMS  → capture the PaymentIntent (now charged), booking confirmed
   └── Partner DECLINES / SLA timeout → cancel the auth (hold released), customer offered alternative or waitlist
```

- The customer feels committed (card is held) but is never charged for a job no partner can do.
- The partner never pre-commits to capacity they don't have.
- Card authorisations hold for a limited window (around 7 days for cards — **confirm the current window in Stripe docs at build time**). That comfortably covers a 4-hour confirmation SLA.

For high-volume standard verticals (commercial, hospitality) where you've pre-blocked real partner inventory, you may capture immediately for a true instant-book. Keep authorise-then-capture as the default everywhere else.

### 1.3 Connect setup & payout timing

- **Stripe Connect Express**, one connected account per partner company (company-to-company — keep the Personalverleih firewall intact; never onboard individuals).
- Use **separate charges + transfers** (not direct destination charges) so you hold the funds and control release. You are the merchant of record; the customer's relationship and the payment both sit with you.
- **Payout to partner: only after job completion + a dispute window** (e.g. 48h post-completion with no dispute raised). Then create a `transfer` to the partner's connected account for the `service_cost`.
- Your `booking_fee` and `risk_buffer` are retained by the platform automatically (they were never transferred).
- Decide your three Connect rules up front: **who pays Stripe's fees** (build into the price), **when payouts happen** (post-completion + window), **how long funds are held** (until the dispute window closes).

### 1.4 Provider recommendation

Stripe Connect Express. It's available in Switzerland and the EU and shifts payments compliance onto Stripe. European-HQ marketplace-native alternatives exist (Mangopay, Adyen for Platforms) but offer no advantage at your stage — and you build the customer "credit wallet" yourself in your own DB (§3.3), so you don't need their wallet/escrow products. Revisit only at meaningful scale.

---

## 2. Cancellation & refund policy

### 2.1 The tiers

Stated as a percentage of the **total** the customer paid. Penalty escalates as the job gets closer.

| When the customer cancels                       | Refunded | Forfeited | Default form |
| ----------------------------------------------- | :------: | :-------: | ------------ |
| **Within 24h of booking** (and >48h before job) |   100%   |    0%     | Cash         |
| **More than 48h before the job**                |   75%    |    25%    | Credit       |
| **Within 48h of the job**                       |   25%    |    75%    | Credit       |
| **No-show / day-of cancellation**               |    0%    |   100%    | —            |

- The first tier is a buyer's-remorse / cooling-off window: full cash back if they cancel quickly **and** the job isn't imminent.
- After that, the forfeited slice protects your margin and compensates the partner for the lost slot.

> **Legal note (not legal advice — I'm not a lawyer):** Switzerland has no broad mandatory cooling-off for online sales, but the EU's distance-selling rules (14-day withdrawal) may apply to your EU customers, with service-specific exceptions for dated appointments. Have a Swiss/EU consumer-law review confirm the tiered penalties are enforceable in your terms before launch, especially the no-refund tiers.

### 2.2 Credit, not cash, by default

- Outside the cooling-off window, refunds are issued as **platform credit**, not cash. The credit stays in the customer's account and is applied to their next booking.
- This keeps money in the system and nudges rebooking instead of churn.
- The customer can **rebook** using the credit at any time.

### 2.3 Manual cash refund (admin)

- A cash refund (instead of credit) is possible **only via the back office**, and **only with the partner's agreement** (because the partner may have already been compensated or held the slot).
- Flow: customer requests cash-out → ops opens the case → partner approves/declines in their portal → on approval, ops issues the Stripe refund and zeroes the corresponding credit.
- Every manual refund is written to the `audit_log` and the `credit_ledger`.

---

## 3. Data model additions

Extends `SPEC.md` §10. Same conventions (`id` uuid, `created_at`, `updated_at`).

```
-- bookings: add columns
bookings (additions)
  service_amount_chf, booking_fee_chf, risk_buffer_chf,
  total_charged_chf, amount_captured_chf,
  stripe_payment_intent_id, capture_status enum (authorised, captured, released),
  partner_confirmed_at, partner_declined_at

credits                       -- one row per customer = their wallet balance
  customer_id, balance_chf, currency default 'CHF'

credit_ledger                 -- every credit movement, append-only
  customer_id, booking_id (nullable), delta_chf,
  type enum (issued, redeemed, refunded_cash, adjustment),
  reason, actor_user_id

cancellations
  booking_id, initiated_by enum (customer, ops, partner),
  cancelled_at, tier enum (cooling_off, gt_48h, lt_48h, no_show),
  refund_pct, amount_refunded_chf, credit_issued_chf, refund_form enum (cash, credit)

reschedule_requests
  booking_id, requested_new_at, requested_window,
  status enum (pending, approved, declined, expired),
  partner_responded_at, notes

payouts
  partner_id, booking_id, amount_chf,
  stripe_transfer_id, status enum (pending, released, reversed),
  released_at

disputes
  booking_id, raised_by enum (customer, partner),
  category enum (quality, no_show, damage, scope, other),
  status enum (open, under_review, resolved),
  resolution enum (redo, partial_refund, full_refund, credit, dismissed),
  resolution_amount_chf, ops_user_id, opened_at, resolved_at

messages                      -- mediated communication, per booking
  booking_id, sender_role enum (customer, partner, ops),
  body, created_at, visible_to text[]   -- e.g. {customer,ops} or {partner,ops}
```

---

## 4. Booking calendar — both sides

One source of truth (`availability_blocks` + `bookings`), two views.

### 4.1 Customer view (booking flow)

- Shows the next 14 days of **available** slots for the chosen vertical + region only. No partner names, no internal capacity exposed.
- Day picker per `DESIGN_SPEC.md` §4.8: today outlined, available in `--color-ink`, unavailable struck-through and muted, selected in `--color-accent`.
- Time-window picker as the 4-column pill grid (the one place pills are allowed).
- If nothing is available in 14 days → switch the form to "join the waitlist," capture the request, notify ops.
- Goal: feel instant and effortless. The customer never sees the machinery.

### 4.2 Partner view (portal — Phase 2, but design the data now)

- Their **assigned jobs** only, in a week/month calendar.
- Per job: **Confirm / Decline** (drives the §1.2 capture), then later **Mark complete + upload photos**.
- Set `working_hours` and add `availability_blocks` (vacation, fully booked) themselves.
- Never sees other partners or platform-wide data.

> For launch (Phase 1) ops manages slots manually per `SPEC.md` §8.1. Build the partner-facing calendar in Phase 2. But create the schema now so you don't migrate later.

---

## 5. Recurring & rescheduling

### 5.1 Recurring UI (streamlined)

- Entry: post-completion prompt ("Make this recurring and save 10%") → `/account/recurring/new`.
- One screen: pick **frequency** (weekly / bi-weekly / monthly / quarterly), **day**, **time window**. Show the next 3–4 occurrences inline so they see exactly what they're committing to.
- Creates a **Stripe Subscription**; discount applied as a coupon.
- Manage screen: upcoming occurrences list, with **skip one**, **pause**, **change frequency**, **cancel**. Each occurrence is a normal booking record so it flows through the same calendar, capture, and completion logic.

### 5.2 Rescheduling rules

- **≥ 2 weeks before the occurrence:** customer can request a reschedule freely — but it is a **request**, `status = pending`, and goes to the partner for approval. On approval the occurrence moves; on decline the original stands and the customer can cancel under §2.
- **< 2 weeks before:** no self-serve reschedule. Treated as a cancellation under the §2.1 tiers (so the closer it is, the more they forfeit).
- Reschedules never re-charge; they move the existing captured/authorised amount to the new date.

---

## 6. Mediation & support — the platform is always the intermediary

The principle from the moat discussion: **don't wall them apart, sit in the middle of every interaction that matters.** Communication is fine; money and disputes always route through you.

### 6.1 Communication

- All customer↔partner messaging happens in an **in-app thread tied to the booking** (`messages` table). No phone numbers or emails exchanged.
- Coordination content (access codes, scope, hangar/marina details) lives in the thread, logged and visible to ops.
- Keep it light-touch on control: you set the standard and own the customer, the partner decides how they deliver. Over-directing _how_ they work undermines the brokerage (independent-company) framing.

### 6.2 Dispute flow

```
Customer or partner raises an issue  → dispute opened (status: open)
   ↓
Ops reviews (status: under_review) — sees the full booking, thread, photos
   ↓
Ops resolves with one of:
   • Re-do (re-dispatch, no extra charge)
   • Partial refund / credit
   • Full refund / credit
   • Dismiss
   ↓
Resolution recorded; payout to partner adjusted accordingly (held until resolved)
```

- Funds are held (payout not released) while a dispute is open — this is _why_ the post-completion window in §1.3 exists.
- Customer-facing promise: "If something's wrong, we make it right — re-do or refund." Partner-facing promise: "We handle the customer; you're never stuck arguing about money."

### 6.3 Why this is the moat, restated for the build

- **Backup guarantee:** if a partner falls through, ops re-dispatches. An individual can't offer this. Build the re-dispatch path into the dispute/cancellation flow.
- **You hold payment + recourse + the record.** Going direct means the customer loses the guarantee and the partner loses the pipeline and gets the admin back.
- **Non-circumvention** belongs in the partner _contract_ (company-to-company, enforceable, invisible to the customer) — not in the software.

---

## 7. Landing-page copy (customer-facing)

Plain words for the public site. Slot into `SPEC.md` §5 and the `DESIGN_SPEC.md` homepage layout.

**The guarantee block:**

> Book with confidence. Every job is delivered by a vetted Swiss partner, fully insured. If something isn't right, we re-do it or refund you — you deal with us, never with a stranger.

**How payment works:**

> One price, no surprises. We hold your payment until your partner confirms your slot, and we only release it to them once the job is done to your standard.

**Cancellation, stated simply:**

> - Change your mind within 24 hours? Full refund.
> - Cancel more than 48 hours before? Keep 75% as credit toward your next booking.
> - Closer than that, or no-show? A larger fee applies, since your slot was reserved.
> - Credit never expires, and you can rebook anytime.

Keep it calm and confident per `DESIGN_SPEC.md` §1 — no urgency banners, no countdowns.

---

## 8. Build order

1. **Money flow first** (§1) — PaymentIntent authorise→capture, Connect Express onboarding for your one partner, separate-charges-and-transfers, post-completion payout.
2. **Cancellation + credit** (§2, §3) — tiers, `credit_ledger`, manual-refund admin flow.
3. **Customer calendar** (§4.1) — you already need this for Phase 1 bookings.
4. **Mediation + disputes** (§6) — in-app thread + dispute resolution in the back office.
5. **Recurring + reschedule** (§5) — Phase 2, once one-off bookings work end-to-end.
6. **Partner portal calendar** (§4.2) — Phase 2 reward, after the partner trusts the volume.

Build 1–4 before you publish to customers. 5–6 come once the first jobs run clean.

---

_End of v0.1. Update alongside `SPEC.md` as the model meets real partners and real bookings._
