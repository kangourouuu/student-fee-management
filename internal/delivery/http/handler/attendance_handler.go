package handler

import (
	"encoding/json"
	"net/http"

	"student-fee-management/internal/delivery/http/middleware"
	"student-fee-management/internal/delivery/http/response"
	"student-fee-management/internal/domain"
)

type AttendanceHandler struct {
	attendanceUsecase domain.AttendanceUsecase
}

func NewAttendanceHandler(attendanceUsecase domain.AttendanceUsecase) *AttendanceHandler {
	return &AttendanceHandler{attendanceUsecase: attendanceUsecase}
}

func (h *AttendanceHandler) GetAttendance(w http.ResponseWriter, r *http.Request) {
	studentID := r.URL.Query().Get("student_id")
	month := r.URL.Query().Get("month")

	if studentID == "" {
		middleware.LogEvent(http.StatusBadRequest, "attendance_handler", "Missing required query param: student_id")
		response.Error(w, http.StatusBadRequest, "student_id query parameter is required")
		return
	}

	records, err := h.attendanceUsecase.GetAttendance(r.Context(), studentID, month)
	if err != nil {
		middleware.LogEvent(http.StatusInternalServerError, "attendance_handler", "Failed to fetch attendance: "+err.Error())
		response.Error(w, http.StatusInternalServerError, "Failed to retrieve attendance records")
		return
	}

	middleware.LogEvent(http.StatusOK, "attendance_handler", "Fetched attendance for student: "+studentID)
	response.Success(w, http.StatusOK, map[string]interface{}{
		"student_id": studentID,
		"records":    records,
		"count":      len(records),
	})
}

type ToggleAttendanceRequest struct {
	StudentID  string `json:"student_id"`
	RecordDate string `json:"record_date"`
	IsPresent  bool   `json:"is_present"`
}

func (h *AttendanceHandler) ToggleAttendance(w http.ResponseWriter, r *http.Request) {
	var req ToggleAttendanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.LogEvent(http.StatusBadRequest, "attendance_handler", "Invalid payload: "+err.Error())
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.StudentID == "" || req.RecordDate == "" {
		middleware.LogEvent(http.StatusBadRequest, "attendance_handler", "Missing required fields student_id or record_date")
		response.Error(w, http.StatusBadRequest, "student_id and record_date are required fields")
		return
	}

	rec, active, err := h.attendanceUsecase.ToggleAttendance(r.Context(), req.StudentID, req.RecordDate, req.IsPresent)
	if err != nil {
		middleware.LogEvent(http.StatusInternalServerError, "attendance_handler", "Failed to toggle attendance: "+err.Error())
		response.Error(w, http.StatusInternalServerError, "Failed to update attendance record")
		return
	}

	middleware.LogEvent(http.StatusOK, "attendance_handler", "Toggled attendance record for student: "+req.StudentID)
	response.Success(w, http.StatusOK, map[string]interface{}{
		"record": rec,
		"active": active,
	})
}
