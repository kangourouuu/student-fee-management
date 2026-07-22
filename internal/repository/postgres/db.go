package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"student-fee-management/internal/delivery/http/middleware"
)

const SchemaSQL = `
CREATE SCHEMA IF NOT EXISTS student_fee_core;

DO $$ BEGIN
    CREATE TYPE student_fee_core.student_status AS ENUM ('enrolled', 'inactive', 'graduated', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS student_fee_core.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    status student_fee_core.student_status DEFAULT 'enrolled' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_fee_core.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_fee_core.students(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    is_present BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_date UNIQUE (student_id, record_date)
);

CREATE TABLE IF NOT EXISTS student_fee_core.fee_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES student_fee_core.students(id) ON DELETE CASCADE,
    billing_start_date DATE NOT NULL,
    billing_end_date DATE NOT NULL,
    fee_per_session NUMERIC(10, 2) NOT NULL CHECK (fee_per_session >= 0),
    total_days INT NOT NULL CHECK (total_days >= 0),
    total_fee NUMERIC(10, 2) NOT NULL CHECK (total_fee >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`

func InitDB(ctx context.Context, dbURL string) (*pgxpool.Pool, error) {
	poolConfig, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		middleware.LogEvent(500, "db_init", fmt.Sprintf("failed to parse connection pool config: %v", err))
		return nil, fmt.Errorf("failed to parse database url: %w", err)
	}

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		middleware.LogEvent(500, "db_init", fmt.Sprintf("failed to connect to database: %v", err))
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		middleware.LogEvent(500, "db_init", fmt.Sprintf("database ping failed: %v", err))
	} else {
		middleware.LogEvent(200, "db_init", "Successfully connected to PostgreSQL database")

		if _, err := pool.Exec(ctx, SchemaSQL); err != nil {
			middleware.LogEvent(500, "db_init", fmt.Sprintf("failed to execute schema migration: %v", err))
		} else {
			middleware.LogEvent(200, "db_init", "Schema student_fee_core initialized successfully")
		}
	}

	return pool, nil
}
