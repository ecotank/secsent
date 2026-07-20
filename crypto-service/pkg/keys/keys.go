package keys

import (
	"crypto/ed25519"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/pem"
	"errors"
	"fmt"

	"golang.org/x/crypto/curve25519"
)

type KeyPairResult struct {
	Algorithm           string `json:"algorithm"`
	PublicKeyPEM        string `json:"public_key_pem"`
	EncryptedPrivateKey string `json:"encrypted_private_key"`
	KeyFingerprint      string `json:"key_fingerprint"`
}

// GenerateEd25519KeyPair creates an Ed25519 asymmetric key pair for digital signatures
func GenerateEd25519KeyPair() (*KeyPairResult, error) {
	pubKey, privKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return nil, fmt.Errorf("failed to generate Ed25519 keypair: %w", err)
	}

	pubBytes := []byte(pubKey)
	pubBlock := &pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: pubBytes,
	}
	pubPEM := string(pem.EncodeToMemory(pubBlock))

	privBytes := []byte(privKey)
	privBlock := &pem.Block{
		Type:  "PRIVATE KEY",
		Bytes: privBytes,
	}
	privPEM := string(pem.EncodeToMemory(privBlock))

	fingerprintBytes := sha256.Sum256(pubBytes)
	fingerprint := hex.EncodeToString(fingerprintBytes[:])

	return &KeyPairResult{
		Algorithm:           "Ed25519",
		PublicKeyPEM:        pubPEM,
		EncryptedPrivateKey: privPEM, // Placeholder until Master Key HSM encryption
		KeyFingerprint:      fingerprint,
	}, nil
}

// GenerateX25519KeyPair creates an X25519 asymmetric key pair for envelope encryption
func GenerateX25519KeyPair() (*KeyPairResult, error) {
	var privKey [32]byte
	if _, err := rand.Read(privKey[:]); err != nil {
		return nil, fmt.Errorf("failed to generate X25519 private key: %w", err)
	}

	var pubKey [32]byte
	curve25519.ScalarBaseMult(&pubKey, &privKey)

	pubBlock := &pem.Block{
		Type:  "X25519 PUBLIC KEY",
		Bytes: pubKey[:],
	}
	pubPEM := string(pem.EncodeToMemory(pubBlock))

	privBlock := &pem.Block{
		Type:  "X25519 PRIVATE KEY",
		Bytes: privKey[:],
	}
	privPEM := string(pem.EncodeToMemory(privBlock))

	fingerprintBytes := sha256.Sum256(pubKey[:])
	fingerprint := hex.EncodeToString(fingerprintBytes[:])

	return &KeyPairResult{
		Algorithm:           "X25519",
		PublicKeyPEM:        pubPEM,
		EncryptedPrivateKey: privPEM,
		KeyFingerprint:      fingerprint,
	}, nil
}

// DecodePEMPublicKey extracts raw bytes from a PEM block
func DecodePEMPublicKey(pemStr string) ([]byte, error) {
	block, _ := pem.Decode([]byte(pemStr))
	if block == nil {
		return nil, errors.New("failed to decode PEM block")
	}
	return block.Bytes, nil
}
