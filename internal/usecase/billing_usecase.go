package usecase

import (
	"bytes"
	"context"
	"fmt"
	"strings"
	"time"

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
	var studentAlias string
	var internalUUID string
	err = tx.QueryRow(ctx, `SELECT id, name, COALESCE(alias, '') FROM student_fee_core.students WHERE student_id = $1 OR id::text = $1`, req.StudentID).
		Scan(&internalUUID, &studentName, &studentAlias)
	if err != nil {
		middleware.LogEvent(404, "billing_usecase", "Student not found for ID: "+req.StudentID)
		return nil, nil, fmt.Errorf("student record not found for ID: %s", req.StudentID)
	}

	nickname := studentAlias
	if nickname == "" {
		nickname = req.StudentID
	}

	// Query list of attended dates
	datesQuery := `SELECT record_date FROM student_fee_core.attendance_records
	               WHERE student_id = $1 AND record_date >= $2::date AND record_date <= $3::date AND is_present = TRUE
	               ORDER BY record_date ASC`
	rows, err := tx.Query(ctx, datesQuery, internalUUID, req.BillingStartDate, req.BillingEndDate)
	if err != nil {
		middleware.LogEvent(500, "billing_usecase", "Failed to query attendance dates: "+err.Error())
		return nil, nil, fmt.Errorf("failed to query attendance dates: %w", err)
	}
	defer rows.Close()

	var dateStrs []string
	for rows.Next() {
		var d time.Time
		if err := rows.Scan(&d); err == nil {
			dateStrs = append(dateStrs, fmt.Sprintf("%02d", d.Day()))
		}
	}
	totalDays := len(dateStrs)
	attendedDatesFormatted := strings.Join(dateStrs, ", ")
	if attendedDatesFormatted == "" {
		attendedDatesFormatted = "Không có buổi học nào"
	}

	totalFee := float64(totalDays) * req.FeePerSession

	var statementID string
	insertStmt := `INSERT INTO student_fee_core.fee_statements (student_id, billing_start_date, billing_end_date, total_days, total_fee)
	               VALUES ($1, $2::date, $3::date, $4, $5)
	               RETURNING id`
	err = tx.QueryRow(ctx, insertStmt, internalUUID, req.BillingStartDate, req.BillingEndDate, totalDays, totalFee).Scan(&statementID)
	if err != nil {
		middleware.LogEvent(500, "billing_usecase", "Failed to insert audit statement: "+err.Error())
		return nil, nil, fmt.Errorf("failed to record fee statement audit: %w", err)
	}

	excelBytes, err := generateExcelSheet(studentName, nickname, req.BillingStartDate, req.BillingEndDate, attendedDatesFormatted, totalDays, totalFee)
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

func generateExcelSheet(studentName, nickname, startDate, endDate, attendedDates string, totalDays int, totalFee float64) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	sheet := "Báo Cáo Học Phí"
	f.SetSheetName("Sheet1", sheet)

	_ = f.SetCellValue(sheet, "A1", "BÁO CÁO HỌC PHÍ HỌC SINH")
	_ = f.SetCellValue(sheet, "A3", "Họ và tên:")
	_ = f.SetCellValue(sheet, "B3", studentName)
	_ = f.SetCellValue(sheet, "A4", "Biệt danh:")
	_ = f.SetCellValue(sheet, "B4", nickname)
	_ = f.SetCellValue(sheet, "A5", "Kỳ thanh toán:")
	_ = f.SetCellValue(sheet, "B5", fmt.Sprintf("%s đến %s", startDate, endDate))

	_ = f.SetCellValue(sheet, "A7", "Mục thanh toán")
	_ = f.SetCellValue(sheet, "B7", "Chi tiết")

	_ = f.SetCellValue(sheet, "A8", "Các ngày đi học")
	_ = f.SetCellValue(sheet, "B8", attendedDates)
	_ = f.SetCellValue(sheet, "A9", "Tổng số buổi học")
	_ = f.SetCellValue(sheet, "B9", fmt.Sprintf("%d buổi", totalDays))
	_ = f.SetCellValue(sheet, "A10", "Tổng học phí thanh toán")
	_ = f.SetCellValue(sheet, "B10", totalFee)

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
