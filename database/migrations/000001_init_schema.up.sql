-- ==========================================
-- SecureOffice-AI Database DDL Migration Script
-- Version: 000001_init_schema.up.sql
-- Description: Inisialisasi Skema Database 10 Tabel Utama
-- ==========================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Define Custom Enum Types
CREATE TYPE clearance_level_type AS ENUM (
    'UNCLASSIFIED',
    'RESTRICTED',
    'CONFIDENTIAL',
    'SECRET'
);

CREATE TYPE user_role_type AS ENUM (
    'ADMIN',
    'HEAD_OF_UNIT',
    'SECRETARY',
    'STAFF',
    'AUDITOR'
);

CREATE TYPE key_algorithm_type AS ENUM (
    'Ed25519',
    'X25519',
    'RSA-4096',
    'ML-DSA-PQC',
    'ML-KEM-PQC'
);

CREATE TYPE key_status_type AS ENUM (
    'ACTIVE',
    'REVOKED',
    'EXPIRED'
);

CREATE TYPE letter_classification_type AS ENUM (
    'BIASA',
    'TERBATAS',
    'RAHASIA',
    'SANGAT_RAHASIA'
);

CREATE TYPE letter_status_type AS ENUM (
    'DRAFT',
    'AI_REVIEWING',
    'PENDING_SIGNATURE',
    'SIGNED',
    'SENT',
    'RECEIVED',
    'DISPOSED',
    'ARCHIVED',
    'NEED_REVISION',
    'REJECTED'
);

CREATE TYPE recipient_type_enum AS ENUM (
    'PRIMARY',
    'CC',
    'BCC'
);

CREATE TYPE urgency_level_type AS ENUM (
    'BIASA',
    'SEGERA',
    'AMAT_SEGERA'
);

CREATE TYPE compliance_status_type AS ENUM (
    'COMPLIANT',
    'WARNING',
    'NON_COMPLIANT'
);

-- 3. Create Tables

-- 3.1 Work Units Table
CREATE TABLE work_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_code VARCHAR(50) UNIQUE NOT NULL,
    unit_name VARCHAR(255) NOT NULL,
    parent_unit_id UUID REFERENCES work_units(id) ON DELETE RESTRICT,
    security_clearance_level clearance_level_type NOT NULL DEFAULT 'UNCLASSIFIED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_unit_id UUID NOT NULL REFERENCES work_units(id) ON DELETE RESTRICT,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    nip_nik VARCHAR(50) UNIQUE NOT NULL,
    role user_role_type NOT NULL,
    clearance_level clearance_level_type NOT NULL DEFAULT 'UNCLASSIFIED',
    mfa_secret VARCHAR(255),
    security_pin_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 Hybrid Key Pairs Table
CREATE TABLE hybrid_key_pairs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    algorithm key_algorithm_type NOT NULL,
    public_key_pem TEXT NOT NULL,
    encrypted_private_key TEXT NOT NULL,
    key_fingerprint VARCHAR(128) NOT NULL,
    status key_status_type NOT NULL DEFAULT 'ACTIVE',
    valid_until TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 Letters Table
CREATE TABLE letters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    letter_number VARCHAR(100) UNIQUE NOT NULL,
    subject_encrypted BYTEA NOT NULL,
    classification letter_classification_type NOT NULL,
    category VARCHAR(50) NOT NULL,
    sender_unit_id UUID NOT NULL REFERENCES work_units(id) ON DELETE RESTRICT,
    encrypted_content_path VARCHAR(512) NOT NULL,
    symmetric_envelope_key TEXT NOT NULL,
    content_hash VARCHAR(128) NOT NULL,
    status letter_status_type NOT NULL DEFAULT 'DRAFT',
    revision_notes_encrypted BYTEA,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5 Letter Recipients Table
CREATE TABLE letter_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
    recipient_unit_id UUID NOT NULL REFERENCES work_units(id) ON DELETE RESTRICT,
    recipient_type recipient_type_enum NOT NULL DEFAULT 'PRIMARY',
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6 Letter Attachments Table
CREATE TABLE letter_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
    file_name_encrypted BYTEA NOT NULL,
    blob_storage_path VARCHAR(512) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    encrypted_attachment_key TEXT NOT NULL,
    file_hash VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.7 Dispositions Table
CREATE TABLE dispositions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    target_unit_id UUID REFERENCES work_units(id) ON DELETE RESTRICT,
    target_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    instruction_encrypted BYTEA NOT NULL,
    urgency_level urgency_level_type NOT NULL DEFAULT 'BIASA',
    disposition_date TIMESTAMPTZ DEFAULT NOW()
);

-- 3.8 Digital Signatures Table
CREATE TABLE digital_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
    signer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    signer_key_id UUID NOT NULL REFERENCES hybrid_key_pairs(id) ON DELETE RESTRICT,
    signature_algorithm VARCHAR(50) NOT NULL,
    signature_bytes BYTEA NOT NULL,
    timestamp_token BYTEA NOT NULL,
    signed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.9 AI Risk Analyses Table
CREATE TABLE ai_risk_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
    predicted_category VARCHAR(50) NOT NULL,
    risk_score NUMERIC(4,2) NOT NULL,
    detected_pii_entities JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_classification letter_classification_type NOT NULL,
    compliance_status compliance_status_type NOT NULL DEFAULT 'COMPLIANT',
    analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.10 Audit Logs Table (Tamper-Evident Hash Chaining)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    letter_id UUID REFERENCES letters(id) ON DELETE SET NULL,
    actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(255) NOT NULL,
    previous_hash VARCHAR(128) NOT NULL,
    current_hash VARCHAR(128) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Performance & Query Optimization Indexes
CREATE INDEX idx_work_units_code ON work_units(unit_code);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_work_unit ON users(work_unit_id);
CREATE INDEX idx_letters_number ON letters(letter_number);
CREATE INDEX idx_letters_sender_unit ON letters(sender_unit_id);
CREATE INDEX idx_letters_status ON letters(status);
CREATE INDEX idx_letter_recipients_letter ON letter_recipients(letter_id);
CREATE INDEX idx_letter_recipients_unit ON letter_recipients(recipient_unit_id);
CREATE INDEX idx_dispositions_letter ON dispositions(letter_id);
CREATE INDEX idx_digital_signatures_letter ON digital_signatures(letter_id);
CREATE INDEX idx_audit_logs_letter ON audit_logs(letter_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_hash ON audit_logs(current_hash);
