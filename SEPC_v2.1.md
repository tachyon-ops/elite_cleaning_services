# Spec Extension v2.1 — Building Care & Restaurant/Kitchen Verticals

> Extends `SPEC.md` v2.0. Adds two B2B recurring verticals.
> Section numbers below map onto the parent spec (§2, §7, §10, §13).
> Recruitment / job board (previously "idea 3") is **deferred** — see §R at the end.

---

## A. What this adds (one paragraph)

Two new verticals, both **B2B and recurring by default** — a different customer shape than the consumer/guest flow in the core spec. The buyer is an _organisation_ (a property manager, or a restaurant/group), not an individual, and one buyer typically owns **many sites under many contracts**. This breaks the current flat `customer → booking` model and is the main reason these aren't a trivial add: they need an org/portfolio layer and B2B (consolidated-invoice) billing. Both keep the luxury front door — positioned as _managed care for premium addresses_ and _compliance you can hand to your insurer_, never as cheapest-bid commodity work.

---

## B. New verticals (extends §2 table)

| Vertical                                   | Sub-tiers                                                                  | Pricing model                                                                                    | Buyer                  | Cadence                                                     | Quote SLA                                 |
| ------------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| **Building Care** (Liegenschaftsunterhalt) | Common-area cleaning                                                       | Per-building (entrances + common m² + frequency)                                                 | Hausverwaltung / STWEG | Recurring (weekly/bi-weekly default)                        | < 48h, site visit optional for portfolios |
| **Restaurant & Kitchen**                   | **A. Extraction & compliance** (lead) / **B. Nightly maintenance** (entry) | A: per hood-metre + duct + grease-load + certificate. B: per m²/covers + frequency + after-hours | Restaurant / group     | A: mandated cadence (quarterly–biannual). B: nightly/weekly | A: < 48h + survey. B: instant-ish         |

**Scope discipline (important):**

- Building Care is **cleaning of common areas only**. Snow clearing, gardening, full Hauswartung → explicitly out of scope (park as a future "Hauswart bundle via specialist partner"). Don't drift into caretaking — that's a different business and a different labour profile.
- Restaurant Tier A is the **margin engine**: extraction/hood/duct cleaning is fire-prevention-regulated (VKF) and frequently _required_ by insurers with a certificate. The deliverable is the clean **plus the certificate and before/after documentation**. Tier B (nightly) is the entry product when a partner lacks extraction certification, or as a standalone.

---

## C. Positioning notes (brand fit — "same luxury front door")

- **Building Care** holds the luxury frame _only if scoped to premium addresses_: discreet, reliable common-area care for prestige residential buildings. Frame = "we look after the building your tenants pay a fortune to live in." It breaks the brand the moment you chase commodity Verwaltung tenders on price.
- **Restaurant** leans into competence-signalling: "we clean it and hand you the certificate." Compliance-as-a-service fits the serious-operator positioning better than mopping does. Lead the landing page with extraction/compliance, not nightly cleaning.

---

## D. Intake schemas (extends §7)

### 7.6 Building Care

- Property type (residential building / mixed-use / commercial building)
- Number of entrances / staircases
- Number of floors
- Common-area surface (approx m²)
- Lift present? (y/n — drives cabin cleaning)
- Underground garage / Einstellhalle? (y/n, approx m²)
- Waste & recycling room included? (y/n)
- Window cleaning of common areas — separate cadence? (y/n + frequency)
- Frequency wanted (weekly / bi-weekly / monthly / custom)
- Preferred fixed service day + window (fixed weekday rounds matter operationally)
- Access (key / Schließanlage code / on-site contact)
- **Portfolio**: number of additional properties to onboard (links to org account, §10)
- Notes (free text)

