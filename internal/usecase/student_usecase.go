package usecase

import (
	"context"
	"student-fee-management/internal/domain"
)

type studentUsecase struct {
	repo domain.StudentRepository
}

func NewStudentUsecase(repo domain.StudentRepository) domain.StudentUsecase {
	return &studentUsecase{repo: repo}
}

func (u *studentUsecase) GetStudents(ctx context.Context) ([]domain.Student, error) {
	return u.repo.GetStudents(ctx)
}

func (u *studentUsecase) CreateStudent(ctx context.Context, studentID, name, phone string, status domain.StudentStatus) (*domain.Student, error) {
	return u.repo.CreateStudent(ctx, studentID, name, phone, status)
}
