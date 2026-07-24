---
name: change-student-fee-backend
description: Implement, review, debug, or test Go backend changes in the Student Fee Management repository, including chi handlers, use cases, domain contracts, pgx repositories, JWT cookie authentication, PII encryption, billing transactions, and Excel exports. Use for substantial work under cmd/server or internal; do not use for frontend-only or SQL-migration-only tasks.
---

# Change the student fee backend

## Prepare

1. Read the applicable `AGENTS.md`.
2. Trace the request through route, handler, use case, domain contract, and repository as applicable.
3. Read [references/contracts.md](references/contracts.md) when changing API, security, persistence, billing, or exported data.

## Implement

- Keep HTTP details in delivery and business rules in use cases.
- Keep domain contracts independent of chi and pgx.
- Parameterize SQL and qualify objects with `student_fee_core`.
- Preserve the common response envelope and cookie-based authentication.
- Preserve encryption-at-rest and masked DTO behavior for phone data.
- Keep fee-statement persistence and workbook generation atomic.
- Wire new concrete dependencies in `cmd/server/main.go`.

## Verify

1. Format changed Go files with `gofmt`.
2. Run focused package tests during implementation.
3. Run `go test ./...`.
4. Run `go vet ./...` for production-code changes.
5. State exactly which checks ran and which did not.
