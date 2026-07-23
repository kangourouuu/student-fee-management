package middleware

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"student-fee-management/internal/delivery/http/response"
)

type contextKey string

const UserContextKey contextKey = "user"

type Claims struct {
	Username  string `json:"username"`
	TokenType string `json:"token_type"` // "access" or "refresh"
	jwt.RegisteredClaims
}

// GenerateTokenPair issues a 5-minute Access Token and a 7-day Refresh Token reusing the same JWTSecret
func GenerateTokenPair(username string, secret string) (accessToken string, refreshToken string, err error) {
	now := time.Now()

	// Access Token: 5 Minutes lifetime
	accessClaims := Claims{
		Username:  username,
		TokenType: "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(5 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(now),
		},
	}
	accTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessToken, err = accTokenObj.SignedString([]byte(secret))
	if err != nil {
		return "", "", err
	}

	// Refresh Token: 7 Days lifetime
	refreshClaims := Claims{
		Username:  username,
		TokenType: "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(now),
		},
	}
	refTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshToken, err = refTokenObj.SignedString([]byte(secret))
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func ValidateToken(tokenString string, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, errors.New("invalid token")
}

func RequireAuth(jwtSecret string, appEnv string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var accessTokenStr string

			// 1. Try to read Access Token from Authorization Header: Bearer <token>
			authHeader := r.Header.Get("Authorization")
			if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
				accessTokenStr = authHeader[7:]
			}

			// 2. Fallback to access_token cookie
			if accessTokenStr == "" {
				if cookie, err := r.Cookie("access_token"); err == nil {
					accessTokenStr = cookie.Value
				}
			}

			// 3. Fallback to session_token cookie (legacy compatibility)
			if accessTokenStr == "" {
				if cookie, err := r.Cookie("session_token"); err == nil {
					accessTokenStr = cookie.Value
				}
			}

			// Validate Access Token
			if accessTokenStr != "" {
				claims, err := ValidateToken(accessTokenStr, jwtSecret)
				if err == nil && (claims.TokenType == "access" || claims.TokenType == "") {
					ctx := context.WithValue(r.Context(), UserContextKey, claims.Username)
					next.ServeHTTP(w, r.WithContext(ctx))
					return
				}
			}

			// 4. Access Token is expired or missing -> Attempt Silent Auto-Refresh using Refresh Token
			var refreshTokenStr string
			if refCookie, err := r.Cookie("refresh_token"); err == nil {
				refreshTokenStr = refCookie.Value
			}
			if refreshTokenStr == "" {
				refreshTokenStr = r.Header.Get("X-Refresh-Token")
			}

			if refreshTokenStr != "" {
				refClaims, err := ValidateToken(refreshTokenStr, jwtSecret)
				if err == nil && refClaims.TokenType == "refresh" {
					// Issue a fresh Token Pair without kicking the user out!
					newAccess, newRefresh, err := GenerateTokenPair(refClaims.Username, jwtSecret)
					if err == nil {
						isProd := appEnv == "production"
						sameSite := http.SameSiteLaxMode
						secure := false
						if isProd {
							sameSite = http.SameSiteNoneMode
							secure = true
						}

						// Update cookies on Response
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

						// Pass new Access Token in response header for client interceptors
						w.Header().Set("X-Access-Token", newAccess)

						ctx := context.WithValue(r.Context(), UserContextKey, refClaims.Username)
						next.ServeHTTP(w, r.WithContext(ctx))
						return
					}
				}
			}

			// 5. Both Access Token and Refresh Token expired/invalid -> 401 Unauthorized
			response.Error(w, http.StatusUnauthorized, "Unauthorized: session expired or invalid")
		})
	}
}
