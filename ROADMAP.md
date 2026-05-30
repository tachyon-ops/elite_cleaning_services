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

### Phase 3 — Verification & Specialty Workflow
- [x] Vitest, JSDom, and baseline utility TDD tests
- [x] Specialty Quote-on-Request intake forms (Aviation & Yachting)
- [x] Operator Quoting sidebar UI under `/admin/bookings`
- [x] Public guest quote review & 30% deposit secure Stripe checkout page
- [x] Recurring schedules & Stripe Subscription simulations

---

## Current Milestone (Active Phase)

### Phase 3 (Cont.) — Registered Customer Accounts
- [ ] Registered customer accounts registration/login workflows
- [ ] Customer dashboard portal at `/customer/dashboard` to inspect past orders, pay pending quotes, and manage profiles

---

## Future Milestones

### Phase 4 — Scale, Quality & Polish
- [ ] Dispute mediation screens for customers, providers, and operators
- [ ] Weekly provider performance metrics calculations (ratings, cancellation rates)
- [ ] Automatic SMS notifications for status updates
- [ ] Calendar synchronization (iCal export/import) for providers

