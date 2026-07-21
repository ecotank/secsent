package domain

import (
	"time"

	"github.com/google/uuid"
)

// ClearanceLevel Enum
type ClearanceLevel string

const (
	ClearanceUnclassified ClearanceLevel = "UNCLASSIFIED"
	ClearanceRestricted   ClearanceLevel = "RESTRICTED"
	ClearanceConfidential ClearanceLevel = "CONFIDENTIAL"
	ClearanceSecret       ClearanceLevel = "SECRET"
)

// UserRole Enum
type UserRole string

const (
	RoleAdmin      UserRole = "ADMIN"
	RoleHeadOfUnit UserRole = "HEAD_OF_UNIT"
	RoleSecretary  UserRole = "SECRETARY"
	RoleStaff      UserRole = "STAFF"
	RoleAuditor    UserRole = "AUDITOR"
)

// LetterClassification Enum
type LetterClassification string

const (
	ClassBiasa        LetterClassification = "BIASA"
	ClassTerbatas     LetterClassification = "TERBATAS"
	ClassRahasia      LetterClassification = "RAHASIA"
	ClassSangatRahasia LetterClassification = "SANGAT_RAHASIA"
)

// LetterStatus Enum
type LetterStatus string

const (
	StatusDraft            LetterStatus = "DRAFT"
	StatusAIReviewing      LetterStatus = "AI_REVIEWING"
	StatusPendingSignature LetterStatus = "PENDING_SIGNATURE"
	StatusSigned           LetterStatus = "SIGNED"
	StatusSent             LetterStatus = "SENT"
	StatusReceived         LetterStatus = "RECEIVED"
	StatusDisposed         LetterStatus = "DISPOSED"
	StatusArchived         LetterStatus = "ARCHIVED"
	StatusNeedRevision     LetterStatus = "NEED_REVISION"
	StatusRejected         LetterStatus = "REJECTED"
)

// RecipientType Enum
type RecipientType string

const (
	RecipientPrimary RecipientType = "PRIMARY"
	RecipientCC      RecipientType = "CC"
	RecipientBCC     RecipientType = "BCC"
)

// UrgencyLevel Enum
type UrgencyLevel string

const (
	UrgencyBiasa      UrgencyLevel = "BIASA"
	UrgencySegera     UrgencyLevel = "SEGERA"
	UrgencyAmatSegera UrgencyLevel = "AMAT_SEGERA"
)

// WorkUnit Model
type WorkUnit struct {
	ID                     uuid.UUID      `json:"id" db:"id"`
	UnitCode               string         `json:"unit_code" db:"unit_code"`
	UnitName               string         `json:"unit_name" db:"unit_name"`
	ParentUnitID           *uuid.UUID     `json:"parent_unit_id,omitempty" db:"parent_unit_id"`
	SecurityClearanceLevel ClearanceLevel `json:"security_clearance_level" db:"security_clearance_level"`
	CreatedAt              time.Time      `json:"created_at" db:"created_at"`
}

// User Model
type User struct {
	ID             uuid.UUID      `json:"id" db:"id"`
	WorkUnitID     uuid.UUID      `json:"work_unit_id" db:"work_unit_id"`
	Username       string         `json:"username" db:"username"`
	Email          string         `json:"email" db:"email"`
	PasswordHash   string         `json:"-" db:"password_hash"`
	FullName       string         `json:"full_name" db:"full_name"`
	NipNik         string         `json:"nip_nik" db:"nip_nik"`
	Role           UserRole       `json:"role" db:"role"`
	ClearanceLevel ClearanceLevel `json:"clearance_level" db:"clearance_level"`
	MFASecret      *string        `json:"-" db:"mfa_secret"`
	SecurityPINHash *string       `json:"-" db:"security_pin_hash"`
	IsActive       bool           `json:"is_active" db:"is_active"`
	CreatedAt      time.Time      `json:"created_at" db:"created_at"`

	// Relasi Opsional
	WorkUnit *WorkUnit `json:"work_unit,omitempty"`
}

// HybridKeyPair Model
type HybridKeyPair struct {
	ID                   uuid.UUID `json:"id" db:"id"`
	UserID               uuid.UUID `json:"user_id" db:"user_id"`
	Algorithm            string    `json:"algorithm" db:"algorithm"`
	PublicKeyPEM         string    `json:"public_key_pem" db:"public_key_pem"`
	EncryptedPrivateKey  string    `json:"-" db:"encrypted_private_key"`
	KeyFingerprint       string    `json:"key_fingerprint" db:"key_fingerprint"`
	Status               string    `json:"status" db:"status"`
	ValidUntil           time.Time `json:"valid_until" db:"valid_until"`
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
}

