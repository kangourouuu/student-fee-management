package domain

import (
	"context"
	"time"
)

type Student struct {
	ID        string        `json:"id"`
	StudentID string        `json:"student_id"`
	Name      string        `json:"name"`
	Phone     string        `json:"phone,omitempty"`
	Status    StudentStatus `json:"status"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}

type AttendanceRecord struct {
	ID         string    `json:"id"`
	StudentID  string    `json:"student_id"`
	RecordDate string    `json:"record_date"` // YYYY-MM-DD
	IsPresent  bool      `json:"is_present"`
	CreatedAt  time.Time `json:"created_at"`
}

type FeeStatement struct {
	ID               string    `json:"id"`
	StudentID        string    `json:"student_id"`
	BillingStartDate string    `json:"billing_start_date"`
	BillingEndDate   string    `json:"billing_end_date"`
	FeePerSession    float64   `json:"fee_per_session"`
	TotalDays        int       `json:"total_days"`
	TotalFee         float64   `json:"total_fee"`
	CreatedAt        time.Time `json:"created_at"`
}

type ExportBillingRequest struct {
	StudentID        string  `json:"student_id"`
	BillingStartDate string  `json:"billing_start_date"`
	BillingEndDate   string  `json:"billing_end_date"`
	FeePerSession    float64 `json:"fee_per_session"`
}

// Clean Architecture Domain Interfaces
type StudentRepository interface {
	GetStudents(ctx context.Context) ([]Student, error)
	CreateStudent(ctx context.Context, studentID, name, phone string, status StudentStatus) (*Student, error)
}

type StudentUsecase interface {
	GetStudents(ctx context.Context) ([]Student, error)
	CreateStudent(ctx context.Context, studentID, name, phone string, status StudentStatus) (*Student, error)
}

type AttendanceRepository interface {
	GetAttendance(ctx context.Context, studentID string, month string) ([]AttendanceRecord, error)
	ToggleAttendance(ctx context.Context, studentID string, recordDate string, isPresent bool) (*AttendanceRecord, bool, error)
}

type AttendanceUsecase interface {
	GetAttendance(ctx context.Context, studentID string, month string) ([]AttendanceRecord, error)
	ToggleAttendance(ctx context.Context, studentID string, recordDate string, isPresent bool) (*AttendanceRecord, bool, error)
}

type BillingUsecase interface {
	ExportFeeStatement(ctx context.Context, req ExportBillingRequest) ([]byte, *FeeStatement, error)
}
