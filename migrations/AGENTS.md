# PostgreSQL migration instructions

These instructions apply below `migrations/`.

- Keep migrations ordered with a zero-padded numeric prefix.
- Schema-qualify application objects with `student_fee_core`.
- Prefer additive, backward-compatible staged changes.
- Make reruns safe where practical with guarded DDL.
- Separate data backfills from destructive DDL when failure recovery matters.
- Keep fresh-database bootstrap SQL in `internal/repository/postgres/db.go` aligned with migrations for deployed databases.
- Preserve constraints, foreign keys, indexes, and enum compatibility.
- Document irreversible or locking operations and require explicit approval before applying them to a live database.
- Never run a migration against Neon or another remote database merely to validate SQL unless the user explicitly authorizes that target.
