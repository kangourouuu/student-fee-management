# Backend contracts

## Layer map

- `cmd/server`: composition and routes
- `internal/delivery/http`: HTTP parsing, middleware, status codes, serialization
- `internal/usecase`: business policy and orchestration
- `internal/domain`: models and interfaces
- `internal/repository/postgres`: SQL and pgx mapping
- `internal/pkg/crypto`: AES-GCM and masking support

## Stable behavior

- API envelope: `status` plus `response`
- Protected requests use a JWT HttpOnly cookie.
- Student phone data is encrypted at rest and intentionally masked in output.
- Application SQL objects live in `student_fee_core`.
- Billing writes an audit statement and streams an Excel workbook.

## Validation commands

```text
gofmt -l cmd internal
go test ./...
go vet ./...
go run ./cmd/server
```

Starting the server requires valid environment configuration and PostgreSQL. Do not treat an unavailable external database as a unit-test failure.
