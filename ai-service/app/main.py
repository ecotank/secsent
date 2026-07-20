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

        # Step 4: Compliance Audit Check
        comp_req = ComplianceRequest(
            letter_id=request.letter_id,
            header_metadata=HeaderMetadata(
                letter_number=request.letter_number,
                date=request.date,
                subject=request.subject
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
            recommendation=rec_res
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Multi-Agent pipeline processing error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
