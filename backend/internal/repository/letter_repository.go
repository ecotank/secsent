package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"secureoffice/backend/internal/database"
	"secureoffice/backend/internal/domain"
)

type LetterRepository struct {
	db *database.PostgresDB
}

func NewLetterRepository(db *database.PostgresDB) *LetterRepository {
	return &LetterRepository{db: db}
}

// GenerateLetterNumber implements the Letter Numbering Engine: {CategoryCode}/{Sequence}/{UnitCode}/{RomanMonth}/{Year}
func (r *LetterRepository) GenerateLetterNumber(ctx context.Context, category, unitCode string, month int, year int) (string, error) {
	romanMonths := []string{"", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"}
	romanMonth := "I"
	if month >= 1 && month <= 12 {
		romanMonth = romanMonths[month]
	}

	categoryCode := "ND" // Default Nota Dinas
	switch category {
	case "SURAT_EDARAN":
		categoryCode = "SE"
	case "SURAT_KEPUTUSAN":
		categoryCode = "SK"
	case "SURAT_UNDANGAN":
		categoryCode = "UND"
	case "NOTA_DINAS":
		categoryCode = "ND"
	}

	// Fetch sequence count for the current unit and year
	query := `SELECT COUNT(*) + 1 FROM letters WHERE sender_unit_id IN (SELECT id FROM work_units WHERE unit_code = $1) AND EXTRACT(YEAR FROM created_at) = $2`
	var sequence int
	err := r.db.Pool.QueryRow(ctx, query, unitCode, year).Scan(&sequence)
	if err != nil {
		sequence = 1
	}

	letterNumber := fmt.Sprintf("%s/%03d/%s/%s/%d", categoryCode, sequence, unitCode, romanMonth, year)
	return letterNumber, nil
}

// CreateDraft inserts a new letter draft and its recipients into PostgreSQL
func (r *LetterRepository) CreateDraft(ctx context.Context, letter *domain.Letter, recipientUnitIDs []uuid.UUID, ccUnitIDs []uuid.UUID) error {
	tx, err := r.db.Pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// 1. Insert Letter
	queryLetter := `
		INSERT INTO letters (id, letter_number, subject_encrypted, classification, category, sender_unit_id, encrypted_content_path, symmetric_envelope_key, content_hash, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
		RETURNING created_at, updated_at
	`
	err = tx.QueryRow(ctx, queryLetter,
		letter.ID, letter.LetterNumber, letter.SubjectEncrypted, letter.Classification,
		letter.Category, letter.SenderUnitID, letter.EncryptedContentPath, letter.SymmetricEnvelopeKey,
		letter.ContentHash, letter.Status,
	).Scan(&letter.CreatedAt, &letter.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to insert letter: %w", err)
	}

	// 2. Insert Primary Recipients
	queryRecipient := `INSERT INTO letter_recipients (id, letter_id, recipient_unit_id, recipient_type, created_at) VALUES ($1, $2, $3, $4, NOW())`
	for _, recID := range recipientUnitIDs {
		_, err := tx.Exec(ctx, queryRecipient, uuid.New(), letter.ID, recID, domain.RecipientPrimary)
		if err != nil {
			return fmt.Errorf("failed to insert primary recipient: %w", err)
		}
	}

	// 3. Insert CC Recipients
	for _, ccID := range ccUnitIDs {
		_, err := tx.Exec(ctx, queryRecipient, uuid.New(), letter.ID, ccID, domain.RecipientCC)
		if err != nil {
			return fmt.Errorf("failed to insert CC recipient: %w", err)
		}
	}

	return tx.Commit(ctx)
}

// GetByID fetches a letter by ID with its sender unit details
func (r *LetterRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Letter, error) {
	query := `
		SELECT l.id, l.letter_number, l.subject_encrypted, l.classification, l.category, l.sender_unit_id,
		       l.encrypted_content_path, l.symmetric_envelope_key, l.content_hash, l.status, l.revision_notes_encrypted,
		       l.created_at, l.updated_at,
		       w.id, w.unit_code, w.unit_name, w.security_clearance_level
		FROM letters l
		JOIN work_units w ON l.sender_unit_id = w.id
		WHERE l.id = $1
	`
	var l domain.Letter
	var w domain.WorkUnit

	err := r.db.Pool.QueryRow(ctx, query, id).Scan(
		&l.ID, &l.LetterNumber, &l.SubjectEncrypted, &l.Classification, &l.Category, &l.SenderUnitID,
		&l.EncryptedContentPath, &l.SymmetricEnvelopeKey, &l.ContentHash, &l.Status, &l.RevisionNotesEncrypted,
		&l.CreatedAt, &l.UpdatedAt,
		&w.ID, &w.UnitCode, &w.UnitName, &w.SecurityClearanceLevel,
	)

	if err != nil {
		return nil, err
	}

	l.SenderUnit = &w
	return &l, nil
}

// UpdateStatus updates status of a letter
func (r *LetterRepository) UpdateStatus(ctx context.Context, letterID uuid.UUID, status domain.LetterStatus, revisionNotesEncrypted []byte) error {
	query := `UPDATE letters SET status = $1, revision_notes_encrypted = $2, updated_at = NOW() WHERE id = $3`
	_, err := r.db.Pool.Exec(ctx, query, status, revisionNotesEncrypted, letterID)
	return err
}
