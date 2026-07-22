package response

import (
	"encoding/json"
	"net/http"
)

// APIResponse represents the global standardized REST API response structure.
type APIResponse struct {
	Status   string      `json:"status"`
	Response interface{} `json:"response"`
}

// JSON renders a standardized JSON response with specified HTTP status code.
func JSON(w http.ResponseWriter, statusCode int, status string, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(APIResponse{
		Status:   status,
		Response: payload,
	})
}

// Success returns a standardized HTTP 200/201/etc. success payload.
func Success(w http.ResponseWriter, statusCode int, payload interface{}) {
	JSON(w, statusCode, "success", payload)
}

// Error returns a standardized HTTP error payload.
func Error(w http.ResponseWriter, statusCode int, errorMessage string) {
	JSON(w, statusCode, "error", map[string]string{
		"message": errorMessage,
	})
}
