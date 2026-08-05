-- ==========================================
-- SecSent Seed Data Script for Neon PostgreSQL
-- File: database/seeds/000002_seed_data.sql
-- ==========================================

-- 1. Insert Baintelkam Polri Work Units
INSERT INTO work_units (id, unit_code, unit_name, security_clearance_level) VALUES
('b1111111-1111-1111-1111-111111111111', 'UK-PIMPINAN', 'Pimpinan Baintelkam Polri', 'SECRET'),
('b2222222-2222-2222-2222-222222222222', 'UK-RORENMIN', 'Biro Perencanaan & Administrasi', 'CONFIDENTIAL'),
('b3333333-3333-3333-3333-333333333333', 'UK-ROANALIS', 'Biro Analisis Baintelkam', 'SECRET'),
('b4444444-4444-4444-4444-444444444444', 'UK-DITPOLITIK', 'Direktorat Politik Baintelkam', 'SECRET'),
('b5555555-5555-5555-5555-555555555555', 'UK-DITEKONOMI', 'Direktorat Ekonomi Baintelkam', 'SECRET'),
('b6666666-6666-6666-6666-666666666666', 'UK-DITSOSBUD', 'Direktorat Sosial Budaya Baintelkam', 'SECRET'),
('b7777777-7777-7777-7777-777777777777', 'UK-DITKAMNEG', 'Direktorat Keamanan Negara Baintelkam', 'SECRET'),
('b8888888-8888-8888-8888-888888888888', 'UK-DITKAMSUS', 'Direktorat Keamanan Khusus Baintelkam', 'SECRET'),
('b9999999-9999-9999-9999-999999999999', 'UK-INTELTEK', 'Bidang Intelijen Teknis Baintelkam', 'SECRET'),
('baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'UK-YANMAS', 'Bidang Pelayanan Masyarakat Baintelkam', 'RESTRICTED'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'UK-BIDSANDI', 'Bidang Sandi & Kriptografi Baintelkam', 'SECRET'),

-- Legacy Demo Units (To prevent backward compatibility breaking)
('11111111-1111-1111-1111-111111111111', 'UK-SEC-001', 'Bagian Persuratan & Tata Usaha', 'CONFIDENTIAL'),
('22222222-2222-2222-2222-222222222222', 'UK-ITSEC-001', 'Direktorat Keamanan Informasi & Cyber', 'SECRET'),
('33333333-3333-3333-3333-333333333333', 'UK-ROOT', 'Kantor Pusat / Sekretariat Utama', 'UNCLASSIFIED')
ON CONFLICT (unit_code) DO NOTHING;

-- 2. Insert Baintelkam Polri Users
INSERT INTO users (id, work_unit_id, username, email, password_hash, full_name, nip_nik, role, clearance_level) VALUES
-- Pimpinan
('ba111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'kabaintelkam', 'kabaintelkam@baintelkam.polri.go.id', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Komjen Pol. Dr. H. Mohammad Adil, S.H.', 'NIP-19700512-001', 'HEAD_OF_UNIT', 'SECRET'),
('ba222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'wakabaintelkam', 'wakabaintelkam@baintelkam.polri.go.id', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Irjen Pol. Drs. Sunardi, M.Si.', 'NIP-19720822-002', 'AUDITOR', 'SECRET'),

-- Pembantu Pimpinan & Staf Administratif
('ba333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', 'karorenmin', 'karorenmin@baintelkam.polri.go.id', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Brigjen Pol. Drs. Ahmad Syarif, M.B.A.', 'NIP-19750915-003', 'HEAD_OF_UNIT', 'CONFIDENTIAL'),
('ba444444-4444-4444-4444-444444444444', 'b3333333-3333-3333-3333-333333333333', 'karoanalis', 'karoanalis@baintelkam.polri.go.id', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Brigjen Pol. Ir. H. Mulyadi, M.Si.', 'NIP-19741002-004', 'HEAD_OF_UNIT', 'SECRET'),

-- Unsur Pelaksana Tugas Pokok (Direktur Operasional)
('ba555555-5555-5555-5555-555555555555', 'b4444444-4444-4444-4444-444444444444', 'dir.politik', 'dir.politik@baintelkam.polri.go.id', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Brigjen Pol. Hendra Gunawan, S.H.', 'NIP-19760315-005', 'HEAD_OF_UNIT', 'SECRET'),
('ba666666-6666-6666-6666-666666666666', 'b5555555-5555-5555-5555-555555555555', 'dir.ekonomi', 'dir.ekonomi@baintelkam.polri.go.id', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Brigjen Pol. Dr. Edi Wahyono, S.E., M.Si.', 'NIP-19751121-006', 'HEAD_OF_UNIT', 'SECRET'),
('ba777777-7777-7777-7777-777777777777', 'b6666666-6666-6666-6666-666666666666', 'dir.sosbud', 'dir.sosbud@baintelkam.polri.go.id', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Brigjen Pol. Drs. FX. Bagus, M.H.', 'NIP-19760723-007', 'HEAD_OF_UNIT', 'SECRET'),
('ba888888-8888-8888-8888-888888888888', 'b7777777-7777-7777-7777-777777777777', 'dir.kamneg', 'dir.kamneg@baintelkam.polri.go.id', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Brigjen Pol. Drs. Yudi Hermawan, M.Si.', 'NIP-19750518-008', 'HEAD_OF_UNIT', 'SECRET'),
('ba999999-9999-9999-9999-999999999999', 'b8888888-8888-8888-8888-888888888888', 'dir.kamsus', 'dir.kamsus@baintelkam.polri.go.id', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Brigjen Pol. Ir. Rian Hidayat, M.Sc.', 'NIP-19770214-009', 'HEAD_OF_UNIT', 'SECRET'),

-- Urusan Tata Usaha & Agen Pelaksana
('baaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb', 'b8888888-8888-8888-8888-888888888888', 'urtu.kamsus', 'urtu.kamsus@baintelkam.polri.go.id', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Aipda Joko Susilo', 'NIP-19850315-010', 'SECRETARY', 'CONFIDENTIAL'),
('baaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'b8888888-8888-8888-8888-888888888888', 'cyber.intel', 'cyber.intel@baintelkam.polri.go.id', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Brigadir Rian Firmansyah', 'NIP-19920412-011', 'STAFF', 'SECRET'),

-- Unsur Pendukung Operasional (Admin Sandi)
('bacccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'admin.sandi', 'admin.sandi@baintelkam.polri.go.id', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Kombes Pol. Dr. Crypto Widjojo, M.T.', 'NIP-19730510-012', 'ADMIN', 'SECRET'),

-- Legacy Demo Accounts
('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'ka.unit.sec', 'ka.unit.sec@secsent.internal', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Dr. Budi Santoso, M.Si.', 'NIP-19800101-001', 'HEAD_OF_UNIT', 'CONFIDENTIAL'),
('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'sekretaris.sec', 'sekretaris.sec@secsent.internal', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Siti Rahma, S.AP.', 'NIP-19850202-002', 'SECRETARY', 'RESTRICTED'),
('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'staf.sec', 'staf.sec@secsent.internal', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Ahmad Hidayat, S.Kom.', 'NIP-19900303-003', 'STAFF', 'UNCLASSIFIED'),
('a4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'dir.itsec', 'dir.itsec@secsent.internal', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Ir. Hendra Wijaya, M.T.', 'NIP-19780404-004', 'HEAD_OF_UNIT', 'SECRET'),
('a5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'admin.sys', 'admin.sys@secsent.internal', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Administrator Utama', 'NIP-19800505-005', 'ADMIN', 'SECRET'),
('a6666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'auditor.sys', 'auditor.sys@secsent.internal', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Auditor Keamanan Utama', 'NIP-19800606-006', 'AUDITOR', 'SECRET')
ON CONFLICT (username) DO NOTHING;

-- 3. Insert Initial Letters
INSERT INTO letters (
  id, letter_number, subject_encrypted, classification, category, sender_unit_id,
  encrypted_content_path, symmetric_envelope_key, content_hash, status
) VALUES
(
  '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  'ND/001/UK-SEC-001/VII/2026',
  '\x5065726d6f686f6e616e2050656e67616461616e20506572616e676b6174204b65616d616e616e204a6172696e67616e2026204669726577616c6c20456e7465727072697365',
  'RAHASIA',
  'NOTA_DINAS',
  '11111111-1111-1111-1111-111111111111',
  'ND_Pengadaan_Firewall_Enterprise.pdf',
  '-----BEGIN SECSENT ENVELOPE KEY-----\nKey-Algorithm: X25519-AES256GCM\nCipher-DEK: 8f4e3c2b1a9f0d8e7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d\n-----END SECSENT ENVELOPE KEY-----',
  '8f4e3c2b1a9f0d8e7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d',
  'SENT'
),
(
  '8a2ceb3c-2a6c-3aac-8acc-1a0c6a2cba5c',
  'SE/004/UK-ROOT/VII/2026',
  '\x48696d626175616e204b657061747568616e2050726f746f6b6f6c204b65616d616e616e20496e666f726d617369',
  'BIASA',
  'SURAT_EDARAN',
  '33333333-3333-3333-3333-333333333333',
  'Himbauan_Keamanan_Informasi.pdf',
  '-----BEGIN SECSENT ENVELOPE KEY-----\nKey-Algorithm: X25519-AES256GCM\nCipher-DEK: 7a3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d\n-----END SECSENT ENVELOPE KEY-----',
  '7a3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d',
  'SENT'
)
ON CONFLICT (letter_number) DO NOTHING;

-- 4. Insert Initial Hash-Chained Audit Logs
INSERT INTO audit_logs (actor_user_id, action, ip_address, user_agent, previous_hash, current_hash) VALUES
(
  'ba111111-1111-1111-1111-111111111111',
  'INITIALIZE_SYSTEM_DATABASE_SCHEMA',
  '127.0.0.1',
  'SecSent Migration Engine v1.0.0',
  '0000000000000000000000000000000000000000000000000000000000000000',
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
);
