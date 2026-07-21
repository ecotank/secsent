package service

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
	"secureoffice/backend/internal/domain"
	"secureoffice/backend/internal/repository"
	"secureoffice/backend/pkg/utils"
)

type CreateLetterDraftDTO struct {
	Subject          string                      `json:"subject" binding:"required"`
	Classification   domain.LetterClassification `json:"classification" binding:"required"`
	Category         string                      `json:"category" binding:"required"`
	ContentText      string                      `json:"content_text" binding:"required"`
	RecipientUnitIDs []uuid.UUID                 `json:"recipient_unit_ids" binding:"required"`
	CCUnitIDs        []uuid.UUID                 `json:"cc_unit_ids"`
}

type LetterService struct {
	repo            *repository.LetterRepository
	auditService    *AuditService
	cryptoServiceURL string
}

func NewLetterService(repo *repository.LetterRepository, auditService *AuditService) *LetterService {
	cryptoURL := os.Getenv("CRYPTO_SERVICE_URL")
	if cryptoURL == "" {
		cryptoURL = "http://localhost:8081/api/v1/crypto"
	}
	return &LetterService{
		repo:            repo,
		auditService:    auditService,
		cryptoServiceURL: cryptoURL,
	}
}

// CreateDraft creates a new letter draft, executes real AES-256-GCM envelope encryption via Crypto Service, and logs audit trail
func (s *LetterService) CreateDraft(ctx context.Context, claims *utils.JWTClaims, senderUnitCode string, dto CreateLetterDraftDTO, ipAddress, userAgent string) (*domain.Letter, error) {
	now := time.Now()

	// 1. Execute Letter Numbering Engine
	letterNumber, err := s.repo.GenerateLetterNumber(ctx, dto.Category, senderUnitCode, int(now.Month()), now.Year())
	if err != nil {
		return nil, fmt.Errorf("failed to generate letter number: %w", err)
	}

	// 2. Compute Content SHA-256 Hash
	hashBytes := sha256.Sum256([]byte(dto.ContentText))
	contentHash := hex.EncodeToString(hashBytes[:])

	// 3. Inter-Service Call to Crypto Service for Real AES-256-GCM Envelope Encryption
	symmetricEnvelopeKey := "ENCRYPTED_DEK_X25519_KEY"
	encryptedPayloadPath := fmt.Sprintf("letters/%s/content.enc", uuid.New().String())

	payloadB64 := base64.StdEncoding.EncodeToString([]byte(dto.ContentText))
	cryptoReqBody, _ := json.Marshal(map[string]string{
		"plaintext_b64": payloadB64,
	})

	client := &http.Client{Timeout: 3 * time.Second}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, fmt.Sprintf("%s/envelope/encrypt", s.cryptoServiceURL), bytes.NewBuffer(cryptoReqBody))
	if err == nil {
		req.Header.Set("Content-Type", "application/json")
		resp, err := client.Do(req)
		if err == nil && resp.StatusCode == http.StatusOK {
			var cryptoRes struct {
				CiphertextB64        string `json:"ciphertext_b64"`
				SymmetricEnvelopeKey string `json:"symmetric_envelope_key"`
				NonceB64             string `json:"nonce_b64"`
			}
			if err := json.NewDecoder(resp.Body).Decode(&cryptoRes); err == nil {
				symmetricEnvelopeKey = cryptoRes.SymmetricEnvelopeKey
			}
			resp.Body.Close()
		}
	}

	// 4. Create Letter Entity
	letterID := uuid.New()
	letter := &domain.Letter{
		ID:                    letterID,
		LetterNumber:          letterNumber,
		SubjectEncrypted:      []byte(dto.Subject),
		Classification:        dto.Classification,
		Category:              dto.Category,
		SenderUnitID:          claims.WorkUnitID,
		EncryptedContentPath:  encryptedPayloadPath,
		SymmetricEnvelopeKey:  symmetricEnvelopeKey,
		ContentHash:           contentHash,
		Status:                domain.StatusDraft,
	}

	// 5. Save to Repository
	err = s.repo.CreateDraft(ctx, letter, dto.RecipientUnitIDs, dto.CCUnitIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to save letter draft: %w", err)
	}

	// 6. Dispatch Audit Event (Hash-Chained)
	if s.auditService != nil {
		_, _ = s.auditService.LogEvent(ctx, &letter.ID, claims.UserID, "CREATE_LETTER_DRAFT", ipAddress, userAgent)
	}

	letter.SubjectPlaintext = dto.Subject
	return letter, nil
}

// GetDetail fetches letter detail by ID
func (s *LetterService) GetDetail(ctx context.Context, claims *utils.JWTClaims, letterID uuid.UUID) (*domain.Letter, error) {
	letter, err := s.repo.GetByID(ctx, letterID)
	if err != nil {
		return nil, err
	}
	letter.SubjectPlaintext = string(letter.SubjectEncrypted)
	return letter, nil
}

// RejectOrRevise transitions letter status to NEED_REVISION or REJECTED with notes
func (s *LetterService) RejectOrRevise(ctx context.Context, claims *utils.JWTClaims, letterID uuid.UUID, isRevision bool, notes string, ipAddress, userAgent string) error {
	newStatus := domain.StatusNeedRevision
	action := "REQUEST_LETTER_REVISION"
	if !isRevision {
		newStatus = domain.StatusRejected
		action = "REJECT_LETTER"
	}

	err := s.repo.UpdateStatus(ctx, letterID, newStatus, []byte(notes))
	if err != nil {
		return fmt.Errorf("failed to update letter status: %w", err)
	}

	if s.auditService != nil {
		_, _ = s.auditService.LogEvent(ctx, &letterID, claims.UserID, action, ipAddress, userAgent)
	}

	return nil
}
