# Project Roadmap — Elite Cleaning Services

This roadmap outlines the completed features, the current focus, and subsequent milestones for the Specialty Cleaning Marketplace platform.

---

## Completed Phases

### Phase 1 — MVP Single-Tenant Booking
- [x] Initial SQLite and Prisma schema setup
- [x] Booking intake form for instant verticals (Domestic, Commercial, Hospitality)
- [x] Guest checkout flow with simulated email OTP verification
- [x] Operations backoffice dashboard for basic booking and status management

### Phase 2 — Marketplace v1 & Scaffolding
- [x] Subcontractor application form (`/providers/apply`) and review queue in backoffice
- [x] Provider dashboard portal (`/providers/account`) for managing company listings, regions, and documents
- [x] Simulated Stripe Connect setup for provider payouts
- [x] Multi-language support structure (i18n) scaffolding for German (`de`) and English (`en`)

---

## Current Milestone (Active Phase)

### 1. Test Suite Setup & TDD Infrastructure
- [ ] Configure `vitest` + `jsdom` + `@testing-library/react` dev dependencies
- [ ] Establish a test environment with simulated SQLite database configurations for integration tests
- [ ] Set up baseline unit tests for key utility functions (auth, OTP, i18n key translation)

### 2. Phase 3 — Quote-on-Request Workflow (Aviation & Yachting)
- [ ] Implement the front-end intake schemas for **Aviation Detailing** and **Yacht & Marine Care**
- [ ] Create server actions to register bespoke booking requests as `quote_pending` in the database
- [ ] Implement backoffice screens under `/admin/bookings` allowing operators to view requests, generate quotes (`amountChf`, `validUntil`), and send them
- [ ] Build a public customer review page (`/book/quote/[id]`) for checking the quote, accepting it, and completing the simulated Stripe deposit payment to transition booking to `confirmed`

---

## Future Milestones

### Phase 3 (Cont.) — Recurring & Accounts
- [ ] Recurring bookings with Stripe Subscription simulations
- [ ] Registered customer accounts & customer portal

### Phase 4 — Scale, Quality & Polish
- [ ] Dispute mediation screens for customers, providers, and operators
- [ ] Weekly provider performance metrics calculations (ratings, cancellation rates)
- [ ] Automatic SMS notifications for status updates
- [ ] Calendar synchronization (iCal export/import) for providers
