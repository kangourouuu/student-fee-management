package crypto_test

import (
	"testing"

	"student-fee-management/internal/pkg/crypto"
)

func TestEncryptDecryptAndMasking(t *testing.T) {
	secretKey := "my-super-secret-encryption-key-32b"
	plainPhone := "+1 555-019283"

	// 1. Encryption
	encrypted, err := crypto.Encrypt(plainPhone, secretKey)
	if err != nil {
		t.Fatalf("failed to encrypt phone number: %v", err)
	}

	if encrypted == plainPhone {
		t.Errorf("encrypted text should not match plain text")
	}

	// 2. Decryption
	decrypted, err := crypto.Decrypt(encrypted, secretKey)
	if err != nil {
		t.Fatalf("failed to decrypt phone number: %v", err)
	}

	if decrypted != plainPhone {
		t.Errorf("expected decrypted text to be %s, got %s", plainPhone, decrypted)
	}

	// 3. PII Masking
	masked := crypto.MaskPhone(plainPhone)
	if masked == plainPhone || len(masked) == 0 {
		t.Errorf("expected masked phone format, got %s", masked)
	}
}
