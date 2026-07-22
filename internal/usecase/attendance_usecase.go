package usecase

import (
	"context"
	"student-fee-management/internal/domain"
)

type attendanceUsecase struct {
	repo domain.AttendanceRepository
}

func NewAttendanceUsecase(repo domain.AttendanceRepository) domain.AttendanceUsecase {
	return &attendanceUsecase{repo: repo}
}

func (u *attendanceUsecase) GetAttendance(ctx context.Context, studentID string, month string) ([]domain.AttendanceRecord, error) {
	return u.repo.GetAttendance(ctx, studentID, month)
}

func (u *attendanceUsecase) ToggleAttendance(ctx context.Context, studentID string, recordDate string, isPresent bool) (*domain.AttendanceRecord, bool, error) {
	return u.repo.ToggleAttendance(ctx, studentID, recordDate, isPresent)
}
