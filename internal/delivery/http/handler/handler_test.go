package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"

	"student-fee-management/internal/config"
	"student-fee-management/internal/delivery/http/handler"
	"student-fee-management/internal/delivery/http/middleware"
)

func TestAuthHandler(t *testing.T) {
	cfg := &config.Config{
		Port:          "8080",
		AdminUsername: "admin",
		AdminPassword: "admin123",
		JWTSecret:     "test-secret",
	}

	authHandler := handler.NewAuthHandler(cfg)

	r := chi.NewRouter()
	r.Post("/api/auth/login", authHandler.Login)
	r.Post("/api/auth/logout", authHandler.Logout)

	invalidBody, _ := json.Marshal(map[string]string{
		"username": "admin",
		"password": "wrongpassword",
	})
	req, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(invalidBody))
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 Unauthorized, got %d", rr.Code)
	}

	validBody, _ := json.Marshal(map[string]string{
		"username": "admin",
		"password": "admin123",
	})
	req2, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(validBody))
	rr2 := httptest.NewRecorder()
	r.ServeHTTP(rr2, req2)

	if rr2.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got %d", rr2.Code)
	}

	cookies := rr2.Result().Cookies()
	if len(cookies) == 0 || cookies[0].Name != "session_token" {
		t.Errorf("expected session_token cookie to be set")
	}

	tokenStr := cookies[0].Value
	claims, err := middleware.ValidateToken(tokenStr, cfg.JWTSecret)
	if err != nil || claims.Username != "admin" {
		t.Errorf("failed to validate JWT token: %v", err)
	}
}
