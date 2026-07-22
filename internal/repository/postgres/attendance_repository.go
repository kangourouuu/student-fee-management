package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"student-fee-management/internal/domain"
)

type attendanceRepository struct {
	pool *pgxpool.Pool
}

func NewAttendanceRepository(pool *pgxpool.Pool) domain.AttendanceRepository {
	return &attendanceRepository{pool: pool}
}

func (r *attendanceRepository) GetAttendance(ctx context.Context, studentID string, month string) ([]domain.AttendanceRecord, error) {
	if r.pool == nil {
		return []domain.AttendanceRecord{}, nil
	}

	query := `SELECT id, student_id, TO_CHAR(record_date, 'YYYY-MM-DD'), is_present, created_at
	          FROM student_fee_core.attendance_records
	          WHERE student_id = $1`

	args := []interface{}{studentID}
	if month != "" {
		query += " AND TO_CHAR(record_date, 'YYYY-MM') = $2"
		args = append(args, month)
	}
	query += " ORDER BY record_date ASC"

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch attendance records: %w", err)
	}
	defer rows.Close()

	records := make([]domain.AttendanceRecord, 0)
	for rows.Next() {
		var rec domain.AttendanceRecord
		if err := rows.Scan(&rec.ID, &rec.StudentID, &rec.RecordDate, &rec.IsPresent, &rec.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan attendance record: %w", err)
		}
		records = append(records, rec)
	}

	return records, nil
}

func (r *attendanceRepository) ToggleAttendance(ctx context.Context, studentID string, recordDate string, isPresent bool) (*domain.AttendanceRecord, bool, error) {
	if r.pool == nil {
		return nil, false, fmt.Errorf("database connection pool is not initialized")
	}

	if isPresent {
		query := `INSERT INTO student_fee_core.attendance_records (student_id, record_date, is_present)
		          VALUES ($1, $2, TRUE)
		          ON CONFLICT (student_id, record_date) 
		          DO UPDATE SET is_present = TRUE
		          RETURNING id, student_id, TO_CHAR(record_date, 'YYYY-MM-DD'), is_present, created_at`

		var rec domain.AttendanceRecord
		err := r.pool.QueryRow(ctx, query, studentID, recordDate).
			Scan(&rec.ID, &rec.StudentID, &rec.RecordDate, &rec.IsPresent, &rec.CreatedAt)
		if err != nil {
			return nil, false, fmt.Errorf("failed to upsert attendance record: %w", err)
		}
		return &rec, true, nil
	} else {
		query := `DELETE FROM student_fee_core.attendance_records 
		          WHERE student_id = $1 AND record_date = $2`

		_, err := r.pool.Exec(ctx, query, studentID, recordDate)
		if err != nil {
			return nil, false, fmt.Errorf("failed to delete attendance record: %w", err)
		}
		return &domain.AttendanceRecord{
			StudentID:  studentID,
			RecordDate: recordDate,
			IsPresent:  false,
		}, false, nil
	}
}
