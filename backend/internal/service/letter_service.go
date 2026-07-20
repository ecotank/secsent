package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
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
	repo         *repository.LetterRepository
	auditService *AuditService
}

func NewLetterService(repo *repository.LetterRepository, auditService *AuditService) *LetterService {
	return &LetterService{
		repo:         repo,
		auditService: auditService,
	}
}

// CreateDraft creates a new letter draft, generates letter number, computes SHA-256 hash, and logs audit trail
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

	// 3. Create Letter Entity
	letterID := uuid.New()
	letter := &domain.Letter{
		ID:                    letterID,
		LetterNumber:          letterNumber,
		SubjectEncrypted:      []byte(dto.Subject), // Ciphertext placeholder until Crypto Service integration
		Classification:        dto.Classification,
		Category:              dto.Category,
		SenderUnitID:          claims.WorkUnitID,
		EncryptedContentPath:  fmt.Sprintf("letters/%s/content.enc", letterID.String()),
		SymmetricEnvelopeKey:  "ENVELOPE_KEY_PLACEHOLDER",
		ContentHash:           contentHash,
		Status:                domain.StatusDraft,
	}

	// 4. Save to Repository
	err = s.repo.CreateDraft(ctx, letter, dto.RecipientUnitIDs, dto.CCUnitIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to save letter draft: %w", err)
	}

	// 5. Dispatch Audit Event (Hash-Chained)
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
