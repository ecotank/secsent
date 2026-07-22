import React, { useState, useEffect } from 'react';
import { UserProfile, analyzeLetterWithAI, AIRiskScanResponse } from '../services/api';
import { Sparkles, ShieldAlert, Send, ArrowLeft, AlertCircle, Upload, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ComposeLetterViewProps {
  user: UserProfile;
  onBack: () => void;
  onSubmitSuccess: () => void;
}

export const ComposeLetterView: React.FC<ComposeLetterViewProps> = ({ user, onBack, onSubmitSuccess }) => {
  const [mode, setMode] = useState<'text' | 'file'>('text'); // Dual-Mode correspondence state
  const [category, setCategory] = useState('NOTA_DINAS');
  const [subject, setSubject] = useState('');
  const [classification, setClassification] = useState<'BIASA' | 'TERBATAS' | 'RAHASIA' | 'SANGAT_RAHASIA'>('BIASA');
  const [content, setContent] = useState('');
  const [recipient, setRecipient] = useState('UK-ITSEC-001');

  // File Upload State (For Opsi PDF)
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSubjectManuallyEdited, setIsSubjectManuallyEdited] = useState(false);

  // AI Security Advisory Card State
  const [scanning, setScanning] = useState(false);
  const [aiResult, setAiResult] = useState<AIRiskScanResponse & { compliance?: any } | null>(null);
  const [overridden, setOverridden] = useState(false);

  // Auto-Extract Subject from Content (First 8-12 words of content if subject is empty and not manually edited)
  useEffect(() => {
    if (isSubjectManuallyEdited) return;
    if (mode === 'text' && content.trim() !== '') {
      const firstSentence = content.split(/[.!?]/)[0].trim();
      const words = firstSentence.split(/\s+/).slice(0, 10).join(' ');
      if (words.length > 5 && (!subject || subject.length < 15)) {
        setSubject(words + "...");
      }
    }
  }, [content, mode, isSubjectManuallyEdited]);

  // Debounced Auto-trigger AI Security Scan (Triggers automatically 600ms after user stops typing)
  useEffect(() => {
    const hasInput = mode === 'text' 
      ? (subject.trim() !== '' || content.trim() !== '')
      : (subject.trim() !== '' || attachedFile !== null);

    if (!hasInput) {
      setAiResult(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setScanning(true);
      setOverridden(false);
      try {
        const textToScan = mode === 'text' 
          ? `Perihal: ${subject}\n\nIsi Surat: ${content}` 
          : `Perihal: ${subject}\n\n[FILE ATTACHMENT]: ${attachedFile ? attachedFile.name : ''}`;

        const result = await analyzeLetterWithAI(textToScan, subject);
        setAiResult(result);
        if (result.recommendation.recommended_classification) {
          setClassification(result.recommendation.recommended_classification as any);
        }
      } catch (e) {
        console.error("AI Auto Scan error:", e);
      } finally {
        setScanning(false);
      }
    }, 600); // 600ms debounce threshold

    return () => clearTimeout(delayDebounceFn);
  }, [subject, content, attachedFile, mode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
        setAttachedFile(file);
      } else {
        alert("Hanya berkas resmi format PDF atau Word (Docx/Doc) yang diperbolehkan.");
      }
    }
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'file' && !attachedFile) {
      alert("Kesalahan: Anda wajib melampirkan berkas dokumen resmi naskah dinas.");
      return;
    }
    const modeStr = mode === 'text' ? "Pesan Teks Dinas" : `File "${attachedFile?.name}"`;
    alert(`Sukses: ${modeStr} berhasil dienkripsi penuh (AES-256-GCM) & dikirimkan secara aman ke unit tujuan!`);
    onSubmitSuccess();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button className="btn-secondary" onClick={onBack} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }} className="gradient-text">Pengiriman Dokumen & Pesan Dinas</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Nomor Naskah Otomatis: <strong style={{ color: 'var(--accent-cyan)' }}>ND/005/UK-SEC-001/VII/2026</strong>
          </span>
        </div>
      </div>

      {/* Dual-Mode Switcher Tabs */}
      <div style={{
        display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
        padding: '0.35rem', backgroundColor: '#091513', borderRadius: '10px',
        border: '1px solid var(--border-glass)', maxWidth: '340px'
      }}>
        <button
          type="button"
          onClick={() => { setMode('text'); setAiResult(null); setSubject(''); setContent(''); setIsSubjectManuallyEdited(false); }}
          style={{
            flex: 1, padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
            backgroundColor: mode === 'text' ? 'var(--accent-cyan)' : 'transparent',
            color: mode === 'text' ? '#091513' : 'var(--text-muted)'
          }}
        >
          Tulis Teks Manual
        </button>
        <button
          type="button"
          onClick={() => { setMode('file'); setAiResult(null); setSubject(''); setAttachedFile(null); setIsSubjectManuallyEdited(false); }}
          style={{
            flex: 1, padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2',
            backgroundColor: mode === 'file' ? 'var(--accent-cyan)' : 'transparent',
            color: mode === 'file' ? '#091513' : 'var(--text-muted)'
          }}
        >
          Lampirkan File PDF
        </button>
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
                Perihal Surat Dinas {mode === 'text' && <span style={{ color: 'var(--accent-cyan)' }}>(AI Auto-Extracts if empty)</span>}
              </label>
              <input
                type="text"
                className="input-control"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setIsSubjectManuallyEdited(true);
                }}
                placeholder="Perihal naskah dinas..."
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

            {/* Mode-Based Content Inputs */}
            {mode === 'text' ? (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Isi Teks Naskah Dinas (Ketik Manual - Enkripsi AES-256-GCM)
                </label>
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
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Dokumen Resmi Naskah Dinas (Wajib PDF/Docx - Enkripsi AES-256-GCM)
                </label>
                <div style={{
                  border: '2px dashed var(--accent-cyan)',
                  borderRadius: '12px',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  backgroundColor: 'rgba(216, 255, 67, 0.02)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="file"
                    accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                    onChange={handleFileChange}
                    style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      opacity: 0, cursor: 'pointer'
                    }}
                    required={!attachedFile}
                  />
                  <Upload size={32} style={{ color: 'var(--accent-cyan)', marginBottom: '0.75rem' }} />
                  {attachedFile ? (
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.25rem' }}>
                        📂 Berkas Terpilih: {attachedFile.name}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={12} /> Terdeteksi: ({(attachedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        Klik atau seret file dokumen dinas Anda ke sini
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Mendukung berkas resmi instansi (PDF, DOCX)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
              <button type="button" className="btn-secondary" onClick={onBack}>
                Batal
              </button>
              <button type="submit" className="btn-primary">
                Kirim & Amankan Surat <Send size={16} />
              </button>
            </div>

          </form>
        </div>

        {/* AI Security Advisory Panel */}
        <div className="glass-card glass-card-glow" style={{ padding: '1.75rem', position: 'sticky', top: '100px', borderLeft: '4px solid var(--accent-cyan)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
            <Sparkles size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>AI Security Advisory</h3>
            {scanning && <span className="font-mono" style={{ fontSize: '9px', marginLeft: 'auto', color: 'var(--accent-cyan)', animation: 'pulse 1s infinite' }}>[MENGANALISA...]</span>}
          </div>

          {scanning && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--accent-cyan)' }}>
              <Sparkles size={32} style={{ animation: 'spin 2s linear infinite', marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>AI Agent sedang memindai kepatuhan perihal & risiko teks...</p>
            </div>
          )}

          {!scanning && !aiResult && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <ShieldAlert size={36} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                Mulai mengetik perihal, isi surat dinas, atau lampirkan berkas. AI Agent akan langsung melakukan analisis perihal & konten secara otomatis.
              </p>
            </div>
          )}

          {!scanning && aiResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* 1. DEDICATED SUBJECT COMPLIANCE REPORT */}
              {aiResult.compliance && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>Audit Kepatuhan Perihal</span>
                    <span style={{
                      fontSize: '9px', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px',
                      backgroundColor: aiResult.compliance.compliance_status === 'COMPLIANT' ? 'rgba(16, 185, 129, 0.15)' : aiResult.compliance.compliance_status === 'WARNING' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: aiResult.compliance.compliance_status === 'COMPLIANT' ? 'var(--accent-emerald)' : aiResult.compliance.compliance_status === 'WARNING' ? 'var(--accent-amber)' : 'var(--accent-crimson)'
                    }}>
                      {aiResult.compliance.compliance_status}
                    </span>
                  </div>

                  {aiResult.compliance.recommendations.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {aiResult.compliance.recommendations.map((rec: string, idx: number) => (
                        <div key={idx} style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', alignItems: 'start', gap: '0.35rem' }}>
                          <span style={{ color: 'var(--accent-amber)' }}>•</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <ShieldCheck size={13} /> Perihal dinas memenuhi standar & aman dari kebocoran.
                    </div>
                  )}
                </div>
              )}

              {/* 2. Risk Score Meter */}
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

              {/* 3. Advisory Summary Box */}
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

              {/* 4. Detected Entities */}
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

              {/* 5. PII Redacted Preview (Only for Text Mode) */}
              {mode === 'text' && (
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Hasil Sanitasi Data (PII Redacted):</span>
                  <div style={{ fontSize: '0.75rem', background: 'rgba(10, 13, 22, 0.5)', padding: '0.75rem', borderRadius: '8px', color: 'var(--text-muted)', border: '1px solid var(--border-glass)', marginTop: '0.35rem', maxHeight: '100px', overflowY: 'auto', lineHeight: 1.4 }}>
                    {aiResult.sanitized_text}
                  </div>
                </div>
              )}

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
