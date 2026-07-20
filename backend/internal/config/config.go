package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	AppName        string
	AppEnv         string
	AppPort        string
	AppDebug       bool
	DatabaseURL    string
	RedisHost      string
	RedisPort      string
	MinIOEndpoint  string
	MinIOAccessKey string
	MinIOSecretKey string
	JWTSecret      string
	JWTAccessExpMins int
	JWTRefreshExpDays int
}

func LoadConfig() *Config {
	// Attempt to load .env file if present
	if err := godotenv.Load("../../.env"); err != nil {
		if err := godotenv.Load(".env"); err != nil {
			log.Println("Notice: No .env file found, relying on environment variables")
		}
	}

	return &Config{
		AppName:           getEnv("APP_NAME", "SecureOffice-AI"),
		AppEnv:            getEnv("APP_ENV", "development"),
		AppPort:           getEnv("APP_PORT", "8080"),
		AppDebug:          getEnvAsBool("APP_DEBUG", true),
		DatabaseURL:       getDatabaseURL(),
		RedisHost:         getEnv("REDIS_HOST", "localhost"),
		RedisPort:         getEnv("REDIS_PORT", "6379"),
		MinIOEndpoint:     getEnv("MINIO_ENDPOINT", "localhost:9000"),
		MinIOAccessKey:    getEnv("MINIO_ROOT_USER", "admin_minio"),
		MinIOSecretKey:    getEnv("MINIO_ROOT_PASSWORD", "MinioSecurePass2026!"),
		JWTSecret:         getEnv("JWT_SECRET", "SuperSecretJWTSigningKeyForDevelopmentPurposeOnly2026!"),
		JWTAccessExpMins:  getEnvAsInt("JWT_ACCESS_EXPIRATION_MINUTES", 15),
		JWTRefreshExpDays: getEnvAsInt("JWT_REFRESH_EXPIRATION_DAYS", 7),
	}
}

func getDatabaseURL() string {
	if url := os.Getenv("DATABASE_URL"); url != "" {
		return url
	}
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "secureoffice_app")
	pass := getEnv("DB_PASSWORD", "SecureOfficePass2026!")
	dbname := getEnv("DB_NAME", "secureoffice_db")
	sslmode := getEnv("DB_SSL_MODE", "disable")

	return "postgres://" + user + ":" + pass + "@" + host + ":" + port + "/" + dbname + "?sslmode=" + sslmode
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists && value != "" {
		return value
	}
	return fallback
}

func getEnvAsBool(key string, fallback bool) bool {
	valStr := getEnv(key, "")
	if valStr == "" {
		return fallback
	}
	val, err := strconv.ParseBool(valStr)
	if err != nil {
		return fallback
	}
	return val
}

func getEnvAsInt(key string, fallback int) int {
	valStr := getEnv(key, "")
	if valStr == "" {
		return fallback
	}
	val, err := strconv.Atoi(valStr)
	if err != nil {
		return fallback
	}
	return val
}
