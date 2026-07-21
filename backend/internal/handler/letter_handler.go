package handler

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"secureoffice/backend/internal/middleware"
	"secureoffice/backend/internal/service"
)

type LetterHandler struct {
	service *service.LetterService
}

func NewLetterHandler(svc *service.LetterService) *LetterHandler {
	return &LetterHandler{service: svc}
}

// CreateDraft handles POST /api/v1/letters/draft
func (h *LetterHandler) CreateDraft(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	claims, ok := middleware.GetUserClaims(r.Context())
	if !ok {
		respondJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	var dto service.CreateLetterDraftDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
		return
	}

	senderUnitCode := claims.WorkUnitID.String()
	if claims.WorkUnitID == uuid.Nil {
		senderUnitCode = "UK-SEC-001"
	}
	letter, err := h.service.CreateDraft(r.Context(), claims, senderUnitCode, dto, r.RemoteAddr, r.UserAgent())
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	respondJSON(w, http.StatusCreated, letter)
}

// GetDetail handles GET /api/v1/letters/detail?id=...
func (h *LetterHandler) GetDetail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	claims, ok := middleware.GetUserClaims(r.Context())
	if !ok {
		respondJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	idStr := r.URL.Query().Get("id")
	letterID, err := uuid.Parse(idStr)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid letter ID format"})
		return
	}

	letter, err := h.service.GetDetail(r.Context(), claims, letterID)
	if err != nil {
		respondJSON(w, http.StatusNotFound, map[string]string{"error": "Letter not found"})
		return
	}

	respondJSON(w, http.StatusOK, letter)
}

// RejectOrRevise handles POST /api/v1/letters/reject
func (h *LetterHandler) RejectOrRevise(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	claims, ok := middleware.GetUserClaims(r.Context())
	if !ok {
		respondJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	var req struct {
		LetterID   uuid.UUID `json:"letter_id"`
		IsRevision bool      `json:"is_revision"`
		Notes      string    `json:"notes"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
		return
	}

	err := h.service.RejectOrRevise(r.Context(), claims, req.LetterID, req.IsRevision, req.Notes, r.RemoteAddr, r.UserAgent())
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "Letter status updated successfully"})
}
