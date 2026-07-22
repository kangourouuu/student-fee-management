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

func (u *studentUsecase) GetStudents(ctx context.Context) ([]domain.StudentDTO, error) {
	students, err := u.repo.GetStudents(ctx)
	if err != nil {
		return nil, err
	}

	dtos := make([]domain.StudentDTO, len(students))
	for i, st := range students {
		dtos[i] = st.ToDTO(true) // Mask phone PII in returned DTOs
	}
	return dtos, nil
}

func (u *studentUsecase) CreateStudent(ctx context.Context, studentID, name, phone string, status domain.StudentStatus) (*domain.StudentDTO, error) {
	st, err := u.repo.CreateStudent(ctx, studentID, name, phone, status)
	if err != nil {
		return nil, err
	}
	dto := st.ToDTO(true)
	return &dto, nil
}
