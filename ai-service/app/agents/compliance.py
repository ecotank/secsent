from app.schemas.contracts import ComplianceRequest, ComplianceResponse


class ComplianceAuditorAgent:
    """Agent 3: Compliance Auditor Agent (Tata Naskah Dinas Checker)"""

    def audit(self, request: ComplianceRequest) -> ComplianceResponse:
        missing_elements = []
        recommendations = []

        header = request.header_metadata

        if not header.letter_number or header.letter_number == "ND/DRAFT/2026":
            missing_elements.append("OFFICIAL_LETTER_NUMBER_FINAL")
            recommendations.append("Pastikan nomor surat resmi telah difinalisasi oleh Letter Numbering Engine.")

        if not header.subject or len(header.subject.strip()) < 5:
            missing_elements.append("SUBJECT_DESCRIPTIVE")
            recommendations.append("Perihal surat harus memuat ringkasan maksud surat yang cukup jelas.")

        status = "COMPLIANT"
        if missing_elements:
            status = "WARNING" if len(missing_elements) == 1 else "NON_COMPLIANT"

        return ComplianceResponse(
            letter_id=request.letter_id,
            compliance_status=status,
            missing_elements=missing_elements,
            recommendations=recommendations
        )
