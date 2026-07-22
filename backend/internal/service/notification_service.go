package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

type NotificationService struct {
	telegramBotToken string
	telegramChatID   string
	waGatewayURL     string
}

func NewNotificationService() *NotificationService {
	return &NotificationService{
		telegramBotToken: os.Getenv("TELEGRAM_BOT_TOKEN"),
		telegramChatID:   os.Getenv("TELEGRAM_CHAT_ID"),
		waGatewayURL:     os.Getenv("WA_GATEWAY_URL"),
	}
}

// SendAlert sends instant notification to Telegram and logs mock WhatsApp dispatch
func (s *NotificationService) SendAlert(ctx context.Context, message string) error {
	timestamp := time.Now().Format("2006-01-02 15:04:05 MST")
	formattedMsg := fmt.Sprintf("🔔 *SECUREOFFICE-AI ALERT*\n⏱️ %s\n\n%s", timestamp, message)

	// 1. Mock WhatsApp Gateway Logging
	fmt.Printf("[WA-MOCK-GATEWAY] Sending Notification to Official Group:\n---\n%s\n---\n", message)

	// 2. Telegram Bot Integration (If Configured)
	if s.telegramBotToken != "" && s.telegramChatID != "" {
		url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", s.telegramBotToken)
		body, _ := json.Marshal(map[string]string{
			"chat_id":    s.telegramChatID,
			"text":       formattedMsg,
			"parse_mode": "Markdown",
		})

		client := &http.Client{Timeout: 5 * time.Second}
		req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(body))
		if err != nil {
			return err
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			fmt.Printf("[TELEGRAM-ERR] Connection failed: %v\n", err)
			return nil // Don't block core logic on notification connection failure
		}
		defer resp.Body.Close()
	}

	return nil
}
