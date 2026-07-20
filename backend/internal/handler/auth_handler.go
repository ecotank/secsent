package handler

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5"
	"secureoffice/backend/internal/config"
	"secureoffice/backend/internal/database"
	"secureoffice/backend/internal/domain"
	"secureoffice/backend/internal/middleware"
	"secureoffice/backend/pkg/utils"
)

type AuthHandler struct {
	db     *database.PostgresDB
	config *config.Config
}

func NewAuthHandler(db *database.PostgresDB, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		db:     db,
		config: cfg,
	}
}

// Login handles user authentication and token issuing
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	var req domain.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
		return
	}

	// Query user from PostgreSQL
	query := `
		SELECT u.id, u.work_unit_id, u.username, u.email, u.password_hash, u.full_name, u.nip_nik, 
		       u.role, u.clearance_level, u.is_active, u.created_at,
		       w.id, w.unit_code, w.unit_name, w.security_clearance_level
		FROM users u
		JOIN work_units w ON u.work_unit_id = w.id
		WHERE u.username = $1 AND u.is_active = true
	`

	var user domain.User
	var workUnit domain.WorkUnit

	err := h.db.Pool.QueryRow(context.Background(), query, req.Username).Scan(
		&user.ID, &user.WorkUnitID, &user.Username, &user.Email, &user.PasswordHash,
		&user.FullName, &user.NipNik, &user.Role, &user.ClearanceLevel, &user.IsActive, &user.CreatedAt,
		&workUnit.ID, &workUnit.UnitCode, &workUnit.UnitName, &workUnit.SecurityClearanceLevel,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			respondJSON(w, http.StatusUnauthorized, map[string]string{"error": "Invalid username or password"})
			return
		}
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "Database query failure"})
		return
	}

	user.WorkUnit = &workUnit

	// Verify Argon2id Password
	match, err := utils.VerifyPassword(req.Password, user.PasswordHash)
	if err != nil || !match {
		respondJSON(w, http.StatusUnauthorized, map[string]string{"error": "Invalid username or password"})
		return
	}

	// Generate JWT Access & Refresh Tokens
	accessToken, refreshToken, err := utils.GenerateTokens(&user, h.config.JWTSecret, h.config.JWTAccessExpMins, h.config.JWTRefreshExpDays)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to generate security tokens"})
		return
	}

	resp := domain.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
	}

	respondJSON(w, http.StatusOK, resp)
}

// Me handles retrieving authenticated user profile
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	claims, ok := middleware.GetUserClaims(r.Context())
	if !ok {
		respondJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	query := `
		SELECT u.id, u.work_unit_id, u.username, u.email, u.full_name, u.nip_nik, 
		       u.role, u.clearance_level, u.is_active, u.created_at,
		       w.id, w.unit_code, w.unit_name, w.security_clearance_level
		FROM users u
		JOIN work_units w ON u.work_unit_id = w.id
		WHERE u.id = $1 AND u.is_active = true
	`

	var user domain.User
	var workUnit domain.WorkUnit

	err := h.db.Pool.QueryRow(context.Background(), query, claims.UserID).Scan(
		&user.ID, &user.WorkUnitID, &user.Username, &user.Email,
		&user.FullName, &user.NipNik, &user.Role, &user.ClearanceLevel, &user.IsActive, &user.CreatedAt,
		&workUnit.ID, &workUnit.UnitCode, &workUnit.UnitName, &workUnit.SecurityClearanceLevel,
	)

	if err != nil {
		respondJSON(w, http.StatusNotFound, map[string]string{"error": "User profile not found"})
		return
	}

	user.WorkUnit = &workUnit
	respondJSON(w, http.StatusOK, user)
}

func respondJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(data)
}
