package signature

import (
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"time"

	"secureoffice/crypto-service/pkg/keys"
)

type SignatureResult struct {
	SignatureAlgorithm string    `json:"signature_algorithm"`
	SignatureB64       string    `json:"signature_b64"`
	TimestampTokenB64  string    `json:"timestamp_token_b64"`
	SignedAt           time.Time `json:"signed_at"`
	ContentHash        string    `json:"content_hash"`
}

// SignDocument creates an Ed25519 digital signature over a document content hash
func SignDocument(content []byte, privateKeyPEM string) (*SignatureResult, error) {
	// 1. Compute SHA-256 Hash of document content
	hashBytes := sha256.Sum256(content)
	contentHash := fmt.Sprintf("%x", hashBytes)

	// 2. Decode Ed25519 Private Key PEM
	privKeyBytes, err := keys.DecodePEMPublicKey(privateKeyPEM)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key PEM: %w", err)
	}

	if len(privKeyBytes) != ed25519.PrivateKeySize {
		return nil, fmt.Errorf("invalid Ed25519 private key size (expected %d bytes, got %d)", ed25519.PrivateKeySize, len(privKeyBytes))
	}

	privKey := ed25519.PrivateKey(privKeyBytes)

	// 3. Sign document hash with Ed25519 private key
	sigBytes := ed25519.Sign(privKey, hashBytes[:])

	now := time.Now()
	timestampToken := []byte(fmt.Sprintf("TSA_TIMESTAMP_TOKEN|%s|%s", contentHash, now.Format(time.RFC3339Nano)))

	return &SignatureResult{
		SignatureAlgorithm: "Ed25519",
		SignatureB64:       base64.StdEncoding.EncodeToString(sigBytes),
		TimestampTokenB64:  base64.StdEncoding.EncodeToString(timestampToken),
		SignedAt:           now,
		ContentHash:        contentHash,
	}, nil
}

// VerifySignature verifies an Ed25519 digital signature against a document content hash and public key
func VerifySignature(content []byte, signatureB64, publicKeyPEM string) (bool, error) {
	// 1. Compute SHA-256 Hash of document content
	hashBytes := sha256.Sum256(content)

	// 2. Decode Signature
	sigBytes, err := base64.StdEncoding.DecodeString(signatureB64)
	if err != nil {
		return false, errors.New("invalid signature base64")
	}

	// 3. Decode Public Key
	pubKeyBytes, err := keys.DecodePEMPublicKey(publicKeyPEM)
	if err != nil {
		return false, fmt.Errorf("failed to parse public key PEM: %w", err)
	}

	if len(pubKeyBytes) != ed25519.PublicKeySize {
		return false, fmt.Errorf("invalid Ed25519 public key size (expected %d bytes, got %d)", ed25519.PublicKeySize, len(pubKeyBytes))
	}

	pubKey := ed25519.PublicKey(pubKeyBytes)

	// 4. Verify signature
	isValid := ed25519.Verify(pubKey, hashBytes[:], sigBytes)
	return isValid, nil
}
