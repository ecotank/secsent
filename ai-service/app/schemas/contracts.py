from typing import List, Optional
from pydantic import BaseModel, Field


class ClassifierRequest(BaseModel):
    letter_id: str
    raw_text_content: str
    sender_unit_code: str


class ClassifierResponse(BaseModel):
    letter_id: str
    predicted_category: str
    confidence_score: float
    predicted_urgency: str


class RiskEntity(BaseModel):
    entity_type: str
    phrase: str
    risk_impact: str


class RiskAnalyzerRequest(BaseModel):
    letter_id: str
    sanitized_text_content: str
    category: str
    sender_unit_clearance: str


class RiskAnalyzerResponse(BaseModel):
    letter_id: str
    risk_score: float
    risk_level: str
    detected_risk_entities: List[RiskEntity]
    anomaly_flag: bool


class HeaderMetadata(BaseModel):
    letter_number: str
    date: str
    subject: str


class ComplianceRequest(BaseModel):
    letter_id: str
    header_metadata: HeaderMetadata


class ComplianceResponse(BaseModel):
    letter_id: str
    compliance_status: str
    missing_elements: List[str]
    recommendations: List[str]


class RecommenderRequest(BaseModel):
    letter_id: str
    classifier_output: dict
    risk_output: dict
    compliance_output: dict


class RecommenderResponse(BaseModel):
    letter_id: str
    recommended_classification: str
    required_encryption: str
    disposition_restriction: str
    action_summary: str


class FullScanRequest(BaseModel):
    letter_id: str
    raw_text_content: str
    sender_unit_code: str
    sender_unit_clearance: str
    letter_number: Optional[str] = "ND/DRAFT/2026"
    date: Optional[str] = "2026-07-20"
    subject: Optional[str] = "Draft Surat Dinas"


class FullScanResponse(BaseModel):
    letter_id: str
    classifier: ClassifierResponse
    sanitized_text: str
    risk_analysis: RiskAnalyzerResponse
    compliance: ComplianceResponse
    recommendation: RecommenderResponse
    suggested_subject: Optional[str] = None
