package middleware

import (
	"net/http"

	"secureoffice/backend/internal/domain"
)

// RequireRoles restricts access to users possessing specified roles
func RequireRoles(allowedRoles ...domain.UserRole) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := GetUserClaims(r.Context())
			if !ok {
				respondJSONError(w, http.StatusUnauthorized, "Unauthorized access")
				return
			}

			roleMatch := false
			for _, role := range allowedRoles {
				if claims.Role == role {
					roleMatch = true
					break
				}
			}

			if !roleMatch {
				respondJSONError(w, http.StatusForbidden, "Forbidden: Insufficient role permissions")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// RequireClearance restricts access based on minimum clearance level
func RequireClearance(minClearance domain.ClearanceLevel) func(http.Handler) http.Handler {
	clearanceHierarchy := map[domain.ClearanceLevel]int{
		domain.ClearanceUnclassified: 1,
		domain.ClearanceRestricted:   2,
		domain.ClearanceConfidential: 3,
		domain.ClearanceSecret:       4,
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := GetUserClaims(r.Context())
			if !ok {
				respondJSONError(w, http.StatusUnauthorized, "Unauthorized access")
				return
			}

			userLevel := clearanceHierarchy[claims.ClearanceLevel]
			requiredLevel := clearanceHierarchy[minClearance]

			if userLevel < requiredLevel {
				respondJSONError(w, http.StatusForbidden, "Forbidden: Security clearance level too low")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
