# Student Fee Management System

## Scope and sources of truth

These instructions apply to the whole repository. A nested `AGENTS.md` takes precedence below its directory.

- Treat checked-in manifests and source as executable truth.
- Treat `DESIGN.md`, `PLAN.md`, and `README.md` as product intent and context.
- Do not claim a documented upgrade is complete until manifests and code implement it. Current manifests declare Go 1.22 and Angular 19 even though some project documents describe Go 1.24 and Angular 21.
- Keep work scoped to the user's request and preserve unrelated worktree changes.

## Architecture invariants

- Keep backend dependencies flowing from HTTP delivery to use cases to domain contracts and repository implementations.
- Keep all application database objects inside `student_fee_core`.
- Use `pgx/v5` for PostgreSQL, `chi/v5` for routing, and `excelize/v2` for XLSX.
- Preserve the API envelope: `{status:success|error,response:...}`.
- Authenticate with the JWT HttpOnly cookie. Do not move tokens into browser storage or expose secrets to Angular.
- Encrypt student phone data at rest and expose only the intended masked form.
- Preserve signal-based frontend state, zoneless configuration, and the neumorphic/claymorphic baby-blue design.

## Repository map

- `cmd/server`: server entrypoint, dependency injection, and routes.
- `internal/domain`: entities, DTOs, enums, and contracts.
- `internal/usecase`: business rules and orchestration.
- `internal/repository/postgres`: pgx persistence and bootstrap schema.
- `internal/delivery/http`: handlers, middleware, and response helpers.
- `internal/pkg`: shared implementation packages such as cryptography.
- `frontend`: Angular client.
- `migrations`: ordered PostgreSQL migrations.

## Commands

Run commands from the repository root unless noted.

- Backend tests: `go test ./...`
- Backend static checks: `go vet ./...`
- Backend formatting check: `gofmt -l cmd internal`
- Run backend: `go run ./cmd/server`
- Install frontend dependencies: `npm ci --prefix frontend`
- Build frontend: `npm run build --prefix frontend`
- Run frontend: `npm start --prefix frontend`

There is no frontend test or lint script. Do not report either as passing.

## Change workflow

1. Inspect the nearest `AGENTS.md`, affected contracts, and existing tests.
2. Make the smallest coherent change through all affected layers.
3. Add or update tests for changed behavior where a harness exists.
4. Run narrow relevant checks, then broader checks when risk warrants them.
5. Report commands actually run and validation that remains unavailable.

For independent cross-stack work, Codex may use project custom agents in `.codex/agents`. Do not delegate small or tightly coupled changes.

## Repository skills

Use the matching project skill for substantial work:

- `$change-student-fee-backend`
- `$change-student-fee-frontend`
- `$change-student-fee-database`

## Security and data rules

- Never commit `.env`, credentials, secret-bearing URLs, or generated student data.
- Do not weaken cookie flags, authentication, encryption, CORS, SQL parameterization, or transaction boundaries without an explicit requirement.
- Avoid logging credentials, JWTs, encryption keys, full phone numbers, or exported fee-statement contents.
- Treat attendance and billing dates as dates and avoid accidental timezone shifts.
