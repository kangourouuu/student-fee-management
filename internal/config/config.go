package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	DatabaseURL    string
	AdminUsername  string
	AdminPassword  string
	JWTSecret      string
	EncryptionKey  string
	AppEnv         string // development | production
	AllowedOrigins string
}

func LoadConfig() (*Config, error) {
	_ = godotenv.Load() // Load .env file if present

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://user:password@localhost:5432/student_fee_db?sslmode=disable"
	}

	adminUser := os.Getenv("ADMIN_USERNAME")
	if adminUser == "" {
		adminUser = "admin"
	}

	adminPass := os.Getenv("ADMIN_PASSWORD")
	if adminPass == "" {
		adminPass = "admin123"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "default-secret-key-change-in-prod"
	}

	encKey := os.Getenv("ENCRYPTION_KEY")
	if encKey == "" {
		encKey = "default-32-byte-encryption-key-for-aes256!"
	}

	appEnv := os.Getenv("APP_ENV")
	if appEnv == "" {
		appEnv = "development"
	}

	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:4200,https://student-fee-management-pied.vercel.app"
	}

	return &Config{
		Port:           port,
		DatabaseURL:    dbURL,
		AdminUsername:  adminUser,
		AdminPassword:  adminPass,
		JWTSecret:      jwtSecret,
		EncryptionKey:  encKey,
		AppEnv:         appEnv,
		AllowedOrigins: allowedOrigins,
	}, nil
}
