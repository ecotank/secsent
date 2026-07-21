package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"secureoffice/crypto-service/internal/handler"
)

func main() {
	log.Println("Starting SecureOffice-AI Crypto Service...")

	port := os.Getenv("CRYPTO_SERVICE_PORT")
	if port == "" {
		port = "8081"
	}

	cryptoHandler := handler.NewCryptoHandler()
	mux := http.NewServeMux()

	// Health Check
	mux.HandleFunc("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":    "healthy",
			"service":   "SecureOffice-AI Crypto Service",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	})

	// Crypto Microservice API Routes
	mux.HandleFunc("/api/v1/crypto/keypair/generate", cryptoHandler.GenerateKeyPair)
	mux.HandleFunc("/api/v1/crypto/envelope/encrypt", cryptoHandler.EncryptEnvelope)
	mux.HandleFunc("/api/v1/crypto/envelope/decrypt", cryptoHandler.DecryptEnvelope)
	mux.HandleFunc("/api/v1/crypto/signature/sign", cryptoHandler.SignDocument)
	mux.HandleFunc("/api/v1/crypto/signature/verify", cryptoHandler.VerifySignature)

	handlerWithMiddleware := applyGlobalMiddleware(mux)

	server := &http.Server{
		Addr:         fmt.Sprintf(":%s", port),
		Handler:      handlerWithMiddleware,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  30 * time.Second,
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("Crypto Service HTTP Server listening on port :%s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Crypto Service server error: %v", err)
		}
	}()

	<-stop
	log.Println("Shutting down Crypto Service gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Crypto Service forced shutdown error: %v", err)
	}

	log.Println("Crypto Service exited cleanly")
}

func applyGlobalMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Hardened HTTP Security Headers
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("X-Permitted-Cross-Domain-Policies", "none")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
