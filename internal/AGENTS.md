# Go backend instructions

These instructions apply below `internal/`.

## Layering and implementation

- Put transport parsing, status codes, and serialization in delivery.
- Put business policy and orchestration in use cases.
- Keep domain models and interfaces independent of HTTP and PostgreSQL details.
- Put SQL and pgx mapping in `repository/postgres`; wire concrete dependencies in `cmd/server`.
- Pass `context.Context` through I/O boundaries.
- Wrap errors with operation context while avoiding secrets and PII.
- Use parameterized SQL and schema-qualify application objects with `student_fee_core`.
- Preserve fee-statement transaction atomicity, response helpers, intentional status codes, and the phone-data security boundary.
- Prefer constructor injection and small interfaces over package globals.

## Verification

- Format changed Go files with `gofmt`.
- Run focused package tests while iterating.
- Run `go test ./...` for behavior changes and `go vet ./...` when production code changed.
- Add table-driven tests for business rules and handler edge cases when useful.
