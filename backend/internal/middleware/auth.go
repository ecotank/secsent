package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"secureoffice/backend/pkg/utils"
)

type contextKey string

const UserClaimsKey contextKey = "user_claims"

func JWTAuth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				respondJSONError(w, http.StatusUnauthorized, "Missing authorization header")
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				respondJSONError(w, http.StatusUnauthorized, "Invalid authorization header format (Bearer token required)")
				return
			}

			tokenString := parts[1]
			claims, err := utils.ValidateToken(tokenString, jwtSecret)
			if err != nil || claims.TokenType != "access" {
				respondJSONError(w, http.StatusUnauthorized, "Invalid or expired access token")
				return
			}

			ctx := context.WithValue(r.Context(), UserClaimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetUserClaims(ctx context.Context) (*utils.JWTClaims, bool) {
	claims, ok := ctx.Value(UserClaimsKey).(*utils.JWTClaims)
	return claims, ok
}

func respondJSONError(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "error",
		"code":    statusCode,
		"message": message,
	})
}
