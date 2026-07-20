package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"secureoffice/backend/internal/database"
	"secureoffice/backend/internal/domain"
)

type DispositionRepository struct {
	db *database.PostgresDB
}

func NewDispositionRepository(db *database.PostgresDB) *DispositionRepository {
	return &DispositionRepository{db: db}
}

// Create inserts a new disposition record and updates the corresponding letter status to DISPOSED
func (r *DispositionRepository) Create(ctx context.Context, disposition *domain.Disposition) error {
	tx, err := r.db.Pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// 1. Insert Disposition Record
	queryInsert := `
		INSERT INTO dispositions (id, letter_id, sender_user_id, target_unit_id, target_user_id, instruction_encrypted, urgency_level, disposition_date)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		RETURNING disposition_date
	`
	err = tx.QueryRow(ctx, queryInsert,
		disposition.ID, disposition.LetterID, disposition.SenderUserID,
		disposition.TargetUnitID, disposition.TargetUserID, disposition.InstructionEncrypted,
		disposition.UrgencyLevel,
	).Scan(&disposition.DispositionDate)

	if err != nil {
		return fmt.Errorf("failed to insert disposition: %w", err)
	}

	// 2. Update Letter Status to DISPOSED
	queryUpdateLetter := `UPDATE letters SET status = $1, updated_at = NOW() WHERE id = $2`
	_, err = tx.Exec(ctx, queryUpdateLetter, domain.StatusDisposed, disposition.LetterID)
	if err != nil {
		return fmt.Errorf("failed to update letter status: %w", err)
	}

	return tx.Commit(ctx)
}

// GetByLetterID fetches all dispositions for a specific letter
func (r *DispositionRepository) GetByLetterID(ctx context.Context, letterID uuid.UUID) ([]domain.Disposition, error) {
	query := `
		SELECT id, letter_id, sender_user_id, target_unit_id, target_user_id, instruction_encrypted, urgency_level, disposition_date
		FROM dispositions
		WHERE letter_id = $1
		ORDER BY disposition_date ASC
	`
	rows, err := r.db.Pool.Query(ctx, query, letterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var dispositions []domain.Disposition
	for rows.Next() {
		var d domain.Disposition
		if err := rows.Scan(
			&d.ID, &d.LetterID, &d.SenderUserID, &d.TargetUnitID,
			&d.TargetUserID, &d.InstructionEncrypted, &d.UrgencyLevel, &d.DispositionDate,
		); err != nil {
			return nil, err
		}
		dispositions = append(dispositions, d)
	}

	return dispositions, nil
}
