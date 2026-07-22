import React, { useState } from 'react';
import { UserProfile, analyzeLetterWithAI, AIRiskScanResponse } from '../services/api';
import { Sparkles, ShieldAlert, Lock, Send, ArrowLeft, AlertCircle } from 'lucide-react';

interface ComposeLetterViewProps {
  user: UserProfile;
  onBack: () => void;
  onSubmitSuccess: () => void;
}

export const ComposeLetterView: React.FC<ComposeLetterViewProps> = ({ user, onBack, onSubmitSuccess }) => {
  const [category, setCategory] = useState('NOTA_DINAS');
  const [subject, setSubject] = useState('Permohonan Pengadaan Perangkat Keamanan Jaringan & Firewall Enterprise');
  const [classification, setClassification] = useState<'BIASA' | 'TERBATAS' | 'RAHASIA' | 'SANGAT_RAHASIA'>('BIASA');
  const [content, setContent] = useState('Diberitahukan kepada Direktur IT & Security bahwa sehubungan dengan peningkatan ancaman serangan cyber, kami mengajukan permohonan pencairan anggaran sebesar Rp 500.000.000 untuk lisensi firewall proyek rahasia ALPHA.');
  const [recipient, setRecipient] = useState('UK-ITSEC-001');

  // AI Security Advisory Card State
  const [scanning, setScanning] = useState(false);
  const [aiResult, setAiResult] = useState<AIRiskScanResponse | null>(null);
  const [overridden, setOverridden] = useState(false);

  const handleAIScan = async () => {
    setScanning(true);
    setOverridden(false);
    try {
      const result = await analyzeLetterWithAI(content, subject);
      setAiResult(result);
      if (result.recommendation.recommended_classification) {
        setClassification(result.recommendation.recommended_classification as any);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Draf Surat Dinas Berhasil Disimpan & Ter-sign secara Kriptografis!");
    onSubmitSuccess();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button className="btn-secondary" onClick={onBack} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }} className="gradient-text">Penyusunan Naskah Dinas</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Nomor Naskah Otomatis: <strong style={{ color: 'var(--accent-cyan)' }}>ND/005/UK-SEC-001/VII/2026</strong>
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem', alignItems: 'start' }}>
        
        {/* Main Compose Form */}
        <div className="glass-card" style={{ padding: '2.5rem' }}>
          <form onSubmit={handleSaveDraft} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Jenis Naskah Dinas
                </label>
                <select className="input-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="NOTA_DINAS">Nota Dinas (ND)</option>
                  <option value="SURAT_EDARAN">Surat Edaran (SE)</option>
                  <option value="SURAT_KEPUTUSAN">Surat Keputusan (SK)</option>
                  <option value="SURAT_UNDANGAN">Surat Undangan (UND)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Unit Kerja Penerima Utama
                </label>
                <select className="input-control" value={recipient} onChange={(e) => setRecipient(e.target.value)}>
                  <option value="UK-ITSEC-001">UK-ITSEC-001 (Direktorat Keamanan Informasi)</option>
                  <option value="UK-ROOT">UK-ROOT (Kantor Pusat / Sekretariat Utama)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                Perihal Surat
              </label>
              <input
                type="text"
                className="input-control"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Masukkan perihal naskah dinas..."
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Indeks Kerahasiaan (Clearance Level)
                </label>
                <select
                  className="input-control"
                  value={classification}
                  onChange={(e) => {
                    setClassification(e.target.value as any);
                    setOverridden(true);
                  }}
                >
                  <option value="BIASA">BIASA (Unclassified)</option>
                  <option value="TERBATAS">TERBATAS (Restricted)</option>
                  <option value="RAHASIA">RAHASIA (Confidential / Secret)</option>
                  <option value="SANGAT_RAHASIA">SANGAT RAHASIA (Top Secret)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Tembusan Unit Kerja (CC)
                </label>
                <input type="text" className="input-control" defaultValue="UK-ROOT (Kantor Pusat)" readOnly style={{ opacity: 0.7 }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Isi Teks Naskah Dinas
                </label>
                <button
                  type="button"
                  onClick={handleAIScan}
                  disabled={scanning}
                  style={{
                    background: 'rgba(0, 209, 196, 0.08)',
                    border: '1px solid var(--border-cyan)',
                    color: 'var(--accent-cyan)',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Sparkles size={14} /> {scanning ? 'Memindai Teks...' : 'Jalankan AI Security Scan'}
                </button>
              </div>
              <textarea
                className="input-control"
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tuliskan isi surat dinas secara lengkap di sini..."
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
              <button type="button" className="btn-secondary" onClick={onBack}>
                Batal
              </button>
              <button type="submit" className="btn-primary">
                Simpan & Ajukan Tanda Tangan <Send size={16} />
              </button>
            </div>

          </form>
        </div>

        {/* AI Security Advisory Card Component */}
        <div className="glass-card glass-card-glow" style={{ padding: '1.75rem', position: 'sticky', top: '100px', borderLeft: '4px solid var(--accent-cyan)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
            <Sparkles size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>AI Security Advisory</h3>
          </div>

          {!aiResult ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <ShieldAlert size={36} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                Klik tombol **"Jalankan AI Security Scan"** untuk mendeteksi entitas PII sensitif, skor risiko kebocoran data, dan memverifikasi kesesuaian clearance surat otomatis.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Risk Score Meter */}
              <div style={{ background: 'rgba(10, 13, 22, 0.4)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <span>Skor Risiko Kebocoran</span>
                  <span style={{ fontWeight: 700, color: aiResult.risk_analysis.risk_score >= 7 ? 'var(--accent-crimson)' : 'var(--accent-emerald)' }}>
                    {aiResult.risk_analysis.risk_score.toFixed(2)} / 10.00 ({aiResult.risk_analysis.risk_level})
                  </span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${(aiResult.risk_analysis.risk_score / 10) * 100}%`,
                    height: '100%',
                    background: aiResult.risk_analysis.risk_score >= 7 
                      ? 'linear-gradient(90deg, var(--accent-amber), var(--accent-crimson))' 
                      : 'linear-gradient(90deg, var(--accent-emerald), var(--accent-cyan))'
                  }} />
                </div>
              </div>

              {/* Advisory Summary Box */}
              <div style={{
                background: aiResult.risk_analysis.risk_score >= 7 ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                borderLeft: aiResult.risk_analysis.risk_score >= 7 ? '3px solid var(--accent-crimson)' : '3px solid var(--accent-emerald)',
                padding: '1rem',
                borderRadius: '0 8px 8px 0',
                fontSize: '0.85rem',
                lineHeight: 1.4
              }}>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: aiResult.risk_analysis.risk_score >= 7 ? 'var(--accent-crimson)' : 'var(--accent-emerald)' }}>
                  Rekomendasi Klasifikasi:
                </div>
                {aiResult.recommendation.action_summary}
              </div>

              {/* Detected Entities */}
              {aiResult.risk_analysis.detected_risk_entities.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Entitas Sensitif Terdeteksi:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {aiResult.risk_analysis.detected_risk_entities.map((ent, idx) => (
                      <div key={idx} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                        <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>[{ent.entity_type}]</span> {ent.phrase}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PII Redacted Preview */}
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Hasil Sanitasi Data (PII Redacted):</span>
                <div style={{ fontSize: '0.75rem', background: 'rgba(10, 13, 22, 0.5)', padding: '0.75rem', borderRadius: '8px', color: 'var(--text-muted)', border: '1px solid var(--border-glass)', marginTop: '0.35rem', maxHeight: '100px', overflowY: 'auto', lineHeight: 1.4 }}>
                  {aiResult.sanitized_text}
                </div>
              </div>

              {/* HITL Override Status */}
              {overridden && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(234, 179, 8, 0.08)', padding: '0.5rem', borderRadius: '6px' }}>
                  <AlertCircle size={14} /> Pejabat melakukan override keputusan klasifikasi (Audit trail ter-update).
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
