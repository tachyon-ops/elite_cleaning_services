---
name: codebase-map
description: >
  Project-specific orientation: where every kind of thing lives in this
  codebase. Fill in paths, package names, and conventions. Load at the start of
  every session to know where to look and where to put things.
---

# Codebase Map

> This file represents the layout, structure, and conventions for the Elite Cleaning Services application. Keep it accurate and update it as the repository layout evolves.

---

## Project Identity

- **Name:** Elite Cleaning Services
- **Purpose (one sentence):** A modern, Swiss-based booking platform for specialty cleaning (aviation, yacht, commercial, hospitality, special-services) utilizing vetted subcontractors.
- **Primary stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Supabase (Postgres & Auth), Stripe, Resend.
- **Repository layout:** Single-repo application with both client-facing booking flows and admin dashboards.

---

## Top-Level Structure

```
cleanup/
├── src/                          ← Next.js source code
│   ├── app/                      ← App Router pages, layout, and API route handlers
│   │   ├── globals.css           ← Tailwind CSS v4 entry point with design tokens
│   │   └── page.tsx              ← Homepage component
│   ├── components/               ← Application react components
│   │   └── ui/                   ← shadcn UI primitive components
│   ├── lib/                      ← Business logic, third-party integrations
│   │   ├── db.ts                 ← Prisma client singleton instance
│   │   ├── db/                   ← Secure database access layer (roles, bookings, profiles)
│   │   └── supabase/             ← Supabase client configurations (client, server, middleware)
│   └── middleware.ts             ← Global Next.js middleware handling session refreshes
├── prisma/                       ← Prisma database schema & local DB configurations
│   ├── schema.prisma             ← SQLite database modeling declarations
│   └── dev.db                    ← SQLite local database file (ignored in git)
├── supabase/                     ← Supabase local configuration & database migration files
│   └── migrations/               ← PostgreSQL migration scripts
├── .agents/                      ← Local operational tools and skills for agents
├── docs/                         ← Documentation folder
│   └── adr/                      ← Architectural Decision Records (ADRs)
├── components.json               ← shadcn UI CLI configuration
├── package.json                  ← NPM dependencies, scripts, metadata
├── tsconfig.json                 ← TypeScript compiler settings
├── eslint.config.mjs             ← ESLint flat config file
├── postcss.config.mjs            ← PostCSS configuration for Tailwind CSS v4
└── .env.example                  ← Environment variables boilerplate
```

---

## Where Things Live

| Kind of thing | Where it lives | Naming convention |
|---|---|---|
| Domain entities and types | `src/types/` | `*.types.ts` |
| Pure business logic | `src/lib/` | camelCase functions |
| Secure database wrappers | `src/lib/db/` | kebab-case filenames, e.g. `bookings.ts` |
| Database client configuration | `src/lib/db.ts` | `db.ts` |
| SQLite database schema | `prisma/` | `schema.prisma` |
| Integrations / Clients | `src/lib/` | camelCase client files, e.g. `stripe.ts` |
| HTTP / API endpoints | `src/app/api/` | App Router standard `route.ts` inside folder |
| Database migrations | `supabase/migrations/` | `YYYYMMDDHHMMSS_name.sql` |
| Configuration | root configurations | kebab-case filenames |
| Shared utilities | `src/lib/utils.ts` | camelCase helpers |
| Frontend components | `src/components/` | PascalCase, e.g. `BookingStepper.tsx` |
| Frontend pages / routes | `src/app/` | Folder named after route containing `page.tsx` |
| Unit and integration tests | `src/__tests__/` | `*.test.ts` or `*.test.tsx` |

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Folder / Package | kebab-case | `special-services` |
| Public function | camelCase | `formatCurrency` |
| Component | PascalCase | `BookingCard` |
| Type / Interface | PascalCase | `BookingIntake` |
| Constant | UPPER_SNAKE_CASE | `BASE_CLEANING_RATE_CHF` |
| File | kebab-case | `booking-summary.tsx` |
| Test file | `.test.ts` / `.test.tsx` | `booking-summary.test.tsx` |
| Environment variable | UPPER_SNAKE_CASE | `NEXT_PUBLIC_SUPABASE_URL` |

---

## Package / Module Dependency Direction

```
src/app/* (pages / APIs)      ← may depend on components/*, lib/*, and third-party SDKs
    ↓
src/components/*              ← may depend on lib/*, components/ui/*; NOT on app/*
    ↓
src/lib/*                     ← may depend on other libs; NO dependencies on components/* or app/*
```

---

## Build, Run, Test

Commands to compile, run, and check code status:

```bash
# Install dependencies
npm install

# Run dev / local server
npm run dev

# Run build compilation & type-checks
npm run build

# Lint files
npm run lint
```

---

## Environment

- Required environment variables are documented in `.env.example`.
- Never commit active API keys, credentials, or `.env` files.

---

## Key Documents to Read

1. This file (`codebase-map/SKILL.md`)
2. `agents-rules` skill (`.agents/SKILL.md`)
3. Product Specification (`SPEC.md`)
4. Visual Design Specification (`DESIGN_SPEC.md`)

---

## Update Discipline

- When directories are modified or conventions updated, modify this codebase map file in the same commit.
- Keep the map aligned with actual project structure to ensure clear development orientation.

---

## The Codebase-Map Mantra

> **"Tell the agent where things live. Keep it true. Update in the same commit. A lying map is worse than no map."**
