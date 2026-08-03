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
    // 1. Ensure work_units seed exists to satisfy Foreign Key constraints
    await sql`
      INSERT INTO work_units (id, unit_code, unit_name, security_clearance_level)
      VALUES ('11111111-1111-1111-1111-111111111111'::uuid, 'UK-SEC-001', 'Bagian Persuratan & Tata Usaha', 'CONFIDENTIAL'::clearance_level_type)
      ON CONFLICT (unit_code) DO NOTHING
    `.catch(() => {});

    if (event.httpMethod === 'GET') {
      const rows = await sql`
        SELECT 
          id, letter_number as number, category, classification, status, created_at as date,
          symmetric_envelope_key, encrypted_content_path as fileName
        FROM letters 
        ORDER BY created_at DESC 
        LIMIT 50
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'success', data: rows })
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const {
        number,
        subject,
        category,
        classification,
        encryptedPayload,
        fileName
      } = body;

      const letterNum = number || `ND/${Math.floor(100 + Math.random() * 900)}/UK-SEC-001/VII/2026`;
      const subjStr = subject || 'Naskah Dinas Terenkripsi';
      const classStr = (classification || 'BIASA').toUpperCase();
      const catStr = (category || 'NOTA_DINAS').toUpperCase();

      // Insert letter into Neon PostgreSQL letters table
      await sql`
        INSERT INTO letters (
          letter_number, subject_encrypted, classification, category,
          sender_unit_id, encrypted_content_path, symmetric_envelope_key, content_hash, status
        ) VALUES (
          ${letterNum},
          ${Buffer.from(subjStr)},
          ${classStr}::letter_classification_type,
          ${catStr},
          '11111111-1111-1111-1111-111111111111'::uuid,
          ${fileName || 'Naskah_Dinas.pdf'},
          ${encryptedPayload || ''},
          'sha256-hash-signature',
          'SENT'::letter_status_type
        )
        ON CONFLICT (letter_number) DO NOTHING
      `;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          status: 'success',
          message: 'Surat & berkas terenkripsi berhasil disimpan secara permanen ke Neon PostgreSQL Database!',
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
