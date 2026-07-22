package domain

import (
	"context"
	"time"

	"student-fee-management/internal/pkg/crypto"
)

type Student struct {
	ID        string        `json:"id"`
	StudentID string        `json:"student_id"`
	Name      string        `json:"name"`
	Alias     string        `json:"alias,omitempty"`
	Phone     string        `json:"phone,omitempty"`
	Status    StudentStatus `json:"status"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}

// StudentDTO protects sensitive PII by returning sanitized data payloads.
type StudentDTO struct {
	ID        string        `json:"id"`
	StudentID string        `json:"student_id"`
	Name      string        `json:"name"`
	Alias     string        `json:"alias,omitempty"`
	Phone     string        `json:"phone,omitempty"`
	Status    StudentStatus `json:"status"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}

func (s *Student) ToDTO(maskPhone bool) StudentDTO {
	phoneVal := s.Phone
	if maskPhone && phoneVal != "" {
		phoneVal = crypto.MaskPhone(phoneVal)
	}
	return StudentDTO{
		ID:        s.ID,
		StudentID: s.StudentID,
		Name:      s.Name,
		Alias:     s.Alias,
		Phone:     phoneVal,
		Status:    s.Status,
		CreatedAt: s.CreatedAt,
		UpdatedAt: s.UpdatedAt,
	}
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
	CreateStudent(ctx context.Context, studentID, name, alias, phone string, status StudentStatus) (*Student, error)
}

type StudentUsecase interface {
	GetStudents(ctx context.Context) ([]StudentDTO, error)
	CreateStudent(ctx context.Context, studentID, name, alias, phone string, status StudentStatus) (*StudentDTO, error)
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
