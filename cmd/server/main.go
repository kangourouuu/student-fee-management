package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"

	"student-fee-management/internal/config"
	"student-fee-management/internal/delivery/http/handler"
	"student-fee-management/internal/delivery/http/middleware"
	"student-fee-management/internal/delivery/http/response"
	"student-fee-management/internal/repository/postgres"
	"student-fee-management/internal/usecase"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("failed to load configuration: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := postgres.InitDB(ctx, cfg.DatabaseURL)
	if err != nil {
		middleware.LogEvent(500, "main", fmt.Sprintf("database init notice: %v", err))
	}
	if pool != nil {
		defer pool.Close()
	}

	// Clean Architecture Dependency Injection
	// 1. Repositories
	studentRepo := postgres.NewStudentRepository(pool, cfg.EncryptionKey)
	attendanceRepo := postgres.NewAttendanceRepository(pool)

	// 2. Usecases
	studentUsecase := usecase.NewStudentUsecase(studentRepo)
	attendanceUsecase := usecase.NewAttendanceUsecase(attendanceRepo)
	billingUsecase := usecase.NewBillingUsecase(pool)

	// 3. HTTP Delivery Handlers
	authHandler := handler.NewAuthHandler(cfg)
	studentHandler := handler.NewStudentHandler(studentUsecase)
	attendanceHandler := handler.NewAttendanceHandler(attendanceUsecase)
	billingHandler := handler.NewBillingHandler(billingUsecase)

	r := chi.NewRouter()

	r.Use(middleware.CORSMiddleware())
	r.Use(chiMiddleware.Recoverer)
	r.Use(middleware.SeniorLogger("api_router"))

	// Health Check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		response.Success(w, http.StatusOK, map[string]string{
			"service": "student-fee-management",
			"status":  "healthy",
		})
	})

	// Public Auth Endpoints
	r.Post("/api/auth/login", authHandler.Login)
	r.Post("/api/auth/logout", authHandler.Logout)

	// Protected Endpoints
	r.Group(func(protected chi.Router) {
		protected.Use(middleware.RequireAuth(cfg.JWTSecret))

		protected.Get("/api/students", studentHandler.GetStudents)
		protected.Post("/api/students", studentHandler.CreateStudent)
		protected.Put("/api/students", studentHandler.UpdateStudent)
		protected.Put("/api/students/{id}", studentHandler.UpdateStudent)

		protected.Get("/api/attendance", attendanceHandler.GetAttendance)
		protected.Post("/api/attendance", attendanceHandler.ToggleAttendance)

		protected.Post("/api/billing/export", billingHandler.ExportFeeStatement)
	})

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	middleware.LogEvent(200, "main", fmt.Sprintf("Server starting on port %s", cfg.Port))

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			middleware.LogEvent(500, "main", fmt.Sprintf("Server error: %v", err))
		}
	}()

	<-stop
	middleware.LogEvent(200, "main", "Shutting down server gracefully...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		middleware.LogEvent(500, "main", fmt.Sprintf("Server forced to shutdown: %v", err))
	}

	middleware.LogEvent(200, "main", "Server exited cleanly")
}
