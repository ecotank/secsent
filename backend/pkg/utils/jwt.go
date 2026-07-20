package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"secureoffice/backend/internal/domain"
)

type JWTClaims struct {
	UserID         uuid.UUID             `json:"user_id"`
	WorkUnitID     uuid.UUID             `json:"work_unit_id"`
	Username       string                `json:"username"`
	Role           domain.UserRole       `json:"role"`
	ClearanceLevel domain.ClearanceLevel `json:"clearance_level"`
	TokenType      string                `json:"token_type"` // "access" or "refresh"
	jwt.RegisteredClaims
}

// GenerateTokens creates both access and refresh JWT tokens
func GenerateTokens(user *domain.User, secret string, accessExpMins int, refreshExpDays int) (string, string, error) {
	now := time.Now()

	// Access Token Claims (15 mins default)
	accessClaims := &JWTClaims{
		UserID:         user.ID,
		WorkUnitID:     user.WorkUnitID,
		Username:       user.Username,
		Role:           user.Role,
		ClearanceLevel: user.ClearanceLevel,
		TokenType:      "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Duration(accessExpMins) * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Subject:   user.ID.String(),
			Issuer:    "SecureOffice-AI",
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString([]byte(secret))
	if err != nil {
		return "", "", err
	}

	// Refresh Token Claims (7 days default)
	refreshClaims := &JWTClaims{
		UserID:    user.ID,
		TokenType: "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Duration(refreshExpDays) * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Subject:   user.ID.String(),
			Issuer:    "SecureOffice-AI",
		},
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString([]byte(secret))
	if err != nil {
		return "", "", err
	}

	return accessTokenString, refreshTokenString, nil
}

// ValidateToken parses and validates a JWT token string
func ValidateToken(tokenString, secret string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid or expired token")
	}

	return claims, nil
}
