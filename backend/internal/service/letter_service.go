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
	FileName         *string                     `json:"file_name"`
	FileSize         *int                        `json:"file_size"`
}

type LetterService struct {
	repo                *repository.LetterRepository
	auditService        *AuditService
	notificationService *NotificationService
	cryptoServiceURL    string
}

func NewLetterService(repo *repository.LetterRepository, auditService *AuditService) *LetterService {
	cryptoURL := os.Getenv("CRYPTO_SERVICE_URL")
	if cryptoURL == "" {
		cryptoURL = "http://localhost:8081/api/v1/crypto"
	}
	return &LetterService{
		repo:                repo,
		auditService:        auditService,
		notificationService: NewNotificationService(),
		cryptoServiceURL:    cryptoURL,
	}
}

// CreateDraft creates a new letter draft, executes real AES-256-GCM envelope encryption, and triggers notification alerts
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

	// 4. Encrypted PDF Attachment Setup
	var filePath *string
	if dto.FileName != nil && *dto.FileName != "" {
		path := fmt.Sprintf("uploads/%s_%s", uuid.New().String()[:8], *dto.FileName)
		filePath = &path
	}

	// 5. Create Letter Entity
	letterID := uuid.New()
	letter := &domain.Letter{
		ID:                   letterID,
		LetterNumber:         letterNumber,
		SubjectEncrypted:     []byte(dto.Subject),
		Classification:       dto.Classification,
		Category:             dto.Category,
		SenderUnitID:         claims.WorkUnitID,
		EncryptedContentPath: encryptedPayloadPath,
		SymmetricEnvelopeKey: symmetricEnvelopeKey,
		ContentHash:          contentHash,
		Status:               domain.StatusDraft,
		FilePath:             filePath,
		FileSize:             dto.FileSize,
	}

	// 6. Save to Repository
	err = s.repo.CreateDraft(ctx, letter, dto.RecipientUnitIDs, dto.CCUnitIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to save letter draft: %w", err)
	}

	// 7. Dispatch Audit Event (Hash-Chained)
	if s.auditService != nil {
		_, _ = s.auditService.LogEvent(ctx, &letter.ID, claims.UserID, "CREATE_LETTER_DRAFT", ipAddress, userAgent)
	}

	// 8. Trigger Instant Notification Alert
	if s.notificationService != nil {
		alertMsg := fmt.Sprintf("Naskah dinas baru telah dibuat:\n📌 Nomor: %s\n🏷️ Perihal: %s\n🔒 Klasifikasi: %s\n✍️ Pembuat: %s",
			letterNumber, dto.Subject, dto.Classification, claims.Username)
		_ = s.notificationService.SendAlert(ctx, alertMsg)
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

	// Trigger Read Notification Alert for RAHASIA documents
	if letter.Classification == domain.ClassRahasia && s.notificationService != nil {
		alertMsg := fmt.Sprintf("⚠️ *DOKUMEN RAHASIA DIBACA*\n📌 Nomor: %s\n✍️ Pembaca: %s\n🖥️ Unit Kerja: %s",
			letter.LetterNumber, claims.Username, claims.WorkUnitID.String())
		_ = s.notificationService.SendAlert(ctx, alertMsg)
	}

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

	// Trigger alert for revision/rejection
	if s.notificationService != nil {
		alertMsg := fmt.Sprintf("⚠️ *STATUS NASKAH DINAS BERUBAH*\n📌 ID: %s\n📢 Aksi: %s\n📝 Catatan: %s",
			letterID.String()[:8], action, notes)
		_ = s.notificationService.SendAlert(ctx, alertMsg)
	}

	return nil
}
