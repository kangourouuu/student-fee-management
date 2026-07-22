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

func (u *studentUsecase) CreateStudent(ctx context.Context, studentID, name, alias, phone string, feePerSession float64, status domain.StudentStatus) (*domain.StudentDTO, error) {
	st, err := u.repo.CreateStudent(ctx, studentID, name, alias, phone, feePerSession, status)
	if err != nil {
		return nil, err
	}
	dto := st.ToDTO(true)
	return &dto, nil
}

func (u *studentUsecase) UpdateStudent(ctx context.Context, id, name, alias, phone string, feePerSession float64, status domain.StudentStatus) (*domain.StudentDTO, error) {
	st, err := u.repo.UpdateStudent(ctx, id, name, alias, phone, feePerSession, status)
	if err != nil {
		return nil, err
	}
	dto := st.ToDTO(true)
	return &dto, nil
}
