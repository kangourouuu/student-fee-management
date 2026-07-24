# Database schema contract

All application objects are in `student_fee_core`.

## Core objects

- `students`: UUID primary key, external student ID, name, alias, encrypted phone storage, fee per session, status, timestamps
- `attendance_records`: one row per student and record date, cascade on student deletion
- `fee_statements`: immutable billing audit values for a date range
- `v_fee_statements`: statement data joined with current student display and fee information
- `student_status`: enrolled, inactive, graduated, suspended

## Dual schema paths

- `internal/repository/postgres/db.go` bootstraps a fresh database.
- `migrations/*.sql` upgrades an existing database.

Any final-schema change must account for both paths. Migration SQL should be safe to rerun where practical and should call out destructive or irreversible steps.
