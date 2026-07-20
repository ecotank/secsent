import re
from app.schemas.contracts import RiskAnalyzerRequest, RiskAnalyzerResponse, RiskEntity


class AIRiskAnalyzerAgent:
    """Agent 2: AI Risk Analyzer Agent (Data Leakage & Anomaly Detection)"""

    def __init__(self):
        self.sensitive_keywords = [
            ("PROJECT_SECRET_CODE", r"\brahasia\b|\balpha\b|\bsecret\b", "Potential leak of unreleased operational code"),
            ("FINANCIAL_BUDGET", r"anggaran|biaya|proyek|pencairan", "Contains sensitive budget allocation details"),
            ("KEY_CREDENTIALS", r"password|token|kunci|credential", "Contains credential or secret keys"),
            ("POLICY_DRAFT", r"kebijakan|strategis|internal", "Contains internal strategic policy draft")
        ]

    def analyze(self, request: RiskAnalyzerRequest) -> RiskAnalyzerResponse:
        text_lower = request.sanitized_text_content.lower()
        detected_entities = []
        base_score = 1.50

        for entity_type, pattern, impact in self.sensitive_keywords:
            matches = re.findall(pattern, text_lower)
            if matches:
                base_score += len(matches) * 2.10
                detected_entities.append(RiskEntity(
                    entity_type=entity_type,
                    phrase=matches[0],
                    risk_impact=impact
                ))

        risk_score = min(round(base_score, 2), 10.00)
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
