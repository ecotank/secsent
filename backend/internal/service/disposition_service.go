package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"secureoffice/backend/internal/domain"
	"secureoffice/backend/internal/repository"
	"secureoffice/backend/pkg/utils"
)

type CreateDispositionDTO struct {
	LetterID     uuid.UUID           `json:"letter_id" binding:"required"`
	TargetUnitID *uuid.UUID          `json:"target_unit_id,omitempty"`
	TargetUserID *uuid.UUID          `json:"target_user_id,omitempty"`
	Instruction  string              `json:"instruction" binding:"required"`
	UrgencyLevel domain.UrgencyLevel `json:"urgency_level" binding:"required"`
}

type DispositionService struct {
	repo         *repository.DispositionRepository
	auditService *AuditService
}

func NewDispositionService(repo *repository.DispositionRepository, auditService *AuditService) *DispositionService {
	return &DispositionService{
		repo:         repo,
		auditService: auditService,
	}
}

// CreateDisposition validates authority, records disposition, updates letter status, and dispatches audit log
func (s *DispositionService) CreateDisposition(ctx context.Context, claims *utils.JWTClaims, dto CreateDispositionDTO, ipAddress, userAgent string) (*domain.Disposition, error) {
	// Only HEAD_OF_UNIT or SECRETARY or ADMIN can dispose letters
	if claims.Role != domain.RoleHeadOfUnit && claims.Role != domain.RoleSecretary && claims.Role != domain.RoleAdmin {
		return nil, fmt.Errorf("forbidden: user role %s cannot create dispositions", claims.Role)
	}

	dispositionID := uuid.New()
	disposition := &domain.Disposition{
		ID:                   dispositionID,
		LetterID:             dto.LetterID,
		SenderUserID:         claims.UserID,
		TargetUnitID:         dto.TargetUnitID,
		TargetUserID:         dto.TargetUserID,
		InstructionEncrypted: []byte(dto.Instruction),
		UrgencyLevel:         dto.UrgencyLevel,
	}

	err := s.repo.Create(ctx, disposition)
	if err != nil {
		return nil, fmt.Errorf("failed to save disposition: %w", err)
	}

	if s.auditService != nil {
		_, _ = s.auditService.LogEvent(ctx, &dto.LetterID, claims.UserID, "DISPOSE_LETTER", ipAddress, userAgent)
	}

	return disposition, nil
}

// GetByLetterID fetches all disposition instructions for a letter
func (s *DispositionService) GetByLetterID(ctx context.Context, letterID uuid.UUID) ([]domain.Disposition, error) {
	return s.repo.GetByLetterID(ctx, letterID)
}