> Ops note: different labour + equipment profile than turnover/detail cleaning (heavier, outdoor-adjacent, fixed recurring rounds). Partner must commit to a **fixed recurring schedule**. Abnahmegarantie is irrelevant here (that's Endreinigung).

### 7.7 Restaurant & Kitchen

**Shared:**

- Venue type (restaurant / bar / café / hotel F&B / commercial kitchen / bakery)
- Surface area m² (FOH + BOH)
- Covers / seats (size proxy)
- Tier requested (extraction/compliance / nightly maintenance / both)
- Frequency
- When cleaning can happen (after close — operating hours)
- Access & alarm/key handling

**Extraction & compliance (Tier A) — additional:**

- Kitchen size m²
- Cooking type / grease load (heavy: wok, grill, fryer — vs light) → drives frequency
- Hood/canopy length (m) + number of hoods
- Extraction duct accessible? Roof fan? (drives survey need)
- Last certified extraction clean (date)
- Certificate required for (insurer / fire authority / internal)

> SLA: Tier A = quote-on-request, on-site survey within 48h for non-trivial ducting. Tier B = fast/instant quote by m²/covers + frequency, after-hours surcharge applied.

---

## E. Pricing models (extends §9.7)

- **Building Care**: `base_per_entrance + (common_m² × rate) × frequency_multiplier`, with a recurring-contract discount. Annual contract, monthly billing. Quote-on-request first; templatise once you've priced ~10 buildings.
- **Restaurant Tier A**: `per_hood_metre + duct_complexity + grease_load_multiplier + certificate_fee`. Cadence set by cuisine/grease load. Recurring by mandate.
- **Restaurant Tier B**: `(m² or covers) × rate × frequency + after_hours_surcharge`.

---

## F. Data model additions (extends §10)

The core change: an **organisation/portfolio layer** the consumer schema doesn't have.

```
organizations            (B2B account)
  id, name, type enum (verwaltung, restaurant_group, hospitality, other),
  uid_vat, billing_address, billing_email, payment_terms enum (card, invoice_net30),
  primary_contact_name, primary_contact_phone, account_manager_user_id, status

properties               (a managed site under an org)
  id, organization_id, name, address, geo, type,
  intake jsonb (building specs OR venue specs per §7.6/7.7),
  access_info jsonb, notes

service_contracts        (recurring B2B agreement — generalises consumer §10 recurring_schedules)
  id, organization_id, property_id, vertical, tier,
  frequency enum, schedule (day_of_week, window),
  partner_team_id (nullable until assigned),
  price_chf, billing_cadence enum (monthly_invoice, stripe_subscription),
  starts_on, ends_on, status enum, notes

job_occurrences          (one scheduled visit generated from a contract)
  id, contract_id, scheduled_at, partner_team_id, status enum (see §10.1),
  completion_photos[], rating, certificate_doc_id (nullable), notes
```

**Notes:**

- `bookings` (consumer) and `job_occurrences` (B2B recurring) share the state machine in §10.1 but are generated differently: consumer = one-off; B2B = instances spawned from a `service_contract`.
- **Billing differs from consumer flow.** B2B wants a **monthly consolidated invoice** (net-30), not a per-job deposit + card charge. Use Stripe Invoicing, not the §6 deposit flow, for `payment_terms = invoice_net30`.
- **Certificate storage** (Restaurant Tier A): each compliance clean produces a certificate artifact, linked to the `property`. Retention is **longer** than the §11.3 special-services 90-day auto-delete — these are compliance records; keep for the contract term + legal minimum, not auto-purged.

---

## G. Flow differences (extends §6)

- **Quote-first, not checkout-first.** Both verticals route to a quote/contract workflow, not instant payment — closer to the §6 specialty path than the consumer instant path.
- **Portfolio onboarding.** A Verwaltung onboards once as an org, then adds N properties, each spinning up its own contract. Susana / ops drive this; it's relationship sales, not self-serve.
- **No guest checkout.** These customers are always registered orgs with an account manager.

---

## H. IA & design notes (light — design system already covers it)

- New routes (extends §4): `/building-care`, `/restaurant`.
- Photography (per DESIGN_SPEC §6.1): Building Care → lobby/entrance architecture, polished stone floors, glass partition detail at golden hour. Restaurant → gleaming stainless kitchen, clean extraction hood detail, empty dining room at blue hour. No people, no spray-bottle clichés.
- Backoffice (extends §9): add **Organisations** and **Contracts** screens; bookings table gains a contract/occurrence filter.

---

## I. Phasing (extends §13)

- Both are **Phase 2+** — quote-driven, recurring, B2B.
- **Building Care is a strong early B2B wedge** (recurring revenue from day one, sophisticated repeat buyer) — worth pulling forward _if_ the org/portfolio layer in §F is built first. Don't bolt portfolio onto the consumer schema as a shortcut; it'll bite you.
- Restaurant Tier A (extraction/compliance) can launch as soon as you have ≥1 certified partner.

---

## §R. Recruitment / job board — DEFERRED (do not build)

Parked pending capital. Reason: a commissioned (or partner-paid) job-matching board is **regulated private placement** under the AVG and needs a cantonal placement permit + a qualified responsible person (Swiss/permanent-resident/EU-EFTA, HR training or multi-year experience, good repute). Operating it unlicensed risks fines up to CHF 100k for the platform **and up to CHF 40k for partners who knowingly use it** — a partner-acquisition hazard, not an asset.

**Trigger to revisit:** capital in place to (a) secure the placement permit, and (b) appoint/hire a qualified responsible person. Until then, any candidate-flow help to partners stays a **free, unpriced value-add** of the cleaning network (legally clean side of the line — confirm with AVG counsel), monetised indirectly through brokerage margin, never as a line item.

> Not legal advice. Before building §R, get a written read from a Swiss employment-law specialist (AVG/LSE).

---

_End of v0.2 extension. Merge into `SPEC.md` and renumber as needed._
