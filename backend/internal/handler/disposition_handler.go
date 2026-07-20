package handler

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"secureoffice/backend/internal/middleware"
	"secureoffice/backend/internal/service"
)

type DispositionHandler struct {
	service *service.DispositionService
}

func NewDispositionHandler(svc *service.DispositionService) *DispositionHandler {
	return &DispositionHandler{service: svc}
}

// Create handles POST /api/v1/dispositions
func (h *DispositionHandler) Create(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	claims, ok := middleware.GetUserClaims(r.Context())
	if !ok {
		respondJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	var dto service.CreateDispositionDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
		return
	}

	disposition, err := h.service.CreateDisposition(r.Context(), claims, dto, r.RemoteAddr, r.UserAgent())
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	respondJSON(w, http.StatusCreated, disposition)
}

// GetByLetter handles GET /api/v1/dispositions?letter_id=...
func (h *DispositionHandler) GetByLetter(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	letterIDStr := r.URL.Query().Get("letter_id")
	letterID, err := uuid.Parse(letterIDStr)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid letter ID format"})
		return
	}

	dispositions, err := h.service.GetByLetterID(r.Context(), letterID)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	respondJSON(w, http.StatusOK, dispositions)
}
