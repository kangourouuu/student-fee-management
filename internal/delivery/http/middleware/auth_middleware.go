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
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func GenerateToken(username string, secret string) (string, error) {
	claims := Claims{
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
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

func RequireAuth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie("session_token")
			if err != nil {
				authHeader := r.Header.Get("Authorization")
				if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
					tokenStr := authHeader[7:]
					claims, err := ValidateToken(tokenStr, jwtSecret)
					if err != nil {
						response.Error(w, http.StatusUnauthorized, "Unauthorized: invalid token")
						return
					}
					ctx := context.WithValue(r.Context(), UserContextKey, claims.Username)
					next.ServeHTTP(w, r.WithContext(ctx))
					return
				}
				response.Error(w, http.StatusUnauthorized, "Unauthorized: missing session cookie or token")
				return
			}

			claims, err := ValidateToken(cookie.Value, jwtSecret)
			if err != nil {
				response.Error(w, http.StatusUnauthorized, "Unauthorized: session expired or invalid")
				return
			}

			ctx := context.WithValue(r.Context(), UserContextKey, claims.Username)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
