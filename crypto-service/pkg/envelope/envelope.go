package envelope

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
)

type EncryptionResult struct {
	CiphertextB64        string `json:"ciphertext_b64"`
	SymmetricEnvelopeKey string `json:"symmetric_envelope_key"`
	NonceB64             string `json:"nonce_b64"`
}

// EncryptPayload Encrypts arbitrary plaintext using AES-256-GCM and generates a Data Encryption Key (DEK)
func EncryptPayload(plaintext []byte) (*EncryptionResult, error) {
	// 1. Generate random 256-bit (32 bytes) Data Encryption Key (DEK)
	dek := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, dek); err != nil {
		return nil, fmt.Errorf("failed to generate random DEK: %w", err)
	}

	// 2. Initialize AES-256-GCM cipher
	block, err := aes.NewCipher(dek)
	if err != nil {
		return nil, fmt.Errorf("failed to create AES cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCM cipher mode: %w", err)
	}

	// 3. Generate random 12-byte Nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, fmt.Errorf("failed to generate nonce: %w", err)
	}

	// 4. Seal plaintext into ciphertext
	ciphertext := gcm.Seal(nil, nonce, plaintext, nil)

	return &EncryptionResult{
		CiphertextB64:        base64.StdEncoding.EncodeToString(ciphertext),
		SymmetricEnvelopeKey: base64.StdEncoding.EncodeToString(dek),
		NonceB64:             base64.StdEncoding.EncodeToString(nonce),
	}, nil
}

// DecryptPayload Decrypts AES-256-GCM ciphertext using the provided DEK and Nonce
func DecryptPayload(ciphertextB64, dekB64, nonceB64 string) ([]byte, error) {
	ciphertext, err := base64.StdEncoding.DecodeString(ciphertextB64)
	if err != nil {
		return nil, errors.New("invalid ciphertext base64")
	}

	dek, err := base64.StdEncoding.DecodeString(dekB64)
	if err != nil {
		return nil, errors.New("invalid DEK base64")
	}

	nonce, err := base64.StdEncoding.DecodeString(nonceB64)
	if err != nil {
		return nil, errors.New("invalid nonce base64")
	}

	block, err := aes.NewCipher(dek)
	if err != nil {
		return nil, fmt.Errorf("failed to create AES cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCM cipher mode: %w", err)
	}

	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, fmt.Errorf("decryption authentication failed (tampered data or wrong key): %w", err)
	}

	return plaintext, nil
}
