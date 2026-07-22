package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"student-fee-management/internal/domain"
)

type studentRepository struct {
	pool *pgxpool.Pool
}

func NewStudentRepository(pool *pgxpool.Pool) domain.StudentRepository {
	return &studentRepository{pool: pool}
}

func (r *studentRepository) GetStudents(ctx context.Context) ([]domain.Student, error) {
	if r.pool == nil {
		return []domain.Student{}, nil
	}

	query := `SELECT id, student_id, name, COALESCE(phone, ''), status, created_at, updated_at 
	          FROM student_fee_core.students ORDER BY created_at DESC`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch students: %w", err)
	}
	defer rows.Close()

	students := make([]domain.Student, 0)
	for rows.Next() {
		var st domain.Student
		var statusStr string
		if err := rows.Scan(&st.ID, &st.StudentID, &st.Name, &st.Phone, &statusStr, &st.CreatedAt, &st.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan student row: %w", err)
		}
		status, _ := domain.ParseStudentStatus(statusStr)
		st.Status = status
		students = append(students, st)
	}

	return students, nil
}

func (r *studentRepository) CreateStudent(ctx context.Context, studentID, name, phone string, status domain.StudentStatus) (*domain.Student, error) {
	if !status.IsValid() {
		return nil, fmt.Errorf("invalid student status: %s", status)
	}

	if r.pool == nil {
		return &domain.Student{
			ID:        "mock-uuid",
			StudentID: studentID,
			Name:      name,
			Phone:     phone,
			Status:    status,
		}, nil
	}

	query := `INSERT INTO student_fee_core.students (student_id, name, phone, status) 
	          VALUES ($1, $2, $3, $4) 
	          RETURNING id, student_id, name, COALESCE(phone, ''), status, created_at, updated_at`

	var st domain.Student
	var statusStr string
	err := r.pool.QueryRow(ctx, query, studentID, name, phone, string(status)).
		Scan(&st.ID, &st.StudentID, &st.Name, &st.Phone, &statusStr, &st.CreatedAt, &st.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to insert student: %w", err)
	}

	st.Status = domain.StudentStatus(statusStr)
	return &st, nil
}
