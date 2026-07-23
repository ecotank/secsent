from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from app.schemas.contracts import (
    ClassifierRequest, ClassifierResponse,
    RiskAnalyzerRequest, RiskAnalyzerResponse,
    ComplianceRequest, ComplianceResponse,
    RecommenderRequest, RecommenderResponse,
    FullScanRequest, FullScanResponse, HeaderMetadata
)
from app.agents.classifier import MLDocumentClassifierAgent
from app.agents.sanitizer import PIISanitizer
from app.agents.risk_analyzer import AIRiskAnalyzerAgent
from app.agents.compliance import ComplianceAuditorAgent
from app.agents.recommender import SecurityRecommenderAgent

app = FastAPI(
    title="SecureOffice-AI Subsystem Service",
    description="Multi-Agentic AI Risk & Security Scanner for Secure Correspondence",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI Agents
classifier_agent = MLDocumentClassifierAgent()
pii_sanitizer = PIISanitizer()
risk_analyzer_agent = AIRiskAnalyzerAgent()
compliance_auditor_agent = ComplianceAuditorAgent()
security_recommender_agent = SecurityRecommenderAgent()


@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SecureOffice-AI Subsystem Service",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/v1/ai/classify", response_model=ClassifierResponse)
def classify_document(request: ClassifierRequest):
    try:
        return classifier_agent.classify(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification error: {str(e)}")


def conclude_subject_from_text(text: str) -> str:
    text_lower = text.lower()
    
    # 1. Identify primary formal correspondence types
    if "pemberitahuan" in text_lower:
        return "Surat Pemberitahuan"
    if "himbauan" in text_lower:
        return "Surat Himbauan"
    if "undangan" in text_lower:
        return "Surat Undangan"
    if "keputusan" in text_lower:
        return "Surat Keputusan"
    if "nota dinas" in text_lower:
        return "Nota Dinas"
    if "edaran" in text_lower:
        return "Surat Edaran"
    if "permohonan" in text_lower:
        return "Surat Permohonan"
    if "instruksi" in text_lower:
        return "Surat Instruksi"

    # 2. Key-based contextual fallbacks
    if "anggaran" in text_lower or "biaya" in text_lower or "pengadaan" in text_lower:
        if "keamanan" in text_lower or "firewall" in text_lower or "jaringan" in text_lower:
            return "Permohonan Pengadaan Perangkat Keamanan Jaringan & Firewall Enterprise"
        return "Permohonan Pengadaan Sarana dan Prasarana Operasional Instansi"
    if "password" in text_lower or "token" in text_lower or "kunci" in text_lower or "sandi" in text_lower:
        if "kepatuhan" in text_lower:
            return "Himbauan Kepatuhan Protokol Keamanan Informasi dan Sandi"
        return "Pengaturan Ulang Akses Kredensial Keamanan Ekosistem"
    
    # 3. Text Summarization fallback
    first_sentence = text.split(".")[0].strip()
    words = first_sentence.split()
    if len(words) > 8:
        return " ".join(words[:8]) + "..."
    return "Pemberitahuan Koordinasi Pelaksanaan Kegiatan Operasional"


@app.post("/api/v1/ai/analyze-risk", response_model=FullScanResponse)
def analyze_document_risk(request: FullScanRequest):
    try:
        # Step 1: Fast Categorization
        class_req = ClassifierRequest(
            letter_id=request.letter_id,
            raw_text_content=request.raw_text_content,
            sender_unit_code=request.sender_unit_code
        )
        class_res = classifier_agent.classify(class_req)

        # Step 2: Privacy-Preserving PII Redaction
        sanitized_text = pii_sanitizer.sanitize(request.raw_text_content)

        # Step 3: AI Risk Analysis
        risk_req = RiskAnalyzerRequest(
            letter_id=request.letter_id,
            sanitized_text_content=sanitized_text,
            category=class_res.predicted_category,
            sender_unit_clearance=request.sender_unit_clearance
        )
        risk_res = risk_analyzer_agent.analyze(risk_req)

        # Conclude formal subject line dynamically
        suggested = conclude_subject_from_text(request.raw_text_content)

        # Step 4: Compliance Audit Check using the finalized subject
        active_subject = request.subject if request.subject and request.subject != "Draft Surat Dinas" else suggested
        comp_req = ComplianceRequest(
            letter_id=request.letter_id,
            header_metadata=HeaderMetadata(
                letter_number=request.letter_number,
                date=request.date,
                subject=active_subject
            )
        )
        comp_res = compliance_auditor_agent.audit(comp_req)

        # Step 5: Formulate Security Recommendation Card
        rec_req = RecommenderRequest(
            letter_id=request.letter_id,
            classifier_output=class_res.dict(),
            risk_output=risk_res.dict(),
            compliance_output=comp_res.dict()
        )
        rec_res = security_recommender_agent.recommend(rec_req)

        return FullScanResponse(
            letter_id=request.letter_id,
            classifier=class_res,
            sanitized_text=sanitized_text,
            risk_analysis=risk_res,
            compliance=comp_res,
            recommendation=rec_res,
            suggested_subject=suggested
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Multi-Agent pipeline processing error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
