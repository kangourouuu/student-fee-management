package response

import (
	"encoding/json"
	"net/http"
)

type APIResponse struct {
	Status   string      `json:"status"`
	Response interface{} `json:"response"`
}

func JSON(w http.ResponseWriter, statusCode int, status string, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(APIResponse{
		Status:   status,
		Response: payload,
	})
}

func Success(w http.ResponseWriter, statusCode int, payload interface{}) {
	JSON(w, statusCode, "success", payload)
}

func Error(w http.ResponseWriter, statusCode int, errorMessage string) {
	JSON(w, statusCode, "error", map[string]string{
		"message": errorMessage,
	})
}
