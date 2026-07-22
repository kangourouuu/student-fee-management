package middleware

import (
	"net/http"
	"os"
	"strings"
)

func CORSMiddleware() func(http.Handler) http.Handler {
	allowedOrigins := map[string]bool{
		"https://student-fee-management-pied.vercel.app": true,
		"http://localhost:4200":                           true,
		"http://localhost:8080":                           true,
		"http://127.0.0.1:4200":                           true,
	}

	for _, envKey := range []string{"ALLOWED_ORIGIN", "ALLOWED_ORIGINS"} {
		val := os.Getenv(envKey)
		if val != "" {
			for _, o := range strings.Split(val, ",") {
				trimmed := strings.TrimSpace(o)
				if trimmed != "" {
					allowedOrigins[trimmed] = true
				}
			}
		}
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" && (allowedOrigins[origin] || strings.HasSuffix(origin, ".vercel.app")) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie, X-Requested-With")
			}

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
