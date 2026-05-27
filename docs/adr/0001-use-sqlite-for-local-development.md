# ADR-0001: Use SQLite for Local Development via Prisma ORM

- **Status:** Proposed
- **Date:** 2026-05-27
- **Deciders:** Agent, User

## Context

The initial system design was planned around Supabase (PostgreSQL) as the primary data store, using Row-Level Security (RLS) policies to isolate tenant data. However, local developers may want to run the project in a simpler configuration without launching a full Docker-based Supabase environment or external cloud PostgreSQL instances. 

To facilitate offline local development, we need a lightweight, self-contained database engine.

## Decision

We will use SQLite (`dev.db` file) for local development. To prevent vendor lock-in and make the transition back to PostgreSQL straightforward, we will adopt **Prisma ORM** as the database abstraction layer. 

The developer can swap the provider in `prisma/schema.prisma` from `sqlite` to `postgresql` when migrating to production.

## Alternatives Considered

- **Raw better-sqlite3 with custom SQL files:** Rejected because migration to PostgreSQL would require rewriting all queries and schemas.
- **Drizzle ORM:** A viable alternative, but Prisma was chosen for its simpler single-file model mapping schema, which is highly readable for quick schema validation.
- **Dockerized PostgreSQL:** Rejected to allow zero-dependency local runs.

## Consequences

### Positive
- Zero external database dependencies are required for developers to run the application locally.
- Single-line database engine configuration mapping in `prisma/schema.prisma`.

### Negative
- SQLite does not support native database-level Row-Level Security (RLS) or custom enum types.
- **Mitigation:** We must implement strict application-level authorization layers (Service/Repository wrappers in `src/lib/db/`) that explicitly validate session ownership and actor roles before performing queries.

### Neutral
- JSON columns will be stored as text strings in the SQLite database file and parsed inside the application client.

## References
- Prisma SQLite Provider Documentation: https://www.prisma.io/docs/concepts/database-connectors/sqlite
