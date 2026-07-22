package middleware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

type SeniorLogEntry struct {
	Timestamp         string `json:"timestamp"`
	Status            int    `json:"status"`
	RelevantComponent string `json:"relevant_component"`
	ActualDebugLog    string `json:"actual_debug_log"`
}

type responseWriterInterceptor struct {
	http.ResponseWriter
	statusCode int
}

func (r *responseWriterInterceptor) WriteHeader(code int) {
	r.statusCode = code
	r.ResponseWriter.WriteHeader(code)
}

func SeniorLogger(component string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			interceptor := &responseWriterInterceptor{
				ResponseWriter: w,
				statusCode:     http.StatusOK,
			}

			next.ServeHTTP(interceptor, r)

			duration := time.Since(start)
			logEntry := SeniorLogEntry{
				Timestamp:         start.Format(time.RFC3339),
				Status:            interceptor.statusCode,
				RelevantComponent: component,
				ActualDebugLog:    fmt.Sprintf("%s %s served in %v", r.Method, r.URL.Path, duration),
			}

			var buf bytes.Buffer
			_ = json.NewEncoder(&buf).Encode(logEntry)
			log.Print(buf.String())
		})
	}
}

func LogEvent(status int, component string, debugLog string) {
	entry := SeniorLogEntry{
		Timestamp:         time.Now().Format(time.RFC3339),
		Status:            status,
		RelevantComponent: component,
		ActualDebugLog:    debugLog,
	}
	var buf bytes.Buffer
	_ = json.NewEncoder(&buf).Encode(entry)
	log.Print(buf.String())
}
