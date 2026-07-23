package main

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/google/uuid"
	"secureoffice/backend/internal/config"
	"secureoffice/backend/internal/database"
	"secureoffice/backend/internal/service"
	"secureoffice/backend/pkg/utils"
)

func main() {
	fmt.Println("==================================================")
	fmt.Println("   SecureOffice-AI - CLI Pendaftaran Akun Baru    ")
	fmt.Println("==================================================")

	// 1. Load Configurations
	cfg := config.LoadConfig()

	// 2. Connect to Database
	db, err := database.NewPostgresDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Gagal menghubungkan ke database: %v\nSilakan pastikan Docker Postgres berjalan.", err)
	}
	defer db.Close()

	reader := bufio.NewReader(os.Stdin)

	// 3. Fetch Work Units for selection
	rows, err := db.Pool.Query(context.Background(), "SELECT id, unit_code, unit_name FROM work_units ORDER BY unit_code")
	if err != nil {
		log.Fatalf("Gagal mengambil data unit kerja: %v", err)
	}
	defer rows.Close()

	var units []struct {
		ID   uuid.UUID
		Code string
		Name string
	}
	fmt.Println("\nDaftar Unit Kerja Tersedia:")
	for rows.Next() {
		var u struct {
			ID   uuid.UUID
			Code string
			Name string
		}
		if err := rows.Scan(&u.ID, &u.Code, &u.Name); err == nil {
			units = append(units, u)
			fmt.Printf("- [%d] %s (%s)\n", len(units), u.Code, u.Name)
		}
	}

	if len(units) == 0 {
		log.Fatal("Tidak ada unit kerja terdaftar. Jalankan seed database terlebih dahulu.")
	}

	// 4. Prompt Inputs
	unitIdx := promptInt(reader, "Pilih nomor Unit Kerja target: ", 1, len(units))
	targetUnit := units[unitIdx-1]

	username := promptString(reader, "Username Baru: ")
	fullName := promptString(reader, "Nama Lengkap & Gelar: ")
	email := promptString(reader, "Email Dinas: ")
	nip := promptString(reader, "NIP / NIK Resmi: ")
	password := promptString(reader, "Kata Sandi (Password): ")

	fmt.Println("\nPilihan Role:")
	fmt.Println("[1] HEAD_OF_UNIT (Kepala Unit)")
	fmt.Println("[2] SECRETARY (Sekretaris)")
	fmt.Println("[3] STAFF (Staf Pelaksana)")
	fmt.Println("[4] ADMIN (System Administrator)")
	fmt.Println("[5] AUDITOR (Auditor Internal)")
	roleIdx := promptInt(reader, "Pilih Role: ", 1, 5)

	roleMap := map[int]string{
		1: "HEAD_OF_UNIT",
		2: "SECRETARY",
		3: "STAFF",
		4: "ADMIN",
		5: "AUDITOR",
	}
	role := roleMap[roleIdx]

	fmt.Println("\nPilihan Clearance Level (Tingkat Kerahasiaan):")
	fmt.Println("[1] UNCLASSIFIED (Biasa)")
	fmt.Println("[2] RESTRICTED (Terbatas)")
	fmt.Println("[3] CONFIDENTIAL (Rahasia)")
	fmt.Println("[4] SECRET (Sangat Rahasia)")
	clearanceIdx := promptInt(reader, "Pilih Clearance Level: ", 1, 4)

	clearanceMap := map[int]string{
		1: "UNCLASSIFIED",
		2: "RESTRICTED",
		3: "CONFIDENTIAL",
		4: "SECRET",
	}
	clearance := clearanceMap[clearanceIdx]

	// 5. Encrypt Password using Argon2id
	fmt.Println("\nMengenkripsi password dengan algoritma Argon2id...")
	passwordHash, err := utils.HashPassword(password)
	if err != nil {
		log.Fatalf("Gagal mengenkripsi password: %v", err)
	}

	// 6. Encrypt Default PIN "123456"
	pinHash := "123456" // Default Pin plain text to be verified via dynamic local engine

	// 7. Insert to Database
	fmt.Println("Mendaftarkan akun ke datastore PostgreSQL...")
	newUserID := uuid.New()
	queryInsert := `
		INSERT INTO users (id, work_unit_id, username, email, password_hash, full_name, nip_nik, role, clearance_level, security_pin_hash, is_active, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, NOW())
	`
	_, err = db.Pool.Exec(context.Background(), queryInsert,
		newUserID, targetUnit.ID, username, email, passwordHash, fullName, nip, role, clearance, pinHash,
	)
	if err != nil {
		log.Fatalf("Gagal mendaftarkan user ke database: %v", err)
	}

	// 8. Trigger Telegram Bot Notification Alert
	notifSvc := service.NewNotificationService()
	alertMsg := fmt.Sprintf(
		"Pendaftaran Akun Baru Berhasil!\n\nNama Lengkap: %s\nUsername: %s\nRole: %s\nClearance: %s\n\nInstruksi: Selesaikan onboarding wajib mengganti password & aktifkan MFA OTPKEY pada login pertama.",
		fullName, username, role, clearance,
	)
	_ = notifSvc.SendAlert(context.Background(), alertMsg)

	fmt.Println("\n==================================================")
	fmt.Println("🎉 AKUN PEGAWAI BERHASIL DIDAFTARKAN!")
	fmt.Println("==================================================")
	fmt.Printf("Nama Lengkap : %s\n", fullName)
	fmt.Printf("Username     : %s\n", username)
	fmt.Printf("Role         : %s\n", role)
	fmt.Printf("Clearance    : %s\n", clearance)
	fmt.Printf("PIN Default  : 123456\n")
	fmt.Println("==================================================")
}

func promptString(r *bufio.Reader, label string) string {
	for {
		fmt.Print(label)
		val, err := r.ReadString('\n')
		if err != nil {
			continue
		}
		val = strings.TrimSpace(val)
		if val != "" {
			return val
		}
	}
}

func promptInt(r *bufio.Reader, label string, min, max int) int {
	for {
		fmt.Print(label)
		valStr, err := r.ReadString('\n')
		if err != nil {
			continue
		}
		valStr = strings.TrimSpace(valStr)
		var val int
		if _, err := fmt.Sscanf(valStr, "%d", &val); err == nil && val >= min && val <= max {
			return val
		}
		fmt.Printf("Input tidak valid. Pilih angka antara %d sampai %d.\n", min, max)
	}
}
