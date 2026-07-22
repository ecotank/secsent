from app.schemas.contracts import ComplianceRequest, ComplianceResponse


class ComplianceAuditorAgent:
    """Agent 3: Advanced Compliance Auditor Agent (Tata Naskah Dinas & Subject Leak Inspector)"""

    def __init__(self):
        # Formal noun prefixes matching Indonesian State Archive (ANRI) regulations
        self.formal_prefixes = [
            "permohonan", "himbauan", "pemberitahuan", "laporan", "keputusan",
            "undangan", "nota", "rencana", "usulan", "persetujuan", "instruksi",
            "evaluasi", "pelaksanaan", "pengadaan", "pengangkatan", "penunjukan"
        ]

        # Sensitive keywords that must NEVER be written in plain-text subject lines
        self.forbidden_subject_keywords = [
            "password", "private key", "token", "kunci enkripsi", "sandi negara",
            "api key", "credential", "exploit", "bug bounty", "rahasia negara"
        ]

    def audit(self, request: ComplianceRequest) -> ComplianceResponse:
        missing_elements = []
        recommendations = []
        status = "COMPLIANT"

        subject = request.header_metadata.subject
        if not subject:
            return ComplianceResponse(
                letter_id=request.letter_id,
                compliance_status="NON_COMPLIANT",
                missing_elements=["SUBJECT_MISSING"],
                recommendations=["Perihal naskah dinas wajib diisi."]
            )

        subject_lower = subject.lower()

        # 1. Subject Length Assessment (Tata Naskah Dinas ANRI)
        if len(subject.strip()) < 15:
            missing_elements.append("SUBJECT_TOO_SHORT")
            recommendations.append("Perihal terlalu singkat. Harus menggambarkan garis besar maksud surat secara deskriptif (minimal 15 karakter).")

        if len(subject.strip()) > 100:
            missing_elements.append("SUBJECT_TOO_LONG")
            recommendations.append("Perihal terlalu panjang (maksimal 100 karakter). Ringkas perihal agar fokus pada pokok bahasan.")

        # 2. Formal Vocabulary Validation
        has_formal_prefix = any(subject_lower.startswith(prefix) for prefix in self.formal_prefixes) or \
                             any(prefix in subject_lower for prefix in self.formal_prefixes[:5])
        if not has_formal_prefix:
            missing_elements.append("NON_FORMAL_SUBJECT")
            recommendations.append("Gunakan kata benda formal kedinasan pada awal perihal (misal: 'Permohonan...', 'Pemberitahuan...', 'Laporan...').")

        # 3. plain-text Leakage Assessment (High Security)
        leaked_keywords = [kw for kw in self.forbidden_subject_keywords if kw in subject_lower]
        if leaked_keywords:
            status = "NON_COMPLIANT"
            missing_elements.append("SUBJECT_INFORMATION_LEAK")
            recommendations.append(f"Kritis: Perihal memuat kata kunci berisiko tinggi ({', '.join(leaked_keywords)}). Pindahkan rincian ini ke isi dokumen terenkripsi.")

        if missing_elements and status != "NON_COMPLIANT":
            status = "WARNING" if len(missing_elements) == 1 else "NON_COMPLIANT"

        return ComplianceResponse(
            letter_id=request.letter_id,
            compliance_status=status,
            missing_elements=missing_elements,
            recommendations=recommendations
		)
