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

	accessToken, refreshToken, err := middleware.GenerateTokenPair(req.Username, h.cfg.JWTSecret)
	if err != nil {
		middleware.LogEvent(http.StatusInternalServerError, "auth_handler", "Failed to generate tokens: "+err.Error())
		response.Error(w, http.StatusInternalServerError, "Failed to create session")
		return
	}

	isProd := h.cfg.AppEnv == "production"
	sameSite := http.SameSiteLaxMode
	secure := false

	if isProd {
		sameSite = http.SameSiteNoneMode
		secure = true
	}

	// 1. Session / Access Token Cookie (5 Minutes, HttpOnly)
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    accessToken,
		Path:     "/",
		Expires:  time.Now().Add(5 * time.Minute),
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		Expires:  time.Now().Add(5 * time.Minute),
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
	})

	// 2. Refresh Token Cookie (7 Days, HttpOnly - Never exposed to JS/Headers)
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/",
		Expires:  time.Now().Add(7 * 24 * time.Hour),
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
	})

	middleware.LogEvent(http.StatusOK, "auth_handler", "User logged in successfully: "+req.Username)
	response.Success(w, http.StatusOK, map[string]interface{}{
		"message":  "Login successful",
		"username": req.Username,
	})
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var refreshTokenStr string
	if cookie, err := r.Cookie("refresh_token"); err == nil {
		refreshTokenStr = cookie.Value
	}

	if refreshTokenStr == "" {
		middleware.LogEvent(http.StatusUnauthorized, "auth_handler", "Missing refresh token cookie")
		response.Error(w, http.StatusUnauthorized, "Missing refresh token")
		return
	}

	claims, err := middleware.ValidateToken(refreshTokenStr, h.cfg.JWTSecret)
	if err != nil || claims.TokenType != "refresh" {
		middleware.LogEvent(http.StatusUnauthorized, "auth_handler", "Invalid or expired refresh token")
		response.Error(w, http.StatusUnauthorized, "Invalid or expired refresh token")
		return
	}

	newAccess, newRefresh, err := middleware.GenerateTokenPair(claims.Username, h.cfg.JWTSecret)
	if err != nil {
		middleware.LogEvent(http.StatusInternalServerError, "auth_handler", "Failed to refresh token pair: "+err.Error())
		response.Error(w, http.StatusInternalServerError, "Failed to refresh tokens")
		return
	}

	isProd := h.cfg.AppEnv == "production"
	sameSite := http.SameSiteLaxMode
	secure := false

	if isProd {
		sameSite = http.SameSiteNoneMode
		secure = true
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    newAccess,
		Path:     "/",
		Expires:  time.Now().Add(5 * time.Minute),
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    newAccess,
		Path:     "/",
		Expires:  time.Now().Add(5 * time.Minute),
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    newRefresh,
		Path:     "/",
		Expires:  time.Now().Add(7 * 24 * time.Hour),
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
	})

	middleware.LogEvent(http.StatusOK, "auth_handler", "Refreshed token pair for user: "+claims.Username)
	response.Success(w, http.StatusOK, map[string]interface{}{
		"message":  "Token refreshed successfully",
		"username": claims.Username,
	})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	isProd := h.cfg.AppEnv == "production"
	sameSite := http.SameSiteLaxMode
	secure := false

	if isProd {
		sameSite = http.SameSiteNoneMode
		secure = true
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
	})

	middleware.LogEvent(http.StatusOK, "auth_handler", "User logged out successfully")
	response.Success(w, http.StatusOK, map[string]string{
		"message": "Logout successful",
	})
}
