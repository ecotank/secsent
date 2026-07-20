package handler

import (
	"encoding/base64"
	"encoding/json"
	"net/http"

	"secureoffice/crypto-service/pkg/envelope"
	"secureoffice/crypto-service/pkg/keys"
	"secureoffice/crypto-service/pkg/signature"
)

type CryptoHandler struct{}

func NewCryptoHandler() *CryptoHandler {
	return &CryptoHandler{}
}

// GenerateKeyPair handles POST /api/v1/crypto/keypair/generate
func (h *CryptoHandler) GenerateKeyPair(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	var req struct {
		Algorithm string `json:"algorithm"` // "Ed25519" or "X25519"
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	var res *keys.KeyPairResult
	var err error

	if req.Algorithm == "X25519" {
		res, err = keys.GenerateX25519KeyPair()
	} else {
		res, err = keys.GenerateEd25519KeyPair() // Default Ed25519
	}

	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	respondJSON(w, http.StatusOK, res)
}

// EncryptEnvelope handles POST /api/v1/crypto/envelope/encrypt
func (h *CryptoHandler) EncryptEnvelope(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	var req struct {
		PlaintextB64 string `json:"plaintext_b64"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
		return
	}

	plaintextBytes, err := base64.StdEncoding.DecodeString(req.PlaintextB64)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid plaintext base64"})
		return
	}

	result, err := envelope.EncryptPayload(plaintextBytes)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	respondJSON(w, http.StatusOK, result)
}

// DecryptEnvelope handles POST /api/v1/crypto/envelope/decrypt
func (h *CryptoHandler) DecryptEnvelope(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	var req struct {
		CiphertextB64        string `json:"ciphertext_b64"`
		SymmetricEnvelopeKey string `json:"symmetric_envelope_key"`
		NonceB64             string `json:"nonce_b64"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
		return
	}

	plaintext, err := envelope.DecryptPayload(req.CiphertextB64, req.SymmetricEnvelopeKey, req.NonceB64)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"plaintext_b64": base64.StdEncoding.EncodeToString(plaintext),
		"plaintext":     string(plaintext),
	})
}

// SignDocument handles POST /api/v1/crypto/signature/sign
func (h *CryptoHandler) SignDocument(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	var req struct {
		ContentB64    string `json:"content_b64"`
		PrivateKeyPEM string `json:"private_key_pem"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
		return
	}

	contentBytes, err := base64.StdEncoding.DecodeString(req.ContentB64)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid content base64"})
		return
	}

	result, err := signature.SignDocument(contentBytes, req.PrivateKeyPEM)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	respondJSON(w, http.StatusOK, result)
}

// VerifySignature handles POST /api/v1/crypto/signature/verify
func (h *CryptoHandler) VerifySignature(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	var req struct {
		ContentB64   string `json:"content_b64"`
		SignatureB64 string `json:"signature_b64"`
		PublicKeyPEM string `json:"public_key_pem"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
		return
	}

	contentBytes, err := base64.StdEncoding.DecodeString(req.ContentB64)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid content base64"})
		return
	}

	isValid, err := signature.VerifySignature(contentBytes, req.SignatureB64, req.PublicKeyPEM)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]interface{}{"valid": false, "error": err.Error()})
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"valid": isValid})
}

func respondJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(data)
}
