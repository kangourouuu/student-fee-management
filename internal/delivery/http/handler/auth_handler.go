package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"student-fee-management/internal/config"
	"student-fee-management/internal/delivery/http/middleware"
	"student-fee-management/internal/delivery/http/response"
)

type AuthHandler struct {
	cfg *config.Config
}

func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{cfg: cfg}
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.LogEvent(http.StatusBadRequest, "auth_handler", "Invalid request body")
		response.Error(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.Username != h.cfg.AdminUsername || req.Password != h.cfg.AdminPassword {
		middleware.LogEvent(http.StatusUnauthorized, "auth_handler", "Invalid credentials attempt for user: "+req.Username)
		response.Error(w, http.StatusUnauthorized, "Invalid username or password")
		return
	}

	token, err := middleware.GenerateToken(req.Username, h.cfg.JWTSecret)
	if err != nil {
		middleware.LogEvent(http.StatusInternalServerError, "auth_handler", "Failed to generate token: "+err.Error())
		response.Error(w, http.StatusInternalServerError, "Failed to create session")
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	})

	middleware.LogEvent(http.StatusOK, "auth_handler", "User logged in successfully: "+req.Username)
	response.Success(w, http.StatusOK, map[string]interface{}{
		"message":  "Login successful",
		"username": req.Username,
		"token":    token,
	})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})

	middleware.LogEvent(http.StatusOK, "auth_handler", "User logged out successfully")
	response.Success(w, http.StatusOK, map[string]string{
		"message": "Logout successful",
	})
}
