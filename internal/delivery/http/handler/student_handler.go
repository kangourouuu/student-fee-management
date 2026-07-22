package handler

import (
	"encoding/json"
	"net/http"

	"student-fee-management/internal/delivery/http/middleware"
	"student-fee-management/internal/delivery/http/response"
	"student-fee-management/internal/domain"
)

type StudentHandler struct {
	studentUsecase domain.StudentUsecase
}

func NewStudentHandler(studentUsecase domain.StudentUsecase) *StudentHandler {
	return &StudentHandler{studentUsecase: studentUsecase}
}

func (h *StudentHandler) GetStudents(w http.ResponseWriter, r *http.Request) {
	students, err := h.studentUsecase.GetStudents(r.Context())
	if err != nil {
		middleware.LogEvent(http.StatusInternalServerError, "student_handler", "Failed to fetch students: "+err.Error())
		response.Error(w, http.StatusInternalServerError, "Failed to retrieve student roster")
		return
	}

	middleware.LogEvent(http.StatusOK, "student_handler", "Fetched student roster successfully")
	response.Success(w, http.StatusOK, map[string]interface{}{
		"students": students,
		"count":    len(students),
	})
}

type CreateStudentRequest struct {
	StudentID string               `json:"student_id,omitempty"`
	Name      string               `json:"name"`
	Alias     string               `json:"alias"`
	Phone     string               `json:"phone"`
	Status    domain.StudentStatus `json:"status"`
}

func (h *StudentHandler) CreateStudent(w http.ResponseWriter, r *http.Request) {
	var req CreateStudentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.LogEvent(http.StatusBadRequest, "student_handler", "Invalid payload: "+err.Error())
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name == "" {
		middleware.LogEvent(http.StatusBadRequest, "student_handler", "Missing required field: name")
		response.Error(w, http.StatusBadRequest, "name is a required field")
		return
	}

	if req.Status == "" {
		req.Status = domain.StatusEnrolled
	}

	if !req.Status.IsValid() {
		middleware.LogEvent(http.StatusBadRequest, "student_handler", "Invalid status enum value provided: "+string(req.Status))
		response.Error(w, http.StatusBadRequest, "Invalid status enum value. Must be one of: enrolled, inactive, graduated, suspended")
		return
	}

	student, err := h.studentUsecase.CreateStudent(r.Context(), req.StudentID, req.Name, req.Alias, req.Phone, req.Status)
	if err != nil {
		middleware.LogEvent(http.StatusInternalServerError, "student_handler", "Failed to create student: "+err.Error())
		response.Error(w, http.StatusInternalServerError, "Failed to register student")
		return
	}

	middleware.LogEvent(http.StatusCreated, "student_handler", "Registered new student: "+student.StudentID)
	response.Success(w, http.StatusCreated, map[string]interface{}{
		"student": student,
	})
}
