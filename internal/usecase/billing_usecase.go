package usecase

import (
	"bytes"
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xuri/excelize/v2"

	"student-fee-management/internal/delivery/http/middleware"
	"student-fee-management/internal/domain"
)

type billingUsecase struct {
	pool *pgxpool.Pool
}

func NewBillingUsecase(pool *pgxpool.Pool) domain.BillingUsecase {
	return &billingUsecase{pool: pool}
}

func (b *billingUsecase) ExportFeeStatement(ctx context.Context, req domain.ExportBillingRequest) ([]byte, *domain.FeeStatement, error) {
	if b.pool == nil {
		return nil, nil, fmt.Errorf("database connection pool is not initialized")
	}

	tx, err := b.pool.Begin(ctx)
	if err != nil {
		middleware.LogEvent(500, "billing_usecase", "Failed to start ACID transaction: "+err.Error())
		return nil, nil, fmt.Errorf("failed to start database transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	var studentName string
	var internalUUID string
	err = tx.QueryRow(ctx, `SELECT id, name FROM student_fee_core.students WHERE student_id = $1 OR id::text = $1`, req.StudentID).
		Scan(&internalUUID, &studentName)
	if err != nil {
		middleware.LogEvent(404, "billing_usecase", "Student not found for ID: "+req.StudentID)
		return nil, nil, fmt.Errorf("student record not found for ID: %s", req.StudentID)
	}

	var totalDays int
	countQuery := `SELECT COUNT(*) FROM student_fee_core.attendance_records
	               WHERE student_id = $1 AND record_date >= $2::date AND record_date <= $3::date AND is_present = TRUE`
	err = tx.QueryRow(ctx, countQuery, internalUUID, req.BillingStartDate, req.BillingEndDate).Scan(&totalDays)
	if err != nil {
		middleware.LogEvent(500, "billing_usecase", "Failed to query attendance count: "+err.Error())
		return nil, nil, fmt.Errorf("failed to compute attendance days: %w", err)
	}

	totalFee := float64(totalDays) * req.FeePerSession

	var statementID string
	insertStmt := `INSERT INTO student_fee_core.fee_statements (student_id, billing_start_date, billing_end_date, fee_per_session, total_days, total_fee)
	               VALUES ($1, $2::date, $3::date, $4, $5, $6)
	               RETURNING id`
	err = tx.QueryRow(ctx, insertStmt, internalUUID, req.BillingStartDate, req.BillingEndDate, req.FeePerSession, totalDays, totalFee).Scan(&statementID)
	if err != nil {
		middleware.LogEvent(500, "billing_usecase", "Failed to insert audit statement: "+err.Error())
		return nil, nil, fmt.Errorf("failed to record fee statement audit: %w", err)
	}

	excelBytes, err := generateExcelSheet(studentName, req.StudentID, req.BillingStartDate, req.BillingEndDate, totalDays, req.FeePerSession, totalFee)
	if err != nil {
		middleware.LogEvent(500, "billing_usecase", "Excelize compilation failed: "+err.Error())
		return nil, nil, fmt.Errorf("failed to compile excel document: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		middleware.LogEvent(500, "billing_usecase", "ACID transaction commit failed: "+err.Error())
		return nil, nil, fmt.Errorf("failed to commit billing transaction: %w", err)
	}

	middleware.LogEvent(200, "billing_usecase", fmt.Sprintf("Successfully committed fee export transaction for student %s (Total: %.2f)", req.StudentID, totalFee))

	statement := &domain.FeeStatement{
		ID:               statementID,
		StudentID:        req.StudentID,
		BillingStartDate: req.BillingStartDate,
		BillingEndDate:   req.BillingEndDate,
		FeePerSession:    req.FeePerSession,
		TotalDays:        totalDays,
		TotalFee:         totalFee,
	}

	return excelBytes, statement, nil
}

func generateExcelSheet(studentName, studentID, startDate, endDate string, totalDays int, feePerSession, totalFee float64) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	sheet := "Fee Statement"
	f.SetSheetName("Sheet1", sheet)

	_ = f.SetCellValue(sheet, "A1", "STUDENT FEE STATEMENT")
	_ = f.SetCellValue(sheet, "A3", "Student Name:")
	_ = f.SetCellValue(sheet, "B3", studentName)
	_ = f.SetCellValue(sheet, "A4", "Student ID:")
	_ = f.SetCellValue(sheet, "B4", studentID)
	_ = f.SetCellValue(sheet, "A5", "Billing Period:")
	_ = f.SetCellValue(sheet, "B5", fmt.Sprintf("%s to %s", startDate, endDate))

	_ = f.SetCellValue(sheet, "A7", "Item Description")
	_ = f.SetCellValue(sheet, "B7", "Value")

	_ = f.SetCellValue(sheet, "A8", "Total Attended Days")
	_ = f.SetCellValue(sheet, "B8", totalDays)
	_ = f.SetCellValue(sheet, "A9", "Fee Per Session")
	_ = f.SetCellValue(sheet, "B9", feePerSession)
	_ = f.SetCellValue(sheet, "A10", "Total Calculated Fee")
	_ = f.SetCellValue(sheet, "B10", totalFee)

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