// Letter Model
type Letter struct {
	ID                    uuid.UUID            `json:"id" db:"id"`
	LetterNumber          string               `json:"letter_number" db:"letter_number"`
	SubjectEncrypted      []byte               `json:"-" db:"subject_encrypted"`
	SubjectPlaintext      string               `json:"subject,omitempty" db:"-"`
	Classification        LetterClassification `json:"classification" db:"classification"`
	Category              string               `json:"category" db:"category"`
	SenderUnitID          uuid.UUID            `json:"sender_unit_id" db:"sender_unit_id"`
	EncryptedContentPath  string               `json:"encrypted_content_path" db:"encrypted_content_path"`
	SymmetricEnvelopeKey  string               `json:"-" db:"symmetric_envelope_key"`
	ContentHash           string               `json:"content_hash" db:"content_hash"`
	Status                LetterStatus         `json:"status" db:"status"`
	RevisionNotesEncrypted []byte              `json:"-" db:"revision_notes_encrypted"`
	CreatedAt             time.Time            `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time            `json:"updated_at" db:"updated_at"`

	// Relasi Opsional
	SenderUnit *WorkUnit         `json:"sender_unit,omitempty"`
	Recipients []LetterRecipient `json:"recipients,omitempty"`
}

// LetterRecipient Model
type LetterRecipient struct {
	ID              uuid.UUID     `json:"id" db:"id"`
	LetterID        uuid.UUID     `json:"letter_id" db:"letter_id"`
	RecipientUnitID uuid.UUID     `json:"recipient_unit_id" db:"recipient_unit_id"`
	RecipientType   RecipientType `json:"recipient_type" db:"recipient_type"`
	ReceivedAt      *time.Time    `json:"received_at,omitempty" db:"received_at"`
	CreatedAt       time.Time     `json:"created_at" db:"created_at"`

	// Relasi Opsional
	RecipientUnit *WorkUnit `json:"recipient_unit,omitempty"`
}

// Disposition Model
type Disposition struct {
	ID                   uuid.UUID    `json:"id" db:"id"`
	LetterID             uuid.UUID    `json:"letter_id" db:"letter_id"`
	SenderUserID         uuid.UUID    `json:"sender_user_id" db:"sender_user_id"`
	TargetUnitID         *uuid.UUID   `json:"target_unit_id,omitempty" db:"target_unit_id"`
	TargetUserID         *uuid.UUID   `json:"target_user_id,omitempty" db:"target_user_id"`
	InstructionEncrypted []byte       `json:"-" db:"instruction_encrypted"`
	UrgencyLevel         UrgencyLevel `json:"urgency_level" db:"urgency_level"`
	DispositionDate      time.Time    `json:"disposition_date" db:"disposition_date"`
}

// DigitalSignature Model
type DigitalSignature struct {
	ID                 uuid.UUID `json:"id" db:"id"`
	LetterID           uuid.UUID `json:"letter_id" db:"letter_id"`
	SignerUserID       uuid.UUID `json:"signer_user_id" db:"signer_user_id"`
	SignerKeyID        uuid.UUID `json:"signer_key_id" db:"signer_key_id"`
	SignatureAlgorithm string    `json:"signature_algorithm" db:"signature_algorithm"`
	SignatureBytes     []byte    `json:"signature_bytes" db:"signature_bytes"`
	TimestampToken     []byte    `json:"timestamp_token" db:"timestamp_token"`
	SignedAt           time.Time `json:"signed_at" db:"signed_at"`
}

// AuditLog Model
type AuditLog struct {
	ID           int64      `json:"id" db:"id"`
	LetterID     *uuid.UUID `json:"letter_id,omitempty" db:"letter_id"`
	ActorUserID  uuid.UUID  `json:"actor_user_id" db:"actor_user_id"`
	Action       string     `json:"action" db:"action"`
	IPAddress    string     `json:"ip_address" db:"ip_address"`
	UserAgent    string     `json:"user_agent" db:"user_agent"`
	PreviousHash string     `json:"previous_hash" db:"previous_hash"`
	CurrentHash  string     `json:"current_hash" db:"current_hash"`
	Timestamp    time.Time  `json:"timestamp" db:"timestamp"`
}

// DTOs untuk Autentikasi API
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	User         User   `json:"user"`
}
