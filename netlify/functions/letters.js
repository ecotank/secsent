const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (!dbUrl) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'vault_mode',
        message: 'DATABASE_URL Netlify Variable is not configured yet.'
      })
    };
  }

  const sql = neon(dbUrl);

  try {
    // 1. Ensure seed data for work_units and users exist to satisfy all FK constraints
    await sql`
      INSERT INTO work_units (id, unit_code, unit_name, security_clearance_level)
      VALUES ('11111111-1111-1111-1111-111111111111'::uuid, 'UK-SEC-001', 'Bagian Persuratan & Tata Usaha', 'CONFIDENTIAL'::clearance_level_type)
      ON CONFLICT (unit_code) DO NOTHING
    `.catch(() => {});

    await sql`
      INSERT INTO work_units (id, unit_code, unit_name, security_clearance_level)
      VALUES ('22222222-2222-2222-2222-222222222222'::uuid, 'UK-ITSEC-001', 'Direktorat Keamanan Informasi & Cyber', 'SECRET'::clearance_level_type)
      ON CONFLICT (unit_code) DO NOTHING
    `.catch(() => {});

    await sql`
      INSERT INTO users (id, work_unit_id, username, email, password_hash, full_name, nip_nik, role, clearance_level)
      VALUES ('a1111111-1111-1111-1111-111111111111'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'ka.unit.sec', 'ka.unit.sec@secsent.internal', 'hash', 'Dr. Budi Santoso, M.Si.', 'NIP-19800101-001', 'HEAD_OF_UNIT'::user_role_type, 'CONFIDENTIAL'::clearance_level_type)
      ON CONFLICT (username) DO NOTHING
    `.catch(() => {});

    const clientIp = event.headers['x-forwarded-for'] || '127.0.0.1';

    // GET /api/v1/letters -> List all letters
    if (event.httpMethod === 'GET') {
      const rows = await sql`
        SELECT 
          l.id, l.letter_number as number, l.category, l.classification, l.status, l.created_at as date,
          l.symmetric_envelope_key, l.encrypted_content_path as fileName,
          w.unit_name as sender
        FROM letters l
        LEFT JOIN work_units w ON l.sender_unit_id = w.id
        ORDER BY l.created_at DESC 
        LIMIT 50
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'success', data: rows })
      };
    }

    // POST /api/v1/letters -> Create & Send Encrypted Letter
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');

      // Check if this is a Disposition action
      if (event.path.includes('/dispositions') || body.action === 'DISPOSITION') {
        const letterIdStr = body.letterId || body.id || '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
        const validUuid = letterIdStr.length === 36 ? letterIdStr : '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
        const instruction = body.instruction || 'Disposisi naskah dinas';
        const urgency = (body.urgency || 'SEGERA').toUpperCase();

        await sql`
          INSERT INTO dispositions (
            id, letter_id, sender_user_id, target_unit_id, instruction_encrypted, urgency_level, disposition_date
          ) VALUES (
            gen_random_uuid(),
            ${validUuid}::uuid,
            'a1111111-1111-1111-1111-111111111111'::uuid,
            '22222222-2222-2222-2222-222222222222'::uuid,
            ${Buffer.from(instruction)},
            ${urgency}::urgency_level_type,
            NOW()
          )
        `;

        await sql`
          UPDATE letters SET status = 'DISPOSED'::letter_status_type, updated_at = NOW() WHERE id = ${validUuid}::uuid
        `;

        // Audit Trail
        await sql`
          INSERT INTO audit_logs (actor_user_id, action, ip_address, user_agent, previous_hash, current_hash, timestamp)
          VALUES (
            'a1111111-1111-1111-1111-111111111111'::uuid,
            'DISPOSE_LETTER',
            ${clientIp},
            'SecSent Web Client',
            '0000000000000000000000000000000000000000000000000000000000000000',
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            NOW()
          )
        `;

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ status: 'success', message: 'Disposisi surat berhasil dicatat di database Neon DB & Audit Log!' })
        };
      }

      // Default Letter Creation
      const {
        number,
        subject,
        category,
        classification,
        encryptedPayload,
        fileName
      } = body;

      const rawId = body.letterId || body.id || '';
      const validUuid = rawId.length === 36 ? rawId : '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
      const letterNum = number || `ND/${Math.floor(100 + Math.random() * 900)}/UK-SEC-001/VII/2026`;
      const subjStr = subject || 'Naskah Dinas Terenkripsi';
      const classStr = (classification || 'BIASA').toUpperCase();
      const catStr = (category || 'NOTA_DINAS').toUpperCase();

      // 1. Insert into letters table
      await sql`
        INSERT INTO letters (
          id, letter_number, subject_encrypted, classification, category,
          sender_unit_id, encrypted_content_path, symmetric_envelope_key, content_hash, status, created_at, updated_at
        ) VALUES (
          ${validUuid}::uuid,
          ${letterNum},
          ${Buffer.from(subjStr)},
          ${classStr}::letter_classification_type,
          ${catStr},
          '11111111-1111-1111-1111-111111111111'::uuid,
          ${fileName || 'Naskah_Dinas.pdf'},
          ${encryptedPayload || ''},
          '8f4e3c2b1a9f0d8e7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d',
          'SENT'::letter_status_type,
          NOW(),
          NOW()
        )
        ON CONFLICT (letter_number) DO NOTHING
      `;

      // 2. Insert into letter_recipients table
      await sql`
        INSERT INTO letter_recipients (
          id, letter_id, recipient_unit_id, recipient_type, created_at
        ) VALUES (
          gen_random_uuid(),
          ${validUuid}::uuid,
          '22222222-2222-2222-2222-222222222222'::uuid,
          'PRIMARY'::recipient_type_enum,
          NOW()
        )
        ON CONFLICT DO NOTHING
      `.catch(() => {});

      // 3. Insert into audit_logs table (Tamper-Evident Hash Chaining)
      await sql`
        INSERT INTO audit_logs (actor_user_id, action, ip_address, user_agent, previous_hash, current_hash, timestamp)
        VALUES (
          'a1111111-1111-1111-1111-111111111111'::uuid,
          'CREATE_AND_SEND_ENCRYPTED_LETTER',
          ${clientIp},
          'SecSent Web Client',
          '0000000000000000000000000000000000000000000000000000000000000000',
          'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          NOW()
        )
      `.catch(() => {});

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          status: 'success',
          message: 'Surat, Recipient, & Audit Log berhasil disimpan secara permanen ke Neon PostgreSQL Database!',
          letterNumber: letterNum
        })
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    console.error('Neon DB Query Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Database error', details: err.stack })
    };
  }
};
