-- ==========================================
-- SecureOffice-AI Database Rollback Script
-- Version: 000001_init_schema.down.sql
-- Description: Drop 10 Tabel dan Enum Types
-- ==========================================

-- 1. Drop Tables (in reverse dependency order)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS ai_risk_analyses CASCADE;
DROP TABLE IF EXISTS digital_signatures CASCADE;
DROP TABLE IF EXISTS dispositions CASCADE;
DROP TABLE IF EXISTS letter_attachments CASCADE;
DROP TABLE IF EXISTS letter_recipients CASCADE;
DROP TABLE IF EXISTS letters CASCADE;
DROP TABLE IF EXISTS hybrid_key_pairs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS work_units CASCADE;

-- 2. Drop Enum Types
DROP TYPE IF EXISTS compliance_status_type CASCADE;
DROP TYPE IF EXISTS urgency_level_type CASCADE;
DROP TYPE IF EXISTS recipient_type_enum CASCADE;
DROP TYPE IF EXISTS letter_status_type CASCADE;
DROP TYPE IF EXISTS letter_classification_type CASCADE;
DROP TYPE IF EXISTS key_status_type CASCADE;
DROP TYPE IF EXISTS key_algorithm_type CASCADE;
DROP TYPE IF EXISTS user_role_type CASCADE;
DROP TYPE IF EXISTS clearance_level_type CASCADE;
