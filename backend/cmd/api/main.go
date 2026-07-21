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

	"secureoffice/backend/internal/config"
	"secureoffice/backend/internal/database"
	"secureoffice/backend/internal/domain"
	"secureoffice/backend/internal/handler"
	"secureoffice/backend/internal/middleware"
	"secureoffice/backend/internal/repository"
	"secureoffice/backend/internal/service"
)

func main() {
	log.Println("Starting SecureOffice-AI Backend Core Service...")

	// 1. Load Configurations
	cfg := config.LoadConfig()
	log.Printf("Environment: %s | App Port: %s", cfg.AppEnv, cfg.AppPort)

	// 2. Initialize PostgreSQL Connection Pool
	db, err := database.NewPostgresDB(cfg.DatabaseURL)
	if err != nil {
		log.Printf("Warning: Database connection failed (%v). Continuing in standalone mode...", err)
	} else {
		defer db.Close()
	}

	// 3. Initialize Repositories & Services
	var authHandler *handler.AuthHandler
	var letterHandler *handler.LetterHandler
	var dispositionHandler *handler.DispositionHandler

	if db != nil {
		// Repositories
		letterRepo := repository.NewLetterRepository(db)
		dispositionRepo := repository.NewDispositionRepository(db)

		// Services
		auditSvc := service.NewAuditService(db)
		letterSvc := service.NewLetterService(letterRepo, auditSvc)
		dispositionSvc := service.NewDispositionService(dispositionRepo, auditSvc)

		// Handlers
		authHandler = handler.NewAuthHandler(db, cfg)
		letterHandler = handler.NewLetterHandler(letterSvc)
		dispositionHandler = handler.NewDispositionHandler(dispositionSvc)
	}

	// 4. Setup HTTP Mux & Middleware Router
	mux := http.NewServeMux()

	// Public Health Check Endpoint
	mux.HandleFunc("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":    "healthy",
			"service":   cfg.AppName,
			"timestamp": time.Now().Format(time.RFC3339),
			"database":  db != nil,
		})
	})

	// Auth Endpoints
	if authHandler != nil {
		mux.HandleFunc("/api/v1/auth/login", authHandler.Login)
		mux.Handle("/api/v1/auth/me", middleware.JWTAuth(cfg.JWTSecret)(http.HandlerFunc(authHandler.Me)))
	}

	// Letter Management Endpoints
	if letterHandler != nil {
		mux.Handle("/api/v1/letters/draft", middleware.JWTAuth(cfg.JWTSecret)(http.HandlerFunc(letterHandler.CreateDraft)))
		mux.Handle("/api/v1/letters/detail", middleware.JWTAuth(cfg.JWTSecret)(http.HandlerFunc(letterHandler.GetDetail)))
		mux.Handle("/api/v1/letters/reject", middleware.JWTAuth(cfg.JWTSecret)(
			middleware.RequireRoles(domain.RoleHeadOfUnit, domain.RoleAdmin)(http.HandlerFunc(letterHandler.RejectOrRevise)),
		))
	}

	// Disposition Endpoints
	if dispositionHandler != nil {
		mux.Handle("/api/v1/dispositions", middleware.JWTAuth(cfg.JWTSecret)(
			middleware.RequireRoles(domain.RoleHeadOfUnit, domain.RoleSecretary, domain.RoleAdmin)(http.HandlerFunc(dispositionHandler.Create)),
		))
		mux.Handle("/api/v1/dispositions/list", middleware.JWTAuth(cfg.JWTSecret)(http.HandlerFunc(dispositionHandler.GetByLetter)))
	}

	// Apply Global Middleware (CORS & Security Headers)
	handlerWithMiddleware := applyGlobalMiddleware(mux)

	// 5. Configure HTTP Server
	server := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.AppPort),
		Handler:      handlerWithMiddleware,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// 6. Graceful Shutdown Listener
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("Backend Core Service HTTP Server listening on port :%s", cfg.AppPort)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server error: %v", err)
		}
	}()

	<-stop
	log.Println("Shutting down Backend Core Service gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced shutdown error: %v", err)
	}

	log.Println("Backend Core Service exited cleanly")
}

func applyGlobalMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// CORS Headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Hardened HTTP Security Headers
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("X-Permitted-Cross-Domain-Policies", "none")
		w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
