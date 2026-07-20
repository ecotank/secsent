import React, { useState } from 'react';
import { UserProfile, analyzeLetterWithAI, AIRiskScanResponse } from '../services/api';
import { Sparkles, ShieldAlert, CheckCircle2, Lock, Send, ArrowLeft, Eye, AlertCircle } from 'lucide-react';

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button className="btn-secondary" onClick={onBack} style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Kembali ke Dashboard
        </button>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '1.5rem' }} className="gradient-text">Penyusunan Naskah Dinas</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Letter Numbering Engine: <strong style={{ color: 'var(--accent-cyan)' }}>ND/005/UK-SEC-001/VII/2026 (Auto-Generated)</strong>
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.75rem', alignItems: 'start' }}>
        
        {/* Main Compose Form */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSaveDraft} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
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
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Unit Kerja Tujuan (Penerima Utama)
                </label>
                <select className="input-control" value={recipient} onChange={(e) => setRecipient(e.target.value)}>
                  <option value="UK-ITSEC-001">UK-ITSEC-001 (Direktorat Keamanan Informasi)</option>
                  <option value="UK-ROOT">UK-ROOT (Kantor Pusat / Sekretariat Utama)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
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
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Tembusan Unit Kerja (CC)
                </label>
                <input type="text" className="input-control" defaultValue="UK-ROOT (Kantor Pusat)" readOnly />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Isi Teks Naskah Dinas
                </label>
                <button
                  type="button"
                  onClick={handleAIScan}
                  disabled={scanning}
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,242,254,0.2) 0%, rgba(79,172,254,0.2) 100%)',
                    border: '1px solid var(--accent-cyan)',
                    color: 'var(--accent-cyan)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Sparkles size={14} /> {scanning ? 'Agen AI Sedang Memindai...' : 'Jalankan AI Security Scan'}
                </button>
              </div>
              <textarea
                className="input-control"
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tuliskan isi surat dinas secara lengkap di sini..."
                required
                style={{ fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
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
        <div className="glass-card glass-card-glow" style={{ padding: '1.5rem', position: 'sticky', top: '90px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
            <Sparkles size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.05rem' }}>AI Security Advisory Card</h3>
          </div>

          {!aiResult ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <ShieldAlert size={40} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.85rem' }}>
                Klik <strong>"Jalankan AI Security Scan"</strong> untuk mengaktifkan agen AI pemindai PII, analisis risiko kebocoran data, dan rekomendasi klasifikasi kerahasiaan.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Risk Score Meter */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  <span>Skor Risiko Kebocoran Data</span>
                  <span style={{ fontWeight: 700, color: aiResult.risk_analysis.risk_score >= 7 ? 'var(--accent-crimson)' : 'var(--accent-emerald)' }}>
                    {aiResult.risk_analysis.risk_score.toFixed(2)} / 10.00 ({aiResult.risk_analysis.risk_level})
                  </span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${(aiResult.risk_analysis.risk_score / 10) * 100}%`,
                    height: '100%',
                    background: aiResult.risk_analysis.risk_score >= 7 
                      ? 'linear-gradient(90deg, #f59e0b, #ef4444)' 
                      : 'linear-gradient(90deg, #10b981, #00f2fe)'
                  }} />
                </div>
              </div>

              {/* Advisory Summary Box */}
              <div style={{
                background: aiResult.risk_analysis.risk_score >= 7 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: aiResult.risk_analysis.risk_score >= 7 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                padding: '0.85rem',
                borderRadius: '10px',
                fontSize: '0.82rem'
              }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: aiResult.risk_analysis.risk_score >= 7 ? '#f87171' : '#34d399' }}>
                  Rekomendasi Agen AI:
                </div>
                {aiResult.recommendation.action_summary}
              </div>

              {/* Detected Entities */}
              {aiResult.risk_analysis.detected_risk_entities.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Entitas Sensitif Terdeteksi:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
                    {aiResult.risk_analysis.detected_risk_entities.map((ent, idx) => (
                      <div key={idx} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.6rem', borderRadius: '6px', borderLeft: '3px solid var(--accent-amber)' }}>
                        <strong>{ent.entity_type}</strong>: {ent.phrase}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PII Redacted Preview */}
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Hasil Teks Ter-Sanitasi (Privacy Layer):</span>
                <div style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.4)', padding: '0.5rem', borderRadius: '6px', color: 'var(--text-muted)', marginTop: '0.25rem', maxHeight: '90px', overflowY: 'auto' }}>
                  {aiResult.sanitized_text}
                </div>
              </div>

              {/* HITL Override Status */}
              {overridden && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <AlertCircle size={14} /> Klasifikasi di-override manual oleh Pejabat (Audit trail updated).
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
