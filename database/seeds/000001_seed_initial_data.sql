-- ==========================================
-- SecureOffice-AI Initial Data Seeder
-- Version: 000001_seed_initial_data.sql
-- Description: Inserter Data Awal Unit Kerja & Pengguna
-- ==========================================

-- 1. Insert Initial Work Units
INSERT INTO work_units (id, unit_code, unit_name, parent_unit_id, security_clearance_level)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'UK-ROOT', 'Kantor Pusat / Sekretariat Utama', NULL, 'SECRET'),
    ('00000000-0000-0000-0000-000000000002', 'UK-SEC-001', 'Bagian Persuratan & Tata Usaha', '00000000-0000-0000-0000-000000000001', 'CONFIDENTIAL'),
    ('00000000-0000-0000-0000-000000000003', 'UK-ITSEC-001', 'Direktorat Keamanan Informasi & IT', '00000000-0000-0000-0000-000000000001', 'SECRET')
ON CONFLICT (unit_code) DO NOTHING;

-- 2. Insert Initial Seed Users (Password Default: PasswordAdmin2026! / Argon2id Hash)
INSERT INTO users (id, work_unit_id, username, email, password_hash, full_name, nip_nik, role, clearance_level, is_active)
VALUES 
    -- System Administrator
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000003', 'admin.sys', 'admin@secureoffice.internal', '$argon2id$v=19$m=65536,t=3,p=4$c2FsdHNhbHRzYWx0$PasswordAdmin2026HashPlaceholder', 'Administrator Sistem', 'NIP-19900101-001', 'ADMIN', 'SECRET', TRUE),
    
    -- Kepala Unit Kerja
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', 'ka.unit.sec', 'ka.unit@secureoffice.internal', '$argon2id$v=19$m=65536,t=3,p=4$c2FsdHNhbHRzYWx0$PasswordHead2026HashPlaceholder', 'Dr. Budi Santoso, M.Si.', 'NIP-19820315-002', 'HEAD_OF_UNIT', 'CONFIDENTIAL', TRUE),
    
    -- Sekretaris Unit
    ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000002', 'sekretaris.sec', 'sekretaris@secureoffice.internal', '$argon2id$v=19$m=65536,t=3,p=4$c2FsdHNhbHRzYWx0$PasswordSec2026HashPlaceholder', 'Siti Rahma, S.AP.', 'NIP-19920720-003', 'SECRETARY', 'CONFIDENTIAL', TRUE),
    
    -- Staf Pelaksana
    ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000002', 'staf.sec', 'staf@secureoffice.internal', '$argon2id$v=19$m=65536,t=3,p=4$c2FsdHNhbHRzYWx0$PasswordStaff2026HashPlaceholder', 'Ahmad Hidayat', 'NIP-19951112-004', 'STAFF', 'RESTRICTED', TRUE),
    
    -- Auditor Sistem
    ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000003', 'auditor.sys', 'auditor@secureoffice.internal', '$argon2id$v=19$m=65536,t=3,p=4$c2FsdHNhbHRzYWx0$PasswordAudit2026HashPlaceholder', 'Eko Prasetyo, CISA', 'NIP-19880909-005', 'AUDITOR', 'SECRET', TRUE)
ON CONFLICT (username) DO NOTHING;
