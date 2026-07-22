import re
from app.schemas.contracts import RiskAnalyzerRequest, RiskAnalyzerResponse, RiskEntity


class AIRiskAnalyzerAgent:
    """Agent 2: Advanced AI Risk Analyzer Agent (Comprehensive Data Leakage & Severity Scoring)"""

    def __init__(self):
        # Expanded multi-tier dictionary containing Indonesian & English strategic keywords
        self.high_severity_patterns = [
            ("INTEL_MILITARY", r"\bintelijen\b|\bmiliter\b|\bsandi\b|\balutsista\b|\boperasi keamanan\b|\bkomando\b|\bsatgas\b|\brahasia negara\b"),
            ("CYBER_VULNERABILITY", r"\bexploit\b|\bperetasan\b|\bkebocoran data\b|\bkerentanan\b|\bserangan cyber\b|\bhacker\b|\bbug bounty\b"),
            ("SYSTEM_CREDENTIALS", r"\bpassword\b|\bprivate key\b|\btoken akses\b|\bapi key\b|\bcredential\b|\bpassphrase\b|\bkunci enkripsi\b"),
            ("LEGAL_INVESTIGATION", r"\bpenyidikan\b|\btipikor\b|\btersangka\b|\bkasus hukum\b|\bbap\b|\bkorupsi\b|\bsurat perintah penyidikan\b"),
            ("HIGH_SECRET_LABEL", r"\brahasia\b|\bsecret\b|\btop secret\b|\bsangat rahasia\b|\bconfidential\b")
        ]

        self.medium_severity_patterns = [
            ("FINANCIAL_PROCUREMENT", r"\banggaran\b|\bbiaya proyek\b|\bpencairan dana\b|\btender\b|\bkeuangan\b|\bnominal\b|\bkeuntungan\b"),
            ("INTERNAL_POLICY", r"\bkebijakan internal\b|\bdraf keputusan\b|\bstrategis\b|\bhimbauan keamanan\b|\bprotokol\b"),
            ("INFRASTRUCTURE_METADATA", r"\bip address\b|\bserver utama\b|\bport jaringan\b|\bdatabase\b|\bfirewall\b")
        ]

    def analyze(self, request: RiskAnalyzerRequest) -> RiskAnalyzerResponse:
        text_lower = request.sanitized_text_content.lower()
        detected_entities = []
        
        high_matches_count = 0
        medium_matches_count = 0

        # Scan High Severity Patterns
        for entity_type, pattern, in self.high_severity_patterns:
            matches = re.findall(pattern, text_lower)
            if matches:
                high_matches_count += len(matches)
                detected_entities.append(RiskEntity(
                    entity_type=entity_type,
                    phrase=matches[0],
                    risk_impact=f"High Risk: Detected classified military, credential, vulnerability or investigation terms ({matches[0]})."
                ))

        # Scan Medium Severity Patterns
        for entity_type, pattern in self.medium_severity_patterns:
            matches = re.findall(pattern, text_lower)
            if matches:
                medium_matches_count += len(matches)
                detected_entities.append(RiskEntity(
                    entity_type=entity_type,
                    phrase=matches[0],
                    risk_impact=f"Medium Risk: Detected financial, internal policy or infrastructure terms ({matches[0]})."
                ))

        # Advanced Severity Scoring Logic
        # Base score is 1.00.
        # Each high match adds 2.5 points. Each medium match adds 1.2 points.
        # If any High match is detected, the minimum risk score is 7.50 (guarantees RAHASIA).
        # If any Medium match is detected, the minimum risk score is 4.50 (guarantees TERBATAS).
        score = 1.00 + (high_matches_count * 2.50) + (medium_matches_count * 1.20)

        if high_matches_count > 0 and score < 7.50:
            score = 7.50
        elif medium_matches_count > 0 and score < 4.50:
            score = 4.50

        risk_score = min(round(score, 2), 10.00)
        
        # Risk levels classification
        risk_level = "LOW"
        if risk_score >= 7.00:
            risk_level = "HIGH"
        elif risk_score >= 4.00:
            risk_level = "MEDIUM"

        return RiskAnalyzerResponse(
            letter_id=request.letter_id,
            risk_score=risk_score,
            risk_level=risk_level,
            detected_risk_entities=detected_entities,
            anomaly_flag=(risk_score >= 8.50)
        )
