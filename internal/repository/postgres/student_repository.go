package postgres

import (
	"context"
	"crypto/rand"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"student-fee-management/internal/domain"
	"student-fee-management/internal/pkg/crypto"
)

type studentRepository struct {
	pool   *pgxpool.Pool
	encKey string
}

func NewStudentRepository(pool *pgxpool.Pool, encKey string) domain.StudentRepository {
	return &studentRepository{pool: pool, encKey: encKey}
}

func generateStudentID() string {
	b := make([]byte, 3)
	_, _ = rand.Read(b)
	num := (int(b[0])<<16 | int(b[1])<<8 | int(b[2])) % 90000 + 10000
	return fmt.Sprintf("STU-%05d", num)
}

func (r *studentRepository) GetStudents(ctx context.Context) ([]domain.Student, error) {
	if r.pool == nil {
		return []domain.Student{}, nil
	}

	query := `SELECT id, student_id, name, COALESCE(alias, ''), COALESCE(phone, ''), COALESCE(fee_per_session, 0.00), status, created_at, updated_at 
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
		var rawPhone string
		if err := rows.Scan(&st.ID, &st.StudentID, &st.Name, &st.Alias, &rawPhone, &st.FeePerSession, &statusStr, &st.CreatedAt, &st.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan student row: %w", err)
		}
		status, _ := domain.ParseStudentStatus(statusStr)
		st.Status = status
		decryptedPhone, _ := crypto.Decrypt(rawPhone, r.encKey)
		st.Phone = decryptedPhone
		students = append(students, st)
	}

	return students, nil
}

func (r *studentRepository) CreateStudent(ctx context.Context, studentID, name, alias, phone string, feePerSession float64, status domain.StudentStatus) (*domain.Student, error) {
	if !status.IsValid() {
		return nil, fmt.Errorf("invalid student status: %s", status)
	}

	if r.pool == nil {
		return nil, fmt.Errorf("database connection pool is not initialized")
	}

	if studentID == "" {
		studentID = generateStudentID()
	}

	encryptedPhone, err := crypto.Encrypt(phone, r.encKey)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt sensitive phone info: %w", err)
	}

	query := `INSERT INTO student_fee_core.students (student_id, name, alias, phone, fee_per_session, status) 
	          VALUES ($1, $2, $3, $4, $5, $6) 
	          RETURNING id, student_id, name, COALESCE(alias, ''), COALESCE(phone, ''), COALESCE(fee_per_session, 0.00), status, created_at, updated_at`

	var st domain.Student
	var statusStr string
	var rawPhone string
	err = r.pool.QueryRow(ctx, query, studentID, name, alias, encryptedPhone, feePerSession, string(status)).
		Scan(&st.ID, &st.StudentID, &st.Name, &st.Alias, &rawPhone, &st.FeePerSession, &statusStr, &st.CreatedAt, &st.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to insert student: %w", err)
	}

	st.Status = domain.StudentStatus(statusStr)
	st.Phone = phone
	return &st, nil
}

func (r *studentRepository) UpdateStudent(ctx context.Context, id, name, alias, phone string, feePerSession float64, status domain.StudentStatus) (*domain.Student, error) {
	if !status.IsValid() {
		return nil, fmt.Errorf("invalid student status: %s", status)
	}

	if r.pool == nil {
		return nil, fmt.Errorf("database connection pool is not initialized")
	}

	encryptedPhone, err := crypto.Encrypt(phone, r.encKey)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt sensitive phone info: %w", err)
	}

	query := `UPDATE student_fee_core.students 
	          SET name = $1, alias = $2, phone = $3, fee_per_session = $4, status = $5, updated_at = CURRENT_TIMESTAMP
	          WHERE id::text = $6 OR student_id = $6
	          RETURNING id, student_id, name, COALESCE(alias, ''), COALESCE(phone, ''), COALESCE(fee_per_session, 0.00), status, created_at, updated_at`

	var st domain.Student
	var statusStr string
	var rawPhone string
	err = r.pool.QueryRow(ctx, query, name, alias, encryptedPhone, feePerSession, string(status), id).
		Scan(&st.ID, &st.StudentID, &st.Name, &st.Alias, &rawPhone, &st.FeePerSession, &statusStr, &st.CreatedAt, &st.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to update student: %w", err)
	}

	st.Status = domain.StudentStatus(statusStr)
	st.Phone = phone
	return &st, nil
}
