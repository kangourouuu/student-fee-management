---
name: change-student-fee-database
description: Design, implement, or review PostgreSQL schema and migration changes for the Student Fee Management repository, including student_fee_core tables, enums, views, constraints, data backfills, bootstrap SQL, pgx query compatibility, rerun safety, and deployment risk. Use for work in migrations or schema changes in internal/repository/postgres/db.go; do not use for query-only repository changes with no schema impact.
---

# Change the student fee database

## Prepare

1. Read the root and `migrations/AGENTS.md` files.
2. Compare ordered migrations with `postgres.SchemaSQL`.
3. Search repository queries and models that consume the affected object.
4. Read [references/schema.md](references/schema.md).

## Design

- Keep every application object in `student_fee_core`.
- Prefer additive and backward-compatible steps.
- Preserve existing data with an explicit, deterministic backfill.
- Evaluate locks, table rewrites, constraint validation, rerun behavior, and rollback limitations.
- Keep fresh-database bootstrap and deployed-database migration paths aligned.

## Verify

1. Review SQL statically for syntax, qualification, and ordering.
2. Run `go test ./...` when schema changes affect repository code.
3. Use only an explicitly authorized disposable database for execution tests.
4. Never apply migrations to a remote or production database implicitly.
