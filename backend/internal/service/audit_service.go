package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"secureoffice/backend/internal/database"
	"secureoffice/backend/internal/domain"
)

type AuditService struct {
	db *database.PostgresDB
}

func NewAuditService(db *database.PostgresDB) *AuditService {
	return &AuditService{db: db}
}

// LogEvent records a tamper-evident audit log entry using SHA-256 hash chaining
func (s *AuditService) LogEvent(ctx context.Context, letterID *uuid.UUID, actorID uuid.UUID, action, ipAddress, userAgent string) (*domain.AuditLog, error) {
	if s.db == nil || s.db.Pool == nil {
		return nil, nil // Silently skip if database is offline in standalone mode
	}

	// 1. Fetch the previous current_hash from the last audit_log entry
	var prevHash string
	queryPrev := `SELECT current_hash FROM audit_logs ORDER BY id DESC LIMIT 1`
	err := s.db.Pool.QueryRow(ctx, queryPrev).Scan(&prevHash)
	if err != nil {
		if err == pgx.ErrNoRows {
			// Genesis hash for initial system entry
			prevHash = "0000000000000000000000000000000000000000000000000000000000000000"
		} else {
			return nil, fmt.Errorf("failed to fetch previous audit hash: %w", err)
		}
	}

	now := time.Now()

	// 2. Compute current SHA-256 Hash Chaining
	// Formula: CurrentHash = SHA-256(Action + ActorID + Timestamp + PrevHash)
	hashInput := fmt.Sprintf("%s|%s|%s|%s", action, actorID.String(), now.Format(time.RFC3339Nano), prevHash)
	hashBytes := sha256.Sum256([]byte(hashInput))
	currentHash := hex.EncodeToString(hashBytes[:])

	// 3. Insert audit log record
	queryInsert := `
		INSERT INTO audit_logs (letter_id, actor_user_id, action, ip_address, user_agent, previous_hash, current_hash, timestamp)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, letter_id, actor_user_id, action, ip_address, user_agent, previous_hash, current_hash, timestamp
	`

	var logEntry domain.AuditLog
	err = s.db.Pool.QueryRow(ctx, queryInsert, letterID, actorID, action, ipAddress, userAgent, prevHash, currentHash, now).Scan(
		&logEntry.ID, &logEntry.LetterID, &logEntry.ActorUserID, &logEntry.Action,
		&logEntry.IPAddress, &logEntry.UserAgent, &logEntry.PreviousHash, &logEntry.CurrentHash, &logEntry.Timestamp,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to insert audit log entry: %w", err)
	}

	return &logEntry, nil
}
