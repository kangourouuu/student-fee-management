package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"io"
)

// Encrypt encrypts plain text string using AES-256-GCM and returns base64 encoded ciphertext.
func Encrypt(plaintext string, secretKey string) (string, error) {
	if plaintext == "" {
		return "", nil
	}
	key := padKey([]byte(secretKey))

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create gcm: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("failed to generate nonce: %w", err)
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Decrypt decrypts base64 encoded ciphertext using AES-256-GCM.
func Decrypt(ciphertextBase64 string, secretKey string) (string, error) {
	if ciphertextBase64 == "" {
		return "", nil
	}
	key := padKey([]byte(secretKey))

	ciphertext, err := base64.StdEncoding.DecodeString(ciphertextBase64)
	if err != nil {
		// If data was stored prior to encryption or is invalid base64, return original string
		return ciphertextBase64, nil
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create gcm: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return ciphertextBase64, nil
	}

	nonce, ciphertextBytes := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertextBytes, nil)
	if err != nil {
		// If decryption fails (e.g. legacy plain text record), return unencrypted string
		return ciphertextBase64, nil
	}

	return string(plaintext), nil
}

func padKey(key []byte) []byte {
	if len(key) >= 32 {
		return key[:32]
	}
	padded := make([]byte, 32)
	copy(padded, key)
	return padded
}

// MaskPhone masks sensitive phone PII for safe DTO presentation.
func MaskPhone(phone string) string {
	if len(phone) < 4 {
		return "***"
	}
	return phone[:3] + " *** *" + phone[len(phone)-3:]
}
