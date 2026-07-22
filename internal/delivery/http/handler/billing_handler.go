package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"student-fee-management/internal/delivery/http/middleware"
	"student-fee-management/internal/delivery/http/response"
	"student-fee-management/internal/domain"
)

type BillingHandler struct {
	billingUsecase domain.BillingUsecase
}

func NewBillingHandler(billingUsecase domain.BillingUsecase) *BillingHandler {
	return &BillingHandler{billingUsecase: billingUsecase}
}

func (h *BillingHandler) ExportFeeStatement(w http.ResponseWriter, r *http.Request) {
	var req domain.ExportBillingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.LogEvent(http.StatusBadRequest, "billing_handler", "Invalid payload: "+err.Error())
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.StudentID == "" || req.BillingStartDate == "" || req.BillingEndDate == "" {
		middleware.LogEvent(http.StatusBadRequest, "billing_handler", "Missing required fields for billing export")
		response.Error(w, http.StatusBadRequest, "student_id, billing_start_date, and billing_end_date are required")
		return
	}

	if req.FeePerSession < 0 {
		middleware.LogEvent(http.StatusBadRequest, "billing_handler", "Invalid negative fee per session")
		response.Error(w, http.StatusBadRequest, "fee_per_session must be non-negative")
		return
	}

	excelBytes, stmt, err := h.billingUsecase.ExportFeeStatement(r.Context(), req)
	if err != nil {
		middleware.LogEvent(http.StatusInternalServerError, "billing_handler", "Billing export failed: "+err.Error())
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	fileName := fmt.Sprintf("Fee_Statement_%s_%s.xlsx", req.StudentID, req.BillingStartDate)
	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", fileName))
	w.Header().Set("X-Statement-ID", stmt.ID)
	w.Header().Set("X-Total-Fee", fmt.Sprintf("%.2f", stmt.TotalFee))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(excelBytes)
}
